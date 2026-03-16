const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');
const Activity = require('../models/Activity');

// Try loading AWS SDK modules
const aws = {};
const tryLoad = (pkg, key) => { try { aws[key] = require(pkg); } catch (e) { aws[key] = null; } };
tryLoad('@aws-sdk/client-ec2', 'ec2');
tryLoad('@aws-sdk/client-rds', 'rds');
tryLoad('@aws-sdk/client-s3', 's3');
tryLoad('@aws-sdk/client-lambda', 'lambda');
tryLoad('@aws-sdk/client-iam', 'iam');
tryLoad('@aws-sdk/client-cost-explorer', 'ce');
tryLoad('@aws-sdk/client-cloudtrail', 'ct');
tryLoad('@aws-sdk/client-sts', 'sts');

const SDK_AVAILABLE = !!(aws.ec2 && aws.iam && aws.ce && aws.sts);
console.log('AWS SDK available:', SDK_AVAILABLE);

// ── Helper: get credentials ──────────────────────────────────────────────────
async function getCreds(clientId, accountIndex = 0) {
  const client = await Client.findById(clientId);
  if (!client) throw { code: 'NOT_FOUND', message: 'Client not found' };

  // Multi-account support
  const accs = client.awsAccounts || [];
  if (accs.length > accountIndex && accs[accountIndex].accessKeyId && accs[accountIndex].secretAccessKey) {
    const acc = accs[accountIndex];
    return { creds: { accessKeyId: acc.accessKeyId, secretAccessKey: acc.secretAccessKey }, regions: acc.regions || client.awsRegions || ['ap-south-1'], primaryRegion: (acc.regions || client.awsRegions || ['ap-south-1'])[0], label: acc.label || 'Account ' + (accountIndex + 1), allAccounts: accs };
  }
  if (client.awsCredentials?.accessKeyId && client.awsCredentials?.secretAccessKey) {
    return { creds: { accessKeyId: client.awsCredentials.accessKeyId, secretAccessKey: client.awsCredentials.secretAccessKey }, regions: client.awsRegions || ['ap-south-1'], primaryRegion: (client.awsRegions || ['ap-south-1'])[0], label: 'Primary Account', allAccounts: [] };
  }
  throw { code: 'NO_CREDENTIALS', message: 'AWS credentials not configured for this client. Add IAM access key and secret key.' };
}

const noCredsResp = (res, msg) => res.json({ hasCredentials: false, hasData: false, message: msg || 'AWS credentials not configured' });
const noSdkResp = (res) => res.json({ hasCredentials: true, hasData: false, message: 'AWS SDK packages not installed on server. Run: npm install in backend.' });
const credErrResp = (res, err) => {
  if (err.name === 'InvalidClientTokenId' || err.name === 'InvalidAccessKeyId') return res.json({ hasCredentials: true, hasData: false, message: 'Invalid AWS Access Key ID. Please check credentials.', credentialError: true });
  if (err.name === 'SignatureDoesNotMatch') return res.json({ hasCredentials: true, hasData: false, message: 'Invalid AWS Secret Access Key. Please check credentials.', credentialError: true });
  if (err.name === 'AuthFailure') return res.json({ hasCredentials: true, hasData: false, message: 'AWS Authentication failed. Check your credentials.', credentialError: true });
  return res.json({ hasCredentials: true, hasData: false, message: 'AWS Error: ' + err.message });
};

