const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');

// Helper: get AWS clients for a given client
const getAWSClients = async (clientId) => {
  const client = await Client.findById(clientId);
  if (!client?.awsCredentials?.accessKeyId) {
    throw new Error('AWS credentials not configured for this client');
  }
  const credentials = {
    accessKeyId: client.awsCredentials.accessKeyId,
    secretAccessKey: client.awsCredentials.secretAccessKey,
    region: client.awsRegions?.[0] || 'ap-south-1'
  };
  return { credentials, regions: client.awsRegions || ['ap-south-1'] };
};

// ============================================================
// MOCK DATA GENERATORS (replace with real AWS SDK calls)
// ============================================================

const generateMockSecurityFindings = () => ({
  summary: {
    critical: Math.floor(Math.random() * 5),
    high: Math.floor(Math.random() * 15) + 5,
    medium: Math.floor(Math.random() * 30) + 10,
    low: Math.floor(Math.random() * 50) + 20,
    informational: Math.floor(Math.random() * 40) + 15,
    score: Math.floor(Math.random() * 30) + 50
  },
  findings: [
    { id: 'SEC-001', severity: 'CRITICAL', title: 'S3 Bucket with Public Access Enabled', resource: 'arn:aws:s3:::prod-data-bucket', region: 'ap-south-1', service: 'S3', remediation: 'Enable S3 Block Public Access settings', status: 'ACTIVE' },
    { id: 'SEC-002', severity: 'HIGH', title: 'IAM User with Console Access & No MFA', resource: 'arn:aws:iam::123456789:user/deploy-user', region: 'global', service: 'IAM', remediation: 'Enable MFA for all IAM users with console access', status: 'ACTIVE' },
    { id: 'SEC-003', severity: 'HIGH', title: 'Security Group allows SSH from 0.0.0.0/0', resource: 'sg-0abc123def456', region: 'ap-south-1', service: 'EC2', remediation: 'Restrict SSH access to specific IP ranges', status: 'ACTIVE' },
    { id: 'SEC-004', severity: 'HIGH', title: 'RDS instance not encrypted at rest', resource: 'arn:aws:rds:ap-south-1:123456789:db/prod-mysql', region: 'ap-south-1', service: 'RDS', remediation: 'Enable encryption for RDS instances', status: 'ACTIVE' },
    { id: 'SEC-005', severity: 'MEDIUM', title: 'CloudTrail not enabled in all regions', resource: 'arn:aws:cloudtrail:ap-south-1:123456789:trail/main', region: 'ap-south-1', service: 'CloudTrail', remediation: 'Enable CloudTrail in all regions with multi-region trail', status: 'ACTIVE' },
    { id: 'SEC-006', severity: 'MEDIUM', title: 'EBS volume not encrypted', resource: 'vol-0abc1234def56789', region: 'ap-south-1', service: 'EBS', remediation: 'Encrypt EBS volumes and snapshots', status: 'ACTIVE' },
    { id: 'SEC-007', severity: 'MEDIUM', title: 'Lambda function with overly permissive IAM role', resource: 'arn:aws:lambda:ap-south-1:123456789:function:ProcessData', region: 'ap-south-1', service: 'Lambda', remediation: 'Apply least privilege principle to Lambda execution roles', status: 'ACTIVE' },
    { id: 'SEC-008', severity: 'LOW', title: 'Unused IAM access keys older than 90 days', resource: 'arn:aws:iam::123456789:user/old-user', region: 'global', service: 'IAM', remediation: 'Rotate or delete unused access keys', status: 'ACTIVE' },
    { id: 'SEC-009', severity: 'LOW', title: 'VPC Flow Logs not enabled', resource: 'vpc-0abc123456', region: 'ap-south-1', service: 'VPC', remediation: 'Enable VPC Flow Logs for network monitoring', status: 'ACTIVE' },
    { id: 'SEC-010', severity: 'INFORMATIONAL', title: 'EC2 instance not in VPC', resource: 'i-0abc1234def56789', region: 'ap-south-1', service: 'EC2', remediation: 'Move EC2 instances to VPC', status: 'ACTIVE' },
  ]
});

