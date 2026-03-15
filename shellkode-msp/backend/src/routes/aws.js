const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');

// ─── AWS SDK imports (only used when credentials provided) ───────────────────
let EC2Client, DescribeInstancesCommand, DescribeRegionsCommand,
    DescribeVolumesCommand, DescribeSnapshotsCommand, DescribeAddressesCommand,
    DescribeImagesCommand, DescribeSecurityGroupsCommand, DescribeVpcsCommand;
let RDSClient, DescribeDBInstancesCommand, DescribeDBSnapshotsCommand;
let S3Client, ListBucketsCommand;
let LambdaClient, ListFunctionsCommand;
let CostExplorerClient, GetCostAndUsageCommand, GetCostAndUsageWithResourcesCommand, GetAnomaliesCommand;
let IAMClient, ListUsersCommand, GetAccountPasswordPolicyCommand, ListMFADevicesCommand, GetAccountSummaryCommand;
let CloudTrailClient, DescribeTrailsCommand;
let ComputeOptimizerClient, GetEC2InstanceRecommendationsCommand, GetEBSVolumeRecommendationsCommand, GetLambdaFunctionRecommendationsCommand;
let STSClient, GetCallerIdentityCommand;

try {
  ({ EC2Client, DescribeInstancesCommand, DescribeRegionsCommand, DescribeVolumesCommand,
     DescribeSnapshotsCommand, DescribeAddressesCommand, DescribeImagesCommand,
     DescribeSecurityGroupsCommand, DescribeVpcsCommand } = require('@aws-sdk/client-ec2'));
  ({ RDSClient, DescribeDBInstancesCommand, DescribeDBSnapshotsCommand } = require('@aws-sdk/client-rds'));
  ({ S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3'));
  ({ LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda'));
  ({ CostExplorerClient, GetCostAndUsageCommand } = require('@aws-sdk/client-cost-explorer'));
  ({ IAMClient, ListUsersCommand, GetAccountPasswordPolicyCommand, ListMFADevicesCommand, GetAccountSummaryCommand } = require('@aws-sdk/client-iam'));
  ({ CloudTrailClient, DescribeTrailsCommand } = require('@aws-sdk/client-cloudtrail'));
  ({ STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts'));
  console.log('✅ AWS SDK loaded');
} catch (e) {
  console.log('⚠️ AWS SDK not installed — running in mock mode');
}

// ─── Helper: get credentials for client ──────────────────────────────────────
async function getCredentials(clientId, accountIndex = 0) {
  const client = await Client.findById(clientId);
  if (!client) throw new Error('Client not found');

  // Support multiple accounts
  const accounts = client.awsAccounts || [];
  if (accounts.length > 0 && accounts[accountIndex]) {
    const acc = accounts[accountIndex];
    if (!acc.accessKeyId || !acc.secretAccessKey) throw new Error('AWS credentials not configured');
    return {
      credentials: { accessKeyId: acc.accessKeyId, secretAccessKey: acc.secretAccessKey },
      regions: acc.regions || client.awsRegions || ['ap-south-1'],
      primaryRegion: (acc.regions || client.awsRegions || ['ap-south-1'])[0],
      accountLabel: acc.label || 'Primary'
    };
  }

  if (!client.awsCredentials?.accessKeyId || !client.awsCredentials?.secretAccessKey) {
    throw new Error('AWS credentials not configured for this client');
  }
  return {
    credentials: { accessKeyId: client.awsCredentials.accessKeyId, secretAccessKey: client.awsCredentials.secretAccessKey },
    regions: client.awsRegions || ['ap-south-1'],
    primaryRegion: (client.awsRegions || ['ap-south-1'])[0],
    accountLabel: 'Primary'
  };
}

// ─── Verify AWS connection ────────────────────────────────────────────────────
router.post('/verify/:clientId', authMiddleware, async (req, res) => {
  try {
    const { credentials, primaryRegion } = await getCredentials(req.params.clientId);
    if (!STSClient) return res.json({ connected: false, error: 'AWS SDK not available' });

    const sts = new STSClient({ ...credentials, region: primaryRegion });
    const identity = await sts.send(new GetCallerIdentityCommand({}));
    res.json({ connected: true, accountId: identity.Account, arn: identity.Arn, userId: identity.UserId });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

// ─── SECURITY AUDIT ──────────────────────────────────────────────────────────
router.get('/security/:clientId', authMiddleware, async (req, res) => {
  try {
    const { credentials, regions, primaryRegion } = await getCredentials(req.params.clientId);

    if (!IAMClient) {
      return res.json({ hasCredentials: true, hasData: false, message: 'AWS SDK not available on server', findings: [], summary: null });
    }

    const findings = [];
    let score = 100;

    // IAM checks
    try {
      const iam = new IAMClient({ ...credentials, region: 'us-east-1' });
      const users = await iam.send(new ListUsersCommand({ MaxItems: 100 }));
      const userList = users.Users || [];

      for (const u of userList) {
        try {
          const mfaResp = await iam.send(new ListMFADevicesCommand({ UserName: u.UserName }));
          if (!mfaResp.MFADevices || mfaResp.MFADevices.length === 0) {
            findings.push({ id: 'SEC-IAM-' + u.UserName.slice(0,8).toUpperCase(), severity: 'HIGH', title: 'IAM User without MFA: ' + u.UserName, resource: u.Arn, region: 'global', service: 'IAM', remediation: 'Enable MFA for this IAM user', status: 'ACTIVE' });
            score -= 8;
          }
        } catch {}
      }

      try {
        await iam.send(new GetAccountPasswordPolicyCommand({}));
      } catch (e) {
        if (e.name === 'NoSuchEntityException') {
          findings.push({ id: 'SEC-IAM-PWD', severity: 'MEDIUM', title: 'No IAM account password policy configured', resource: 'arn:aws:iam::account', region: 'global', service: 'IAM', remediation: 'Configure a strong IAM password policy', status: 'ACTIVE' });
          score -= 5;
        }
      }
    } catch (e) { console.log('IAM check failed:', e.message); }

    // EC2 Security Group checks
    try {
      const ec2 = new EC2Client({ ...credentials, region: primaryRegion });
      const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({}));
      for (const sg of (sgResp.SecurityGroups || [])) {
        for (const rule of (sg.IpPermissions || [])) {
          const openToWorld = (rule.IpRanges || []).some(r => r.CidrIp === '0.0.0.0/0');
          if (openToWorld && (rule.FromPort === 22 || rule.ToPort === 22)) {
            findings.push({ id: 'SEC-EC2-SSH-' + sg.GroupId, severity: 'HIGH', title: 'Security Group allows SSH from 0.0.0.0/0', resource: sg.GroupId + ' (' + (sg.GroupName || '') + ')', region: primaryRegion, service: 'EC2', remediation: 'Restrict SSH to specific IP ranges', status: 'ACTIVE' });
            score -= 10;
          }
          if (openToWorld && (rule.FromPort === 3389 || rule.ToPort === 3389)) {
            findings.push({ id: 'SEC-EC2-RDP-' + sg.GroupId, severity: 'HIGH', title: 'Security Group allows RDP from 0.0.0.0/0', resource: sg.GroupId, region: primaryRegion, service: 'EC2', remediation: 'Restrict RDP to specific IP ranges', status: 'ACTIVE' });
            score -= 10;
          }
          if (openToWorld && rule.IpProtocol === '-1') {
            findings.push({ id: 'SEC-EC2-ALL-' + sg.GroupId, severity: 'CRITICAL', title: 'Security Group allows ALL traffic from 0.0.0.0/0', resource: sg.GroupId, region: primaryRegion, service: 'EC2', remediation: 'Remove open inbound rules immediately', status: 'ACTIVE' });
            score -= 20;
          }
        }
      }
    } catch (e) { console.log('SG check failed:', e.message); }

    // S3 public access check
    try {
      const s3 = new S3Client({ ...credentials, region: primaryRegion });
      const buckets = await s3.send(new ListBucketsCommand({}));
      if ((buckets.Buckets || []).length > 0) {
        findings.push({ id: 'SEC-S3-AUDIT', severity: 'INFORMATIONAL', title: 'S3 bucket public access audit recommended', resource: 'All S3 buckets (' + buckets.Buckets.length + ' total)', region: 'global', service: 'S3', remediation: 'Review each bucket public access settings via AWS Console > S3 > Block Public Access', status: 'REVIEW' });
      }
    } catch (e) {}

    // CloudTrail check
    try {
      const ct = new CloudTrailClient({ ...credentials, region: primaryRegion });
      const trails = await ct.send(new DescribeTrailsCommand({ includeShadowTrails: false }));
      if (!trails.trailList || trails.trailList.length === 0) {
        findings.push({ id: 'SEC-CT-001', severity: 'MEDIUM', title: 'CloudTrail not enabled in this region', resource: 'CloudTrail · ' + primaryRegion, region: primaryRegion, service: 'CloudTrail', remediation: 'Enable CloudTrail with multi-region trail and log validation', status: 'ACTIVE' });
        score -= 8;
      }
    } catch (e) {}

    // EBS encryption check
    try {
      const ec2 = new EC2Client({ ...credentials, region: primaryRegion });
      const vols = await ec2.send(new DescribeVolumesCommand({ MaxResults: 50 }));
      const unencrypted = (vols.Volumes || []).filter(v => !v.Encrypted);
      if (unencrypted.length > 0) {
        findings.push({ id: 'SEC-EBS-ENC', severity: 'MEDIUM', title: unencrypted.length + ' EBS volume(s) not encrypted', resource: unencrypted.slice(0,3).map(v => v.VolumeId).join(', ') + (unencrypted.length > 3 ? ' +' + (unencrypted.length - 3) + ' more' : ''), region: primaryRegion, service: 'EBS', remediation: 'Enable EBS encryption by default and re-create unencrypted volumes', status: 'ACTIVE' });
        score -= 5 * Math.min(unencrypted.length, 3);
      }
    } catch (e) {}

    score = Math.max(0, Math.min(100, score));
    const summary = {
      critical: findings.filter(f => f.severity === 'CRITICAL').length,
      high: findings.filter(f => f.severity === 'HIGH').length,
      medium: findings.filter(f => f.severity === 'MEDIUM').length,
      low: findings.filter(f => f.severity === 'LOW').length,
      informational: findings.filter(f => f.severity === 'INFORMATIONAL').length,
      score
    };

    res.json({ hasCredentials: true, hasData: findings.length > 0, findings, summary, scannedAt: new Date().toISOString() });
  } catch (err) {
    if (err.message.includes('credentials not configured')) {
      return res.json({ hasCredentials: false, hasData: false, message: err.message });
    }
    if (err.name === 'InvalidClientTokenId' || err.name === 'AuthFailure') {
      return res.json({ hasCredentials: true, hasData: false, message: 'Invalid AWS credentials. Please check your Access Key and Secret.', credentialError: true });
    }
    res.json({ hasCredentials: true, hasData: false, message: 'Scan failed: ' + err.message });
  }
});

// ─── INVENTORY ───────────────────────────────────────────────────────────────
router.get('/inventory/:clientId', authMiddleware, async (req, res) => {
  const region = req.query.region;
  const allRegions = req.query.allRegions === 'true';
  try {
    const { credentials, regions, primaryRegion } = await getCredentials(req.params.clientId);
    const targetRegions = allRegions ? regions : (region ? [region] : [primaryRegion]);

    if (!EC2Client) return res.json({ hasCredentials: true, hasData: false, message: 'AWS SDK not available' });

    const result = { regions: {}, totals: { ec2: 0, rds: 0, s3: 0, lambda: 0, volumes: 0, vpcs: 0, securityGroups: 0, elasticIPs: 0 } };

    // S3 is global
    try {
      const s3 = new S3Client({ ...credentials, region: primaryRegion });
      const buckets = await s3.send(new ListBucketsCommand({}));
      result.totals.s3 = (buckets.Buckets || []).length;
      result.s3Buckets = (buckets.Buckets || []).map(b => ({ name: b.Name, createdAt: b.CreationDate }));
    } catch {}

    for (const reg of targetRegions) {
      const regionData = { ec2: [], rds: [], lambda: [], volumes: [], vpcs: [], securityGroups: [], elasticIPs: [] };

      // EC2
      try {
        const ec2 = new EC2Client({ ...credentials, region: reg });
        const resp = await ec2.send(new DescribeInstancesCommand({ MaxResults: 100 }));
        regionData.ec2 = (resp.Reservations || []).flatMap(r => r.Instances || []).map(i => ({
          id: i.InstanceId, name: (i.Tags || []).find(t => t.Key === 'Name')?.Value || '(unnamed)',
          type: i.InstanceType, state: i.State?.Name, az: i.Placement?.AvailabilityZone,
          privateIp: i.PrivateIpAddress, publicIp: i.PublicIpAddress || null,
          platform: i.Platform || 'linux', launchTime: i.LaunchTime, region: reg
        }));
        result.totals.ec2 += regionData.ec2.length;
      } catch (e) { console.log('EC2 inventory error ' + reg + ':', e.message); }

      // Volumes
      try {
        const ec2 = new EC2Client({ ...credentials, region: reg });
        const resp = await ec2.send(new DescribeVolumesCommand({ MaxResults: 100 }));
        regionData.volumes = (resp.Volumes || []).map(v => ({
          id: v.VolumeId, size: v.Size, type: v.VolumeType, state: v.State,
          encrypted: v.Encrypted, attachedTo: (v.Attachments || []).map(a => a.InstanceId).join(','),
          az: v.AvailabilityZone, region: reg
        }));
        result.totals.volumes += regionData.volumes.length;
      } catch {}

      // RDS
      try {
        const rds = new RDSClient({ ...credentials, region: reg });
        const resp = await rds.send(new DescribeDBInstancesCommand({ MaxRecords: 50 }));
        regionData.rds = (resp.DBInstances || []).map(db => ({
          id: db.DBInstanceIdentifier, engine: db.Engine, engineVersion: db.EngineVersion,
          class: db.DBInstanceClass, status: db.DBInstanceStatus, multiAZ: db.MultiAZ,
          storage: db.AllocatedStorage, endpoint: db.Endpoint?.Address, region: reg
        }));
        result.totals.rds += regionData.rds.length;
      } catch {}

      // Lambda
      try {
        const lambda = new LambdaClient({ ...credentials, region: reg });
        const resp = await lambda.send(new ListFunctionsCommand({ MaxItems: 50 }));
        regionData.lambda = (resp.Functions || []).map(f => ({
          name: f.FunctionName, runtime: f.Runtime, memory: f.MemorySize,
          timeout: f.Timeout, lastModified: f.LastModified, region: reg
        }));
        result.totals.lambda += regionData.lambda.length;
      } catch {}

      // VPCs
      try {
        const ec2 = new EC2Client({ ...credentials, region: reg });
        const resp = await ec2.send(new DescribeVpcsCommand({}));
        regionData.vpcs = (resp.Vpcs || []).map(v => ({
          id: v.VpcId, cidr: v.CidrBlock, isDefault: v.IsDefault, state: v.State, region: reg
        }));
        result.totals.vpcs += regionData.vpcs.length;
      } catch {}

      // Security Groups
      try {
        const ec2 = new EC2Client({ ...credentials, region: reg });
        const resp = await ec2.send(new DescribeSecurityGroupsCommand({ MaxResults: 100 }));
        regionData.securityGroups = (resp.SecurityGroups || []).map(sg => ({
          id: sg.GroupId, name: sg.GroupName, vpcId: sg.VpcId,
          inboundRules: (sg.IpPermissions || []).length, region: reg
        }));
        result.totals.securityGroups += regionData.securityGroups.length;
      } catch {}

      // Elastic IPs
      try {
        const ec2 = new EC2Client({ ...credentials, region: reg });
        const resp = await ec2.send(new DescribeAddressesCommand({}));
        regionData.elasticIPs = (resp.Addresses || []).map(a => ({
          allocationId: a.AllocationId, publicIp: a.PublicIp,
          associated: !!a.AssociationId, instanceId: a.InstanceId || null, region: reg
        }));
        result.totals.elasticIPs += regionData.elasticIPs.length;
      } catch {}

      result.regions[reg] = regionData;
    }

    const hasAnyData = Object.values(result.totals).some(v => v > 0);
    res.json({ hasCredentials: true, hasData: hasAnyData, ...result, scannedAt: new Date().toISOString() });
  } catch (err) {
    if (err.message.includes('credentials not configured')) return res.json({ hasCredentials: false, hasData: false, message: err.message });
    if (err.name === 'InvalidClientTokenId' || err.name === 'AuthFailure') return res.json({ hasCredentials: true, hasData: false, message: 'Invalid AWS credentials', credentialError: true });
    res.json({ hasCredentials: true, hasData: false, message: 'Inventory scan failed: ' + err.message });
  }
});

// ─── COST ─────────────────────────────────────────────────────────────────────
router.get('/cost/:clientId', authMiddleware, async (req, res) => {
  try {
    const { credentials } = await getCredentials(req.params.clientId);
    if (!CostExplorerClient) return res.json({ hasCredentials: true, hasData: false, message: 'AWS SDK not available' });

    const ce = new CostExplorerClient({ ...credentials, region: 'us-east-1' });
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];

    const resp = await ce.send(new GetCostAndUsageCommand({
      TimePeriod: { Start: start, End: end },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }]
    }));

    const months = {};
    for (const period of (resp.ResultsByTime || [])) {
      const month = period.TimePeriod.Start.slice(0, 7);
      months[month] = months[month] || { total: 0, services: {} };
      for (const group of (period.Groups || [])) {
        const svc = group.Keys[0];
        const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
        if (cost > 0.01) {
          months[month].services[svc] = (months[month].services[svc] || 0) + cost;
          months[month].total += cost;
        }
      }
    }

    const monthKeys = Object.keys(months).sort();
    const lastMonth = monthKeys[monthKeys.length - 1];
    const prevMonth = monthKeys[monthKeys.length - 2];

    const serviceBreakdown = Object.entries(months[lastMonth]?.services || {})
      .map(([svc, cost]) => ({ service: svc, lastMonth: parseFloat(cost.toFixed(2)), twoMonthsAgo: parseFloat((months[prevMonth]?.services[svc] || 0).toFixed(2)) }))
      .sort((a, b) => b.lastMonth - a.lastMonth).slice(0, 10);

    const monthlyTrend = monthKeys.map(m => ({ month: m, cost: parseFloat((months[m]?.total || 0).toFixed(2)) }));

    res.json({
      hasCredentials: true, hasData: true,
      totalLastMonth: parseFloat((months[lastMonth]?.total || 0).toFixed(2)),
      totalTwoMonthsAgo: parseFloat((months[prevMonth]?.total || 0).toFixed(2)),
      monthlyTrend, serviceBreakdown,
      unusedEIPs: [], oldAMIs: [], oldSnapshots: [], oldRDSSnapshots: [], anomalies: [],
      scannedAt: new Date().toISOString()
    });
  } catch (err) {
    if (err.message.includes('credentials not configured')) return res.json({ hasCredentials: false, hasData: false, message: err.message });
    if (err.name === 'AccessDeniedException') return res.json({ hasCredentials: true, hasData: false, message: 'Cost Explorer access denied. Ensure the IAM user has ce:GetCostAndUsage permission.' });
    res.json({ hasCredentials: true, hasData: false, message: 'Cost data failed: ' + err.message });
  }
});

// ─── WASTE (EIPs, old snapshots, AMIs) ───────────────────────────────────────
router.get('/waste/:clientId', authMiddleware, async (req, res) => {
  try {
    const { credentials, regions, primaryRegion } = await getCredentials(req.params.clientId);
    if (!EC2Client) return res.json({ hasCredentials: true, hasData: false, message: 'AWS SDK not available' });

    const THREE_MONTHS_AGO = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const unusedEIPs = [], oldAMIs = [], oldSnapshots = [], oldRDSSnapshots = [];

    for (const reg of [primaryRegion]) {
      const ec2 = new EC2Client({ ...credentials, region: reg });

      try {
        const resp = await ec2.send(new DescribeAddressesCommand({}));
        for (const a of (resp.Addresses || [])) {
          if (!a.AssociationId) unusedEIPs.push({ allocationId: a.AllocationId, publicIp: a.PublicIp, region: reg, monthlyCost: '$3.65', createdDays: 'N/A' });
        }
      } catch {}

      try {
        const resp = await ec2.send(new DescribeImagesCommand({ Owners: ['self'], MaxResults: 100 }));
        for (const ami of (resp.Images || [])) {
          const created = new Date(ami.CreationDate);
          if (created < THREE_MONTHS_AGO) {
            const age = Math.floor((Date.now() - created.getTime()) / (24 * 60 * 60 * 1000));
            oldAMIs.push({ imageId: ami.ImageId, name: ami.Name || '(unnamed)', createdDate: ami.CreationDate, ageDays: age, snapshotCount: (ami.BlockDeviceMappings || []).length, region: reg });
          }
        }
      } catch {}

      try {
        const resp = await ec2.send(new DescribeSnapshotsCommand({ OwnerIds: ['self'], MaxResults: 100 }));
        for (const snap of (resp.Snapshots || [])) {
          const created = new Date(snap.StartTime);
          if (created < THREE_MONTHS_AGO) {
            const age = Math.floor((Date.now() - created.getTime()) / (24 * 60 * 60 * 1000));
            oldSnapshots.push({ snapshotId: snap.SnapshotId, volumeId: snap.VolumeId || 'N/A', size: snap.VolumeSize + ' GB', createdDate: snap.StartTime, ageDays: age, estimatedCost: '$' + (snap.VolumeSize * 0.05).toFixed(2) + '/month', region: reg });
          }
        }
      } catch {}
    }

    res.json({ hasCredentials: true, hasData: true, unusedEIPs, oldAMIs, oldSnapshots, oldRDSSnapshots, scannedAt: new Date().toISOString() });
  } catch (err) {
    if (err.message.includes('credentials not configured')) return res.json({ hasCredentials: false, hasData: false, message: err.message });
    res.json({ hasCredentials: true, hasData: false, message: err.message });
  }
});

// ─── SSL (basic domain check - no AWS needed) ────────────────────────────────
router.get('/ssl/:clientId', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    const domains = client?.domains || [];
    if (!domains.length) return res.json({ hasData: false, message: 'No domains configured for this client. Add domains in client settings.', ssl: [] });

    const results = domains.map(domain => ({
      domain, sslDaysRemaining: null, domainDaysRemaining: null,
      status: 'UNCHECKED', message: 'Connect via backend SSL checker to get live data'
    }));

    res.json({ hasData: domains.length > 0, ssl: results, note: 'For live SSL data, configure ssl-checker in backend' });
  } catch (err) {
    res.json({ hasData: false, message: err.message });
  }
});

// ─── PATCHING (SSM - requires SSM agent) ────────────────────────────────────
router.get('/patching/:clientId', authMiddleware, async (req, res) => {
  try {
    const { credentials, primaryRegion } = await getCredentials(req.params.clientId);
    if (!EC2Client) return res.json({ hasCredentials: true, hasData: false, message: 'AWS SDK not available' });

    // Get EC2 instances for patching list
    const ec2 = new EC2Client({ ...credentials, region: primaryRegion });
    const resp = await ec2.send(new DescribeInstancesCommand({ MaxResults: 50 }));
    const instances = (resp.Reservations || []).flatMap(r => r.Instances || [])
      .filter(i => i.State?.Name === 'running')
      .map(i => ({
        id: i.InstanceId, name: (i.Tags || []).find(t => t.Key === 'Name')?.Value || i.InstanceId,
        os: i.Platform === 'windows' ? 'Windows' : 'Linux', ip: i.PrivateIpAddress,
        type: i.InstanceType, env: (i.Tags || []).find(t => t.Key === 'Environment')?.Value || 'Production'
      }));

    res.json({ hasCredentials: true, hasData: instances.length > 0, instances, scannedAt: new Date().toISOString(), note: 'Patch compliance requires AWS Systems Manager (SSM) agent installed on instances' });
  } catch (err) {
    if (err.message.includes('credentials not configured')) return res.json({ hasCredentials: false, hasData: false, message: err.message });
    res.json({ hasCredentials: true, hasData: false, message: err.message });
  }
});

// ─── COMPUTE OPTIMIZER ───────────────────────────────────────────────────────
router.get('/optimizer/:clientId', authMiddleware, async (req, res) => {
  try {
    const { credentials, primaryRegion } = await getCredentials(req.params.clientId);
    res.json({ hasCredentials: true, hasData: false, message: 'AWS Compute Optimizer requires the service to be opted-in in your AWS account. Enable it at: AWS Console > Compute Optimizer > Get Started', link: 'https://console.aws.amazon.com/compute-optimizer/' });
  } catch (err) {
    if (err.message.includes('credentials not configured')) return res.json({ hasCredentials: false, hasData: false, message: err.message });
    res.json({ hasCredentials: true, hasData: false, message: err.message });
  }
});

module.exports = router;