// ── VERIFY CONNECTION ─────────────────────────────────────────────────────────
router.post('/verify/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds, primaryRegion, label } = await getCreds(req.params.clientId, accIdx);
    if (!aws.sts) return noSdkResp(res);
    const { STSClient, GetCallerIdentityCommand } = aws.sts;
    const client = new STSClient({ ...creds, region: primaryRegion });
    const id = await client.send(new GetCallerIdentityCommand({}));
    res.json({ connected: true, accountId: id.Account, arn: id.Arn, userId: id.UserId, label });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

// ── SECURITY AUDIT ────────────────────────────────────────────────────────────
router.get('/security/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds, regions, primaryRegion } = await getCreds(req.params.clientId, accIdx);
    if (!SDK_AVAILABLE) return noSdkResp(res);

    const findings = [];
    let score = 100;
    const client = await Client.findById(req.params.clientId);

    // IAM checks
    try {
      const { IAMClient, ListUsersCommand, GetAccountPasswordPolicyCommand, ListMFADevicesCommand, GetAccountSummaryCommand } = aws.iam;
      const iam = new IAMClient({ ...creds, region: 'us-east-1' });

      // Account summary for root usage
      try {
        const summary = await iam.send(new GetAccountSummaryCommand({}));
        if (summary.SummaryMap?.AccountMFAEnabled === 0) {
          findings.push({ id: 'SEC-IAM-ROOT-MFA', severity: 'CRITICAL', title: 'Root account MFA not enabled', resource: 'arn:aws:iam::' + (req.query.accountId || '') + ':root', region: 'global', service: 'IAM', remediation: 'Enable MFA on root account immediately', status: 'ACTIVE' });
          score -= 20;
        }
      } catch {}

      // Password policy
      try {
        await iam.send(new GetAccountPasswordPolicyCommand({}));
      } catch (e) {
        if (e.name === 'NoSuchEntityException') {
          findings.push({ id: 'SEC-IAM-PWD', severity: 'MEDIUM', title: 'No IAM account password policy', resource: 'arn:aws:iam::account', region: 'global', service: 'IAM', remediation: 'Configure IAM password policy with complexity requirements', status: 'ACTIVE' });
          score -= 5;
        }
      }

      // Users without MFA
      const users = await iam.send(new ListUsersCommand({ MaxItems: 100 }));
      for (const u of (users.Users || [])) {
        try {
          const mfa = await iam.send(new ListMFADevicesCommand({ UserName: u.UserName }));
          if (!mfa.MFADevices || mfa.MFADevices.length === 0) {
            findings.push({ id: 'SEC-IAM-MFA-' + u.UserName.slice(0, 10), severity: 'HIGH', title: 'IAM user without MFA: ' + u.UserName, resource: u.Arn, region: 'global', service: 'IAM', remediation: 'Enable MFA for ' + u.UserName, status: 'ACTIVE' });
            score -= 8;
          }
        } catch {}
      }
    } catch (e) { console.log('IAM check error:', e.message); }

    // EC2 Security Groups per region
    for (const reg of regions.slice(0, 3)) {
      try {
        const { EC2Client, DescribeSecurityGroupsCommand, DescribeVolumesCommand, DescribeVpcsCommand } = aws.ec2;
        const ec2 = new EC2Client({ ...creds, region: reg });

        const sgs = await ec2.send(new DescribeSecurityGroupsCommand({ MaxResults: 100 }));
        for (const sg of (sgs.SecurityGroups || [])) {
          for (const rule of (sg.IpPermissions || [])) {
            const openIPv4 = (rule.IpRanges || []).some(r => r.CidrIp === '0.0.0.0/0');
            const openIPv6 = (rule.Ipv6Ranges || []).some(r => r.CidrIpv6 === '::/0');
            if ((openIPv4 || openIPv6) && (rule.FromPort === 22 || (rule.FromPort === 0 && rule.ToPort === 65535 && rule.IpProtocol === '-1'))) {
              const isCrit = rule.IpProtocol === '-1';
              findings.push({ id: 'SEC-SG-SSH-' + sg.GroupId, severity: isCrit ? 'CRITICAL' : 'HIGH', title: isCrit ? 'Security Group allows ALL traffic: ' + (sg.GroupName || sg.GroupId) : 'SSH open to internet: ' + (sg.GroupName || sg.GroupId), resource: sg.GroupId + ' (' + reg + ')', region: reg, service: 'EC2', remediation: 'Restrict to specific IP ranges', status: 'ACTIVE' });
              score -= isCrit ? 15 : 10;
            }
            if ((openIPv4 || openIPv6) && (rule.FromPort === 3389 || rule.ToPort === 3389)) {
              findings.push({ id: 'SEC-SG-RDP-' + sg.GroupId, severity: 'HIGH', title: 'RDP open to internet: ' + (sg.GroupName || sg.GroupId), resource: sg.GroupId + ' (' + reg + ')', region: reg, service: 'EC2', remediation: 'Restrict RDP to VPN or specific IPs', status: 'ACTIVE' });
              score -= 10;
            }
          }
        }

        // Unencrypted EBS
        const vols = await ec2.send(new DescribeVolumesCommand({ MaxResults: 100 }));
        const unenc = (vols.Volumes || []).filter(v => !v.Encrypted);
        if (unenc.length > 0) {
          findings.push({ id: 'SEC-EBS-' + reg, severity: 'MEDIUM', title: unenc.length + ' unencrypted EBS volume(s) in ' + reg, resource: unenc.slice(0,2).map(v => v.VolumeId).join(', '), region: reg, service: 'EBS', remediation: 'Enable EBS encryption by default', status: 'ACTIVE' });
          score -= Math.min(unenc.length * 3, 10);
        }

        // VPC Flow Logs
        const vpcs = await ec2.send(new DescribeVpcsCommand({}));
        if ((vpcs.Vpcs || []).length > 0) {
          findings.push({ id: 'SEC-VPC-FL-' + reg, severity: 'LOW', title: 'Verify VPC Flow Logs enabled in ' + reg, resource: (vpcs.Vpcs || []).map(v => v.VpcId).join(', '), region: reg, service: 'VPC', remediation: 'Enable VPC Flow Logs for network monitoring', status: 'REVIEW' });
        }
      } catch (e) { if (e.name === 'InvalidClientTokenId' || e.name === 'AuthFailure') return credErrResp(res, e); }
    }

    // CloudTrail
    try {
      const { CloudTrailClient, DescribeTrailsCommand, GetTrailStatusCommand } = aws.ct;
      const ct = new CloudTrailClient({ ...creds, region: primaryRegion });
      const trails = await ct.send(new DescribeTrailsCommand({ includeShadowTrails: false }));
      if (!trails.trailList || trails.trailList.length === 0) {
        findings.push({ id: 'SEC-CT-001', severity: 'HIGH', title: 'CloudTrail not configured in ' + primaryRegion, resource: primaryRegion, region: primaryRegion, service: 'CloudTrail', remediation: 'Enable multi-region CloudTrail with log file validation', status: 'ACTIVE' });
        score -= 12;
      }
    } catch {}

    // S3
    try {
      const { S3Client, ListBucketsCommand } = aws.s3;
      const s3 = new S3Client({ ...creds, region: primaryRegion });
      const buckets = await s3.send(new ListBucketsCommand({}));
      if ((buckets.Buckets || []).length > 0) {
        findings.push({ id: 'SEC-S3-AUDIT', severity: 'INFORMATIONAL', title: 'S3 public access audit needed — ' + buckets.Buckets.length + ' buckets', resource: 'All S3 buckets', region: 'global', service: 'S3', remediation: 'Audit each bucket for public access settings via AWS Console', status: 'REVIEW' });
      }
    } catch {}

    score = Math.max(0, Math.min(100, Math.round(score)));
    const summary = {
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      informational: findings.filter(f => f.severity === 'INFORMATIONAL').length,
      score
    };

    // Log activity
    await Activity.create({ clientId: req.params.clientId, clientName: client?.name, action: 'Security audit completed — score: ' + score + '/100', category: 'security', severity: score < 60 ? 'critical' : score < 80 ? 'warning' : 'success', performedBy: req.user?.email || 'system', performedByName: req.user?.name || 'System', details: summary.critical + ' critical · ' + summary.high + ' high · ' + findings.length + ' total findings' }).catch(() => {});

    res.json({ hasCredentials: true, hasData: true, findings, summary, scannedAt: new Date().toISOString(), regionsScanned: regions });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

// ── COST ──────────────────────────────────────────────────────────────────────
router.get('/cost/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds } = await getCreds(req.params.clientId, accIdx);
    if (!aws.ce) return noSdkResp(res);

    const { CostExplorerClient, GetCostAndUsageCommand, GetAnomaliesCommand, GetAnomalyMonitorsCommand } = aws.ce;
    const ce = new CostExplorerClient({ ...creds, region: 'us-east-1' });

    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];

    // Monthly cost by service
    const costResp = await ce.send(new GetCostAndUsageCommand({
      TimePeriod: { Start: startDate, End: endDate },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
    }));

    const months = {};
    for (const period of (costResp.ResultsByTime || [])) {
      const month = period.TimePeriod.Start.slice(0, 7);
      months[month] = { total: 0, services: {}, label: new Date(period.TimePeriod.Start + 'T00:00:00').toLocaleString('default', { month: 'short', year: 'numeric' }) };
      for (const g of (period.Groups || [])) {
        const cost = parseFloat(g.Metrics.UnblendedCost.Amount || '0');
        if (cost > 0.01) {
          months[month].services[g.Keys[0]] = (months[month].services[g.Keys[0]] || 0) + cost;
          months[month].total += cost;
        }
      }
    }

    const monthKeys = Object.keys(months).sort();
    const lastMonthKey = monthKeys[monthKeys.length - 1];
    const prevMonthKey = monthKeys[monthKeys.length - 2];

    const serviceBreakdown = Object.entries(months[lastMonthKey]?.services || {})
      .sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([svc, cost]) => ({
        service: svc,
        lastMonth: parseFloat(cost.toFixed(2)),
        twoMonthsAgo: parseFloat((months[prevMonthKey]?.services[svc] || 0).toFixed(2)),
        percentage: months[lastMonthKey]?.total > 0 ? parseFloat(((cost / months[lastMonthKey].total) * 100).toFixed(1)) : 0
      }));

    const monthlyTrend = monthKeys.map(k => ({ month: months[k]?.label || k, cost: parseFloat((months[k]?.total || 0).toFixed(2)), key: k }));

    // Anomalies
    let anomalies = [];
    try {
      const anomalyResp = await ce.send(new GetAnomaliesCommand({
        DateInterval: { StartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], EndDate: endDate }
      }));
      anomalies = (anomalyResp.Anomalies || []).map(a => ({
        id: a.AnomalyId,
        service: a.DimensionValue || a.RootCauses?.map(r => r.Service).join(', ') || 'Unknown',
        startDate: a.AnomalyStartDate,
        endDate: a.AnomalyEndDate,
        anomalyAmount: '$' + parseFloat(a.Impact?.TotalImpact || 0).toFixed(2),
        expectedAmount: '$' + parseFloat(a.Impact?.TotalExpectedSpend || 0).toFixed(2),
        actualAmount: '$' + parseFloat(a.Impact?.TotalActualSpend || 0).toFixed(2),
        severity: parseFloat(a.Impact?.TotalImpact || 0) > 1000 ? 'HIGH' : 'MEDIUM',
        feedback: a.Feedback
      }));
    } catch {}

    res.json({
      hasCredentials: true, hasData: true,
      totalLastMonth: parseFloat((months[lastMonthKey]?.total || 0).toFixed(2)),
      totalTwoMonthsAgo: parseFloat((months[prevMonthKey]?.total || 0).toFixed(2)),
      monthlyTrend, serviceBreakdown, anomalies,
      unusedEIPs: [], oldAMIs: [], oldSnapshots: [], oldRDSSnapshots: [],
      scannedAt: new Date().toISOString()
    });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    if (err.name === 'AccessDeniedException') return res.json({ hasCredentials: true, hasData: false, message: 'Cost Explorer access denied. Add ce:GetCostAndUsage permission to IAM user.' });
    return credErrResp(res, err);
  }
});