const generateMockCostData = () => ({
  totalLastMonth: (Math.random() * 50000 + 10000).toFixed(2),
  totalTwoMonthsAgo: (Math.random() * 45000 + 8000).toFixed(2),
  monthlyTrend: [
    { month: 'Sep 2024', cost: (Math.random() * 30000 + 8000).toFixed(2) },
    { month: 'Oct 2024', cost: (Math.random() * 35000 + 9000).toFixed(2) },
    { month: 'Nov 2024', cost: (Math.random() * 32000 + 10000).toFixed(2) },
    { month: 'Dec 2024', cost: (Math.random() * 40000 + 12000).toFixed(2) },
    { month: 'Jan 2025', cost: (Math.random() * 45000 + 11000).toFixed(2) },
    { month: 'Feb 2025', cost: (Math.random() * 48000 + 13000).toFixed(2) },
  ],
  serviceBreakdown: [
    { service: 'Amazon EC2', cost: (Math.random() * 20000 + 5000).toFixed(2), percentage: 35 },
    { service: 'Amazon RDS', cost: (Math.random() * 10000 + 2000).toFixed(2), percentage: 20 },
    { service: 'Amazon S3', cost: (Math.random() * 5000 + 1000).toFixed(2), percentage: 12 },
    { service: 'AWS Lambda', cost: (Math.random() * 3000 + 500).toFixed(2), percentage: 8 },
    { service: 'Amazon CloudFront', cost: (Math.random() * 2000 + 300).toFixed(2), percentage: 6 },
    { service: 'Amazon EKS', cost: (Math.random() * 4000 + 1000).toFixed(2), percentage: 10 },
    { service: 'Other Services', cost: (Math.random() * 2000 + 500).toFixed(2), percentage: 9 },
  ],
  unusedEIPs: [
    { allocationId: 'eipalloc-0abc12345', publicIp: '52.66.32.10', region: 'ap-south-1', monthlyCost: '$3.65', createdDays: 45 },
    { allocationId: 'eipalloc-0def67890', publicIp: '13.234.54.89', region: 'ap-south-1', monthlyCost: '$3.65', createdDays: 120 },
  ],
  oldAMIs: [
    { imageId: 'ami-0abc12345def67890', name: 'prod-app-ami-2024-01', createdDate: '2024-01-15', ageDays: 120, snapshotCount: 2, estimatedCost: '$2.40/month' },
    { imageId: 'ami-0xyz98765abc43210', name: 'staging-ami-backup', createdDate: '2024-02-10', ageDays: 95, snapshotCount: 1, estimatedCost: '$1.20/month' },
  ],
  oldSnapshots: [
    { snapshotId: 'snap-0abc1234def56789', volumeId: 'vol-0abc12345', size: '50 GB', createdDate: '2024-01-05', ageDays: 130, estimatedCost: '$2.50/month' },
    { snapshotId: 'snap-0def5678abc12345', volumeId: 'vol-0def56789', size: '100 GB', createdDate: '2024-02-20', ageDays: 85, estimatedCost: '$5.00/month' },
    { snapshotId: 'snap-0ghi9012jkl34567', volumeId: 'vol-0ghi90123', size: '200 GB', createdDate: '2023-12-10', ageDays: 170, estimatedCost: '$10.00/month' },
  ],
  oldRDSSnapshots: [
    { snapshotId: 'rds:prod-mysql-2024-01-15', dbInstance: 'prod-mysql', size: '100 GB', createdDate: '2024-01-15', ageDays: 120, estimatedCost: '$2.30/month' },
  ],
  anomalies: [
    { date: '2025-02-15', service: 'Amazon EC2', anomalyAmount: '$450.00', expectedAmount: '$1200.00', actualAmount: '$1650.00', severity: 'HIGH' },
    { date: '2025-02-22', service: 'Amazon S3', anomalyAmount: '$120.00', expectedAmount: '$280.00', actualAmount: '$400.00', severity: 'MEDIUM' },
  ]
});

const generateMockOptimizer = () => ({
  ec2Recommendations: [
    { instanceId: 'i-0abc1234def56789', instanceType: 'm5.2xlarge', recommendedType: 'm5.large', currentCost: '$278/month', projectedCost: '$70/month', savings: '$208/month', cpuUtilization: '8%', reason: 'CPU utilization consistently below 10%' },
    { instanceId: 'i-0def5678abc12345', instanceType: 't3.xlarge', recommendedType: 't3.medium', currentCost: '$120/month', projectedCost: '$60/month', savings: '$60/month', cpuUtilization: '15%', reason: 'Low CPU and memory utilization' },
  ],
  ebsRecommendations: [
    { volumeId: 'vol-0abc12345', volumeType: 'io1', recommendedType: 'gp3', size: '500 GB', currentCost: '$100/month', projectedCost: '$40/month', savings: '$60/month', reason: 'Low IOPS usage, gp3 sufficient' },
  ],
  lambdaRecommendations: [
    { functionName: 'ProcessOrders', currentMemory: '1024 MB', recommendedMemory: '512 MB', currentCost: '$45/month', projectedCost: '$22/month', savings: '$23/month', reason: 'Memory utilization consistently below 40%' },
  ],
  rdsRecommendations: [
    { dbInstanceId: 'prod-postgres', instanceClass: 'db.r5.2xlarge', recommendedClass: 'db.r5.large', currentCost: '$520/month', projectedCost: '$260/month', savings: '$260/month', reason: 'CPU and memory usage well below threshold' },
  ],
  totalMonthlySavings: '$611'
});

const generateMockInventory = (region) => ({
  region,
  ec2: { total: 24, running: 18, stopped: 4, terminated: 2 },
  rds: { total: 8, available: 6, stopped: 2 },
  s3Buckets: 34,
  lambdaFunctions: 45,
  ecsServices: 12,
  eksCluster: 2,
  elasticIPs: 6,
  securityGroups: 89,
  vpcs: 4,
  instances: [
    { id: 'i-0abc1234', name: 'prod-app-01', type: 't3.medium', state: 'running', region, az: `${region}a`, privateIp: '10.0.1.10', launchTime: '2024-06-15' },
    { id: 'i-0abc1235', name: 'prod-app-02', type: 't3.medium', state: 'running', region, az: `${region}b`, privateIp: '10.0.2.10', launchTime: '2024-06-15' },
    { id: 'i-0abc1236', name: 'staging-app-01', type: 't3.small', state: 'stopped', region, az: `${region}a`, privateIp: '10.0.3.10', launchTime: '2024-08-20' },
    { id: 'i-0abc1237', name: 'bastion-host', type: 't2.micro', state: 'running', region, az: `${region}a`, privateIp: '10.0.0.5', launchTime: '2024-03-01' },
  ]
});

const generateMockPatching = () => ({
  preScan: {
    scanDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    instances: [
      { id: 'i-0abc1234', name: 'prod-app-01', os: 'Amazon Linux 2', kernelVersion: '5.10.68-62.173', pendingUpdates: 23, criticalUpdates: 3, status: 'PENDING_PATCH' },
      { id: 'i-0abc1235', name: 'prod-app-02', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-1031-aws', pendingUpdates: 15, criticalUpdates: 1, status: 'PENDING_PATCH' },
      { id: 'i-0abc1237', name: 'bastion-host', os: 'Amazon Linux 2', kernelVersion: '5.10.68-62.173', pendingUpdates: 8, criticalUpdates: 0, status: 'PENDING_PATCH' },
    ]
  },
  postScan: {
    scanDate: new Date().toISOString(),
    instances: [
      { id: 'i-0abc1234', name: 'prod-app-01', os: 'Amazon Linux 2', kernelVersion: '5.10.205-195.804', pendingUpdates: 0, criticalUpdates: 0, status: 'PATCHED', patchedAt: new Date().toISOString() },
      { id: 'i-0abc1235', name: 'prod-app-02', os: 'Ubuntu 22.04', kernelVersion: '5.15.0-1050-aws', pendingUpdates: 0, criticalUpdates: 0, status: 'PATCHED', patchedAt: new Date().toISOString() },
      { id: 'i-0abc1237', name: 'bastion-host', os: 'Amazon Linux 2', kernelVersion: '5.10.205-195.804', pendingUpdates: 0, criticalUpdates: 0, status: 'PATCHED', patchedAt: new Date().toISOString() },
    ]
  }
});

const generateSSLMonitoring = (domains) => {
  return (domains || ['example.com']).map(domain => ({
    domain,
    sslExpiry: new Date(Date.now() + (Math.random() * 180 + 7) * 24 * 60 * 60 * 1000).toISOString(),
    domainExpiry: new Date(Date.now() + (Math.random() * 365 + 30) * 24 * 60 * 60 * 1000).toISOString(),
    sslDaysRemaining: Math.floor(Math.random() * 180 + 7),
    domainDaysRemaining: Math.floor(Math.random() * 365 + 30),
    sslStatus: 'VALID',
    sslIssuer: 'Amazon',
    grade: 'A+'
  }));
};

// ============================================================
// ROUTES
// ============================================================

router.get('/security/:clientId', authMiddleware, async (req, res) => {
  try {
    res.json(generateMockSecurityFindings());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/cost/:clientId', authMiddleware, async (req, res) => {
  try {
    res.json(generateMockCostData());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/optimizer/:clientId', authMiddleware, async (req, res) => {
  try {
    res.json(generateMockOptimizer());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/inventory/:clientId', authMiddleware, async (req, res) => {
  try {
    const region = req.query.region || 'ap-south-1';
    res.json(generateMockInventory(region));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/patching/:clientId', authMiddleware, async (req, res) => {
  try {
    res.json(generateMockPatching());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ssl/:clientId', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    res.json(generateSSLMonitoring(client?.domains));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