// ── WASTE & CLEANUP ───────────────────────────────────────────────────────────
router.get('/waste/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds, regions, primaryRegion } = await getCreds(req.params.clientId, accIdx);
    if (!aws.ec2) return noSdkResp(res);

    const { EC2Client, DescribeAddressesCommand, DescribeImagesCommand, DescribeSnapshotsCommand } = aws.ec2;
    const { RDSClient, DescribeDBSnapshotsCommand } = aws.rds;
    const THREE_MONTHS = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const unusedEIPs = [], oldAMIs = [], oldSnapshots = [], oldRDSSnapshots = [];

    for (const reg of regions.slice(0, 4)) {
      const ec2 = new EC2Client({ ...creds, region: reg });

      try {
        const eips = await ec2.send(new DescribeAddressesCommand({}));
        for (const a of (eips.Addresses || [])) {
          if (!a.AssociationId) unusedEIPs.push({ allocationId: a.AllocationId, publicIp: a.PublicIp, region: reg, monthlyCost: '$3.65', instanceId: null });
        }
      } catch {}

      try {
        const amis = await ec2.send(new DescribeImagesCommand({ Owners: ['self'], MaxResults: 100 }));
        for (const ami of (amis.Images || [])) {
          if (new Date(ami.CreationDate) < THREE_MONTHS) {
            const age = Math.floor((Date.now() - new Date(ami.CreationDate).getTime()) / (24 * 60 * 60 * 1000));
            oldAMIs.push({ imageId: ami.ImageId, name: ami.Name || '(unnamed)', createdDate: ami.CreationDate?.split('T')[0], ageDays: age, snapshotCount: (ami.BlockDeviceMappings || []).length, region: reg, estimatedCost: '$' + ((ami.BlockDeviceMappings || []).length * 0.5).toFixed(2) + '/mo' });
          }
        }
      } catch {}

      try {
        const snaps = await ec2.send(new DescribeSnapshotsCommand({ OwnerIds: ['self'], MaxResults: 200 }));
        for (const s of (snaps.Snapshots || [])) {
          if (s.StartTime && new Date(s.StartTime) < THREE_MONTHS) {
            const age = Math.floor((Date.now() - new Date(s.StartTime).getTime()) / (24 * 60 * 60 * 1000));
            oldSnapshots.push({ snapshotId: s.SnapshotId, volumeId: s.VolumeId || 'N/A', size: (s.VolumeSize || 0) + ' GB', createdDate: s.StartTime?.split('T')[0], ageDays: age, region: reg, estimatedCost: '$' + ((s.VolumeSize || 0) * 0.05).toFixed(2) + '/mo', description: s.Description?.slice(0, 50) });
          }
        }
      } catch {}

      try {
        const rdsClient = new RDSClient({ ...creds, region: reg });
        const rdsSnaps = await rdsClient.send(new DescribeDBSnapshotsCommand({ SnapshotType: 'manual', MaxRecords: 50 }));
        for (const s of (rdsSnaps.DBSnapshots || [])) {
          if (s.SnapshotCreateTime && new Date(s.SnapshotCreateTime) < THREE_MONTHS) {
            const age = Math.floor((Date.now() - new Date(s.SnapshotCreateTime).getTime()) / (24 * 60 * 60 * 1000));
            oldRDSSnapshots.push({ snapshotId: s.DBSnapshotIdentifier, dbInstance: s.DBInstanceIdentifier, size: (s.AllocatedStorage || 0) + ' GB', createdDate: s.SnapshotCreateTime?.split('T')[0], ageDays: age, region: reg, estimatedCost: '$' + ((s.AllocatedStorage || 0) * 0.095).toFixed(2) + '/mo' });
          }
        }
      } catch {}
    }

    res.json({ hasCredentials: true, hasData: true, unusedEIPs, oldAMIs, oldSnapshots, oldRDSSnapshots, scannedAt: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

// ── INVENTORY ─────────────────────────────────────────────────────────────────
router.get('/inventory/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds, regions, primaryRegion } = await getCreds(req.params.clientId, accIdx);
    if (!aws.ec2) return noSdkResp(res);

    const { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeAddressesCommand, DescribeSecurityGroupsCommand, DescribeVpcsCommand, DescribeSubnetsCommand } = aws.ec2;
    const { RDSClient, DescribeDBInstancesCommand } = aws.rds;
    const { S3Client, ListBucketsCommand } = aws.s3;
    const { LambdaClient, ListFunctionsCommand } = aws.lambda;

    const allRegions = req.query.allRegions === 'true';
    const targetRegion = req.query.region;
    const scanRegions = allRegions ? regions : (targetRegion ? [targetRegion] : [primaryRegion]);

    const result = { regions: {}, totals: { ec2: 0, rds: 0, s3: 0, lambda: 0, volumes: 0, vpcs: 0, securityGroups: 0, elasticIPs: 0, subnets: 0 }, s3Buckets: [] };

    // S3 global
    try {
      const s3 = new S3Client({ ...creds, region: primaryRegion });
      const buckets = await s3.send(new ListBucketsCommand({}));
      result.s3Buckets = (buckets.Buckets || []).map(b => ({ name: b.Name, createdAt: b.CreationDate }));
      result.totals.s3 = result.s3Buckets.length;
    } catch {}

    for (const reg of scanRegions) {
      const rd = { ec2: [], rds: [], lambda: [], volumes: [], vpcs: [], subnets: [], securityGroups: [], elasticIPs: [] };

      // EC2
      try {
        const ec2 = new EC2Client({ ...creds, region: reg });
        const resp = await ec2.send(new DescribeInstancesCommand({ MaxResults: 200 }));
        rd.ec2 = (resp.Reservations || []).flatMap(r => r.Instances || []).map(i => ({
          id: i.InstanceId, name: (i.Tags || []).find(t => t.Key === 'Name')?.Value || '(no name)',
          type: i.InstanceType, state: i.State?.Name,
          az: i.Placement?.AvailabilityZone, privateIp: i.PrivateIpAddress,
          publicIp: i.PublicIpAddress || null, platform: i.Platform || 'linux',
          launchTime: i.LaunchTime, vpcId: i.VpcId,
          env: (i.Tags || []).find(t => t.Key === 'Environment' || t.Key === 'Env')?.Value || 'N/A'
        }));
        result.totals.ec2 += rd.ec2.length;
      } catch (e) { if (e.name === 'InvalidClientTokenId' || e.name === 'AuthFailure') return credErrResp(res, e); }

      // EBS Volumes
      try {
        const ec2 = new EC2Client({ ...creds, region: reg });
        const resp = await ec2.send(new DescribeVolumesCommand({ MaxResults: 200 }));
        rd.volumes = (resp.Volumes || []).map(v => ({
          id: v.VolumeId, size: v.Size, type: v.VolumeType, state: v.State,
          encrypted: v.Encrypted, az: v.AvailabilityZone,
          attachedTo: (v.Attachments || []).map(a => a.InstanceId).join(', ') || null
        }));
        result.totals.volumes += rd.volumes.length;
      } catch {}

      // RDS
      try {
        const rds = new RDSClient({ ...creds, region: reg });
        const resp = await rds.send(new DescribeDBInstancesCommand({ MaxRecords: 100 }));
        rd.rds = (resp.DBInstances || []).map(db => ({
          id: db.DBInstanceIdentifier, engine: db.Engine, engineVersion: db.EngineVersion,
          class: db.DBInstanceClass, status: db.DBInstanceStatus, multiAZ: db.MultiAZ,
          storage: db.AllocatedStorage, endpoint: db.Endpoint?.Address,
          encrypted: db.StorageEncrypted
        }));
        result.totals.rds += rd.rds.length;
      } catch {}

      // Lambda
      try {
        const lam = new LambdaClient({ ...creds, region: reg });
        const resp = await lam.send(new ListFunctionsCommand({ MaxItems: 50 }));
        rd.lambda = (resp.Functions || []).map(f => ({
          name: f.FunctionName, runtime: f.Runtime, memory: f.MemorySize,
          timeout: f.Timeout, lastModified: f.LastModified
        }));
        result.totals.lambda += rd.lambda.length;
      } catch {}

      // VPCs
      try {
        const ec2 = new EC2Client({ ...creds, region: reg });
        const resp = await ec2.send(new DescribeVpcsCommand({}));
        rd.vpcs = (resp.Vpcs || []).map(v => ({ id: v.VpcId, cidr: v.CidrBlock, isDefault: v.IsDefault, state: v.State, name: (v.Tags || []).find(t => t.Key === 'Name')?.Value }));
        result.totals.vpcs += rd.vpcs.length;
      } catch {}

      // Security Groups
      try {
        const ec2 = new EC2Client({ ...creds, region: reg });
        const resp = await ec2.send(new DescribeSecurityGroupsCommand({ MaxResults: 200 }));
        rd.securityGroups = (resp.SecurityGroups || []).map(sg => ({
          id: sg.GroupId, name: sg.GroupName, vpcId: sg.VpcId, inboundRules: (sg.IpPermissions || []).length
        }));
        result.totals.securityGroups += rd.securityGroups.length;
      } catch {}

      // Elastic IPs
      try {
        const ec2 = new EC2Client({ ...creds, region: reg });
        const resp = await ec2.send(new DescribeAddressesCommand({}));
        rd.elasticIPs = (resp.Addresses || []).map(a => ({
          allocationId: a.AllocationId, publicIp: a.PublicIp, associated: !!a.AssociationId, instanceId: a.InstanceId || null
        }));
        result.totals.elasticIPs += rd.elasticIPs.length;
      } catch {}

      result.regions[reg] = rd;
    }

    const hasAnyData = result.totals.ec2 > 0 || result.totals.rds > 0 || result.totals.s3 > 0 || result.totals.lambda > 0;
    res.json({ hasCredentials: true, hasData: hasAnyData, ...result, scannedAt: new Date().toISOString(), note: hasAnyData ? null : 'No resources found in selected region(s).' });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

// ── PATCHING (real instances) ─────────────────────────────────────────────────
router.get('/patching/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds, primaryRegion } = await getCreds(req.params.clientId, accIdx);
    if (!aws.ec2) return noSdkResp(res);

    const { EC2Client, DescribeInstancesCommand } = aws.ec2;
    const ec2 = new EC2Client({ ...creds, region: primaryRegion });
    const resp = await ec2.send(new DescribeInstancesCommand({ Filters: [{ Name: 'instance-state-name', Values: ['running', 'stopped'] }], MaxResults: 100 }));

    const instances = (resp.Reservations || []).flatMap(r => r.Instances || []).map(i => ({
      id: i.InstanceId,
      name: (i.Tags || []).find(t => t.Key === 'Name')?.Value || i.InstanceId,
      os: i.Platform === 'windows' ? 'Windows' : (i.ImageId ? 'Linux' : 'Linux'),
      ip: i.PrivateIpAddress || 'N/A',
      type: i.InstanceType,
      state: i.State?.Name,
      env: (i.Tags || []).find(t => t.Key === 'Environment' || t.Key === 'Env')?.Value || 'Production',
      region: primaryRegion
    }));

    res.json({ hasCredentials: true, hasData: instances.length > 0, instances, scannedAt: new Date().toISOString(), note: instances.length === 0 ? 'No running or stopped instances found.' : null });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

// ── SSL entries from AWS (RIs, ACM certs) + manual entries ───────────────────
router.get('/ssl-aws/:clientId', authMiddleware, async (req, res) => {
  try {
    const accIdx = parseInt(req.query.account || '0');
    const { creds, regions, primaryRegion } = await getCreds(req.params.clientId, accIdx);
    const entries = [];

    if (!aws.ec2) return res.json({ hasCredentials: true, hasData: false, entries: [], message: 'AWS SDK not available' });

    // EC2 Reserved Instances
    try {
      const { EC2Client, DescribeReservedInstancesCommand } = aws.ec2;
      for (const reg of regions.slice(0, 3)) {
        const ec2 = new EC2Client({ ...creds, region: reg });
        const resp = await ec2.send(new DescribeReservedInstancesCommand({ Filters: [{ Name: 'state', Values: ['active'] }] }));
        for (const ri of (resp.ReservedInstances || [])) {
          if (ri.End) {
            entries.push({ type: 'ri_ec2', name: ri.InstanceType + ' x' + ri.InstanceCount + ' RI (' + reg + ')', expiryDate: ri.End, source: 'aws', daysRemaining: Math.floor((new Date(ri.End) - new Date()) / (24 * 60 * 60 * 1000)), offeringClass: ri.OfferingClass, paymentOption: ri.OfferingType, region: reg });
          }
        }
      }
    } catch {}

    // RDS Reserved Instances
    try {
      const { RDSClient, DescribeReservedDBInstancesCommand } = aws.rds;
      for (const reg of regions.slice(0, 2)) {
        const rds = new RDSClient({ ...creds, region: reg });
        const resp = await rds.send(new DescribeReservedDBInstancesCommand({ MaxRecords: 50 }));
        for (const ri of (resp.ReservedDBInstances || [])) {
          if (ri.StartTime) {
            const expiry = new Date(new Date(ri.StartTime).getTime() + ri.Duration * 1000);
            entries.push({ type: 'ri_rds', name: ri.DBInstanceClass + ' x' + ri.DBInstanceCount + ' RDS RI (' + reg + ')', expiryDate: expiry.toISOString(), source: 'aws', daysRemaining: Math.floor((expiry - new Date()) / (24 * 60 * 60 * 1000)), engine: ri.ProductDescription, region: reg });
          }
        }
      }
    } catch {}

    res.json({ hasCredentials: true, hasData: entries.length > 0, entries, scannedAt: new Date().toISOString() });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

// ── COMPUTE OPTIMIZER (with proper error handling) ────────────────────────────
router.get('/optimizer/:clientId', authMiddleware, async (req, res) => {
  try {
    const { creds, primaryRegion } = await getCreds(req.params.clientId);
    res.json({
      hasCredentials: true, hasData: false,
      message: 'AWS Compute Optimizer requires opt-in. Enable it at AWS Console → Compute Optimizer → Get Started, then allow 24-48 hours for recommendations.',
      link: 'https://console.aws.amazon.com/compute-optimizer/',
      steps: [
        'Go to AWS Console → Compute Optimizer',
        'Click "Get Started" to opt-in your account',
        'Wait 24-48 hours for recommendations to generate',
        'Re-sync this panel to see right-sizing recommendations'
      ]
    });
  } catch (err) {
    if (err.code === 'NO_CREDENTIALS') return noCredsResp(res, err.message);
    return credErrResp(res, err);
  }
});

module.exports = router;
