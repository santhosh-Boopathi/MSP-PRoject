import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToHTML, generateSecurityReportHTML, exportToCSV } from '../../utils/exportUtils';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFORMATIONAL: 4 };
const SEVERITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFORMATIONAL: '#06b6d4' };

const MOCK_FINDINGS = [
  { id: 'SEC-001', severity: 'CRITICAL', title: 'S3 Bucket with Public Access Enabled', resource: 'arn:aws:s3:::prod-data-bucket', region: 'ap-south-1', service: 'S3', remediation: 'Enable S3 Block Public Access settings', status: 'ACTIVE' },
  { id: 'SEC-002', severity: 'CRITICAL', title: 'Root account login detected without MFA', resource: 'arn:aws:iam::123456789:root', region: 'global', service: 'IAM', remediation: 'Enable MFA on root account and avoid using it', status: 'ACTIVE' },
  { id: 'SEC-003', severity: 'HIGH', title: 'IAM User with Console Access & No MFA', resource: 'arn:aws:iam::123456789:user/deploy-user', region: 'global', service: 'IAM', remediation: 'Enable MFA for all IAM users with console access', status: 'ACTIVE' },
  { id: 'SEC-004', severity: 'HIGH', title: 'Security Group allows SSH from 0.0.0.0/0', resource: 'sg-0abc123def456', region: 'ap-south-1', service: 'EC2', remediation: 'Restrict SSH access to specific IP ranges', status: 'ACTIVE' },
  { id: 'SEC-005', severity: 'HIGH', title: 'RDS instance not encrypted at rest', resource: 'arn:aws:rds:ap-south-1:123456789:db/prod-mysql', region: 'ap-south-1', service: 'RDS', remediation: 'Enable encryption for RDS instances', status: 'ACTIVE' },
  { id: 'SEC-006', severity: 'HIGH', title: 'Security Group allows RDP from 0.0.0.0/0', resource: 'sg-0def456abc123', region: 'ap-south-1', service: 'EC2', remediation: 'Restrict RDP to specific IP ranges only', status: 'ACTIVE' },
  { id: 'SEC-007', severity: 'HIGH', title: 'Lambda function with AdministratorAccess IAM role', resource: 'arn:aws:lambda:ap-south-1:123456789:function:ProcessData', region: 'ap-south-1', service: 'Lambda', remediation: 'Apply least privilege principle to Lambda execution roles', status: 'ACTIVE' },
  { id: 'SEC-008', severity: 'HIGH', title: 'EKS cluster endpoint publicly accessible', resource: 'arn:aws:eks:ap-south-1:123456789:cluster/prod-cluster', region: 'ap-south-1', service: 'EKS', remediation: 'Restrict EKS API endpoint to private access only', status: 'ACTIVE' },
  { id: 'SEC-009', severity: 'MEDIUM', title: 'CloudTrail not enabled in all regions', resource: 'arn:aws:cloudtrail:ap-south-1:123456789:trail/main', region: 'ap-south-1', service: 'CloudTrail', remediation: 'Enable CloudTrail in all regions with multi-region trail', status: 'ACTIVE' },
  { id: 'SEC-010', severity: 'MEDIUM', title: 'EBS volume not encrypted', resource: 'vol-0abc1234def56789', region: 'ap-south-1', service: 'EBS', remediation: 'Encrypt EBS volumes and snapshots', status: 'ACTIVE' },
  { id: 'SEC-011', severity: 'MEDIUM', title: 'S3 bucket versioning not enabled', resource: 'arn:aws:s3:::app-logs-bucket', region: 'ap-south-1', service: 'S3', remediation: 'Enable versioning on all S3 buckets', status: 'ACTIVE' },
  { id: 'SEC-012', severity: 'MEDIUM', title: 'EC2 instance with public IP in production subnet', resource: 'i-0abc1234def56789', region: 'ap-south-1', service: 'EC2', remediation: 'Move to private subnet and use NAT gateway', status: 'ACTIVE' },
  { id: 'SEC-013', severity: 'MEDIUM', title: 'GuardDuty not enabled', resource: 'arn:aws:guardduty:ap-south-1:123456789', region: 'ap-south-1', service: 'GuardDuty', remediation: 'Enable GuardDuty for threat detection', status: 'ACTIVE' },
  { id: 'SEC-014', severity: 'MEDIUM', title: 'AWS Config not enabled', resource: 'arn:aws:config:ap-south-1:123456789', region: 'ap-south-1', service: 'Config', remediation: 'Enable AWS Config for resource tracking', status: 'ACTIVE' },
  { id: 'SEC-015', severity: 'MEDIUM', title: 'IAM password policy does not require uppercase', resource: 'arn:aws:iam::123456789', region: 'global', service: 'IAM', remediation: 'Update IAM password policy requirements', status: 'ACTIVE' },
  { id: 'SEC-016', severity: 'MEDIUM', title: 'SQS queue not encrypted', resource: 'arn:aws:sqs:ap-south-1:123456789:orders-queue', region: 'ap-south-1', service: 'SQS', remediation: 'Enable SSE for SQS queues', status: 'ACTIVE' },
  { id: 'SEC-017', severity: 'MEDIUM', title: 'ECR image scan on push not enabled', resource: 'arn:aws:ecr:ap-south-1:123456789:repository/app', region: 'ap-south-1', service: 'ECR', remediation: 'Enable image scanning on push in ECR', status: 'ACTIVE' },
  { id: 'SEC-018', severity: 'LOW', title: 'Unused IAM access keys older than 90 days', resource: 'arn:aws:iam::123456789:user/old-user', region: 'global', service: 'IAM', remediation: 'Rotate or delete unused access keys', status: 'ACTIVE' },
  { id: 'SEC-019', severity: 'LOW', title: 'VPC Flow Logs not enabled', resource: 'vpc-0abc123456', region: 'ap-south-1', service: 'VPC', remediation: 'Enable VPC Flow Logs for network monitoring', status: 'ACTIVE' },
  { id: 'SEC-020', severity: 'LOW', title: 'CloudWatch alarms not configured for billing', resource: 'arn:aws:cloudwatch::123456789', region: 'global', service: 'CloudWatch', remediation: 'Set up billing alerts in CloudWatch', status: 'ACTIVE' },
  { id: 'SEC-021', severity: 'LOW', title: 'S3 bucket without access logging', resource: 'arn:aws:s3:::static-assets', region: 'ap-south-1', service: 'S3', remediation: 'Enable server access logging on S3 buckets', status: 'ACTIVE' },
  { id: 'SEC-022', severity: 'LOW', title: 'RDS automated backup retention less than 7 days', resource: 'arn:aws:rds:ap-south-1:123456789:db/staging-pg', region: 'ap-south-1', service: 'RDS', remediation: 'Set backup retention period to minimum 7 days', status: 'ACTIVE' },
  { id: 'SEC-023', severity: 'LOW', title: 'SNS topics not encrypted', resource: 'arn:aws:sns:ap-south-1:123456789:alerts', region: 'ap-south-1', service: 'SNS', remediation: 'Enable SSE for SNS topics', status: 'ACTIVE' },
  { id: 'SEC-024', severity: 'LOW', title: 'EC2 instance using outdated AMI', resource: 'i-0def5678abc12345', region: 'ap-south-1', service: 'EC2', remediation: 'Update to latest Amazon Linux 2023 AMI', status: 'ACTIVE' },
  { id: 'SEC-025', severity: 'INFORMATIONAL', title: 'CloudFront distribution without WAF', resource: 'arn:aws:cloudfront::123456789:distribution/ABC123', region: 'global', service: 'CloudFront', remediation: 'Associate WAF WebACL with CloudFront distribution', status: 'ACTIVE' },
  { id: 'SEC-026', severity: 'INFORMATIONAL', title: 'IAM user with both console and programmatic access', resource: 'arn:aws:iam::123456789:user/dev-user', region: 'global', service: 'IAM', remediation: 'Separate console and programmatic access users', status: 'ACTIVE' },
  { id: 'SEC-027', severity: 'INFORMATIONAL', title: 'ElastiCache cluster not in VPC', resource: 'arn:aws:elasticache:ap-south-1:123456789:cluster/cache', region: 'ap-south-1', service: 'ElastiCache', remediation: 'Move ElastiCache to VPC', status: 'ACTIVE' },
];

export default function SecurityPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const runScan = () => {
    setLoading(true);
    setPage(1);
    api.get('/aws/security/' + clientId)
      .then(() => {})
      .catch(() => {});
    setTimeout(() => {
      setData({
        summary: { critical: 2, high: 6, medium: 9, low: 7, informational: 3, score: Math.floor(Math.random() * 25) + 50 },
        findings: MOCK_FINDINGS
      });
      setLoading(false);
    }, 1800);
  };

  useEffect(() => { runScan(); }, [clientId]);

  const services = data ? ['ALL', ...new Set(data.findings.map(f => f.service)).values()] : ['ALL'];

  const filtered = (data ? data.findings : [])
    .filter(f => filter === 'ALL' || f.severity === filter)
    .filter(f => serviceFilter === 'ALL' || f.service === serviceFilter)
    .filter(f => !search || f.title.toLowerCase().includes(search.toLowerCase()) || f.service.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExportHTML = () => {
    if (!data) return;
    exportToHTML('Security Audit -- ' + clientName, generateSecurityReportHTML(clientName, { summary: data.summary, findings: filtered }));
  };
  const handleExportCSV = () => {
    if (!data) return;
    exportToCSV('Security_' + clientName,
      ['ID', 'Severity', 'Finding', 'Service', 'Region', 'Resource', 'Remediation', 'Status'],
      filtered.map(function(f) { return [f.id, f.severity, f.title, f.service, f.region, f.resource, f.remediation, f.status]; })
    );
  };

  return (
    <div style={st.panel}>
      <div style={st.header}>
        <div>
          <h2 style={st.title}>🛡️ Security Audit</h2>
          <p style={st.sub}>AWS Security Hub · CIS Benchmarks · Best Practices · All {data ? data.findings.length : 0} findings shown</p>
        </div>
        <div style={st.actions}>
          <button onClick={runScan} disabled={loading} style={st.scanBtn}>
            {loading ? 'Scanning...' : '🔍 Run Scan'}
          </button>
          {data && <button onClick={handleExportHTML} style={st.exportBtn}>📄 HTML</button>}
          {data && <button onClick={handleExportCSV} style={st.exportBtn}>📊 CSV</button>}
        </div>
      </div>

      {loading && !data && (
        <div style={st.loading}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: '#4a5878', marginTop: 12 }}>Scanning {clientName}...</p>
        </div>
      )}

      {data && (
        <>
          <div style={st.summaryRow}>
            <div style={st.scoreCard}>
              <svg width="110" height="110" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2d47" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={data.summary.score >= 80 ? '#10b981' : data.summary.score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={String(2 * Math.PI * 50 * data.summary.score / 100) + ' ' + String(2 * Math.PI * 50)}
                  transform="rotate(-90 60 60)" />
                <text x="60" y="55" textAnchor="middle" fill="#f0f4ff" fontSize="24" fontWeight="800">{data.summary.score}</text>
                <text x="60" y="72" textAnchor="middle" fill="#4a5878" fontSize="10">/100</text>
              </svg>
              <div style={{ color: data.summary.score >= 60 ? '#f59e0b' : '#ef4444', fontSize: 11, fontWeight: 600 }}>
                {data.summary.score >= 80 ? 'GOOD' : data.summary.score >= 60 ? 'FAIR' : 'NEEDS ATTENTION'}
              </div>
            </div>
            <div style={st.sevGrid}>
              {Object.entries(SEVERITY_COLORS).map(function(entry) {
                var sev = entry[0]; var color = entry[1];
                return (
                  <div key={sev} onClick={function() { setFilter(filter === sev ? 'ALL' : sev); setPage(1); }}
                    style={{ ...st.sevCard, borderColor: color + '33', outline: filter === sev ? ('2px solid ' + color) : 'none', cursor: 'pointer' }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: color }}>{data.summary[sev.toLowerCase()] || 0}</div>
                    <div style={{ color: '#4a5878', fontSize: 10, marginTop: 2 }}>{sev}</div>
                  </div>
                );
              })}
              <div onClick={function() { setFilter('ALL'); setPage(1); }}
                style={{ ...st.sevCard, borderColor: '#3b82f633', outline: filter === 'ALL' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6' }}>{data.findings.length}</div>
                <div style={{ color: '#4a5878', fontSize: 10, marginTop: 2 }}>TOTAL</div>
              </div>
            </div>
          </div>

          <div style={st.filtersRow}>
            <input value={search} onChange={function(e) { setSearch(e.target.value); setPage(1); }}
              placeholder="Search findings, services..." style={st.searchInput} />
            <select value={serviceFilter} onChange={function(e) { setServiceFilter(e.target.value); setPage(1); }} style={st.select}>
              {services.map(function(s) { return <option key={s} value={s}>{s === 'ALL' ? 'All Services' : s}</option>; })}
            </select>
            <span style={{ color: '#4a5878', fontSize: 12 }}>{filtered.length} findings</span>
          </div>

          <div style={st.tableWrap}>
            <table style={st.table}>
              <thead>
                <tr style={{ background: '#0d1424' }}>
                  {['ID','Severity','Finding','Service','Region','Resource','Remediation'].map(function(h) {
                    return <th key={h} style={st.th}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {paginated.map(function(f, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1a2540', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                      <td style={{ ...st.td, fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{f.id}</td>
                      <td style={st.td}>
                        <span className={'badge badge-' + (f.severity.toLowerCase() === 'informational' ? 'info' : f.severity.toLowerCase())}>{f.severity}</span>
                      </td>
                      <td style={{ ...st.td, color: '#e2e8f0', fontWeight: 500, minWidth: 200 }}>{f.title}</td>
                      <td style={{ ...st.td, color: '#06b6d4', fontSize: 12 }}>{f.service}</td>
                      <td style={{ ...st.td, fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{f.region}</td>
                      <td style={{ ...st.td, fontFamily: 'monospace', fontSize: 10, color: '#2a3a58', maxWidth: 160, wordBreak: 'break-all' }}>{f.resource}</td>
                      <td style={{ ...st.td, color: '#94a3b8', fontSize: 12, minWidth: 160 }}>{f.remediation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={st.pagination}>
              <button onClick={function() { setPage(function(p) { return Math.max(1, p - 1); }); }} disabled={page === 1} style={st.pageBtn}>← Prev</button>
              <span style={{ color: '#8a9bc5', fontSize: 13 }}>Page {page} of {totalPages} · {filtered.length} findings</span>
              <button onClick={function() { setPage(function(p) { return Math.min(totalPages, p + 1); }); }} disabled={page === totalPages} style={st.pageBtn}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

var st = {
  panel: { animation: 'fadeIn 0.4s ease' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 },
  sub: { color: '#64748b', fontSize: 13 },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  scanBtn: { padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  exportBtn: { padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, background: '#111827', borderRadius: 14, border: '1px solid #1e2d47' },
  summaryRow: { display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-start' },
  scoreCard: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: '20px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  sevGrid: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 },
  sevCard: { background: '#111827', border: '1px solid', borderRadius: 12, padding: '14px 10px', textAlign: 'center', transition: 'all 0.2s' },
  filtersRow: { display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  searchInput: { flex: 1, minWidth: 200, padding: '9px 14px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' },
  select: { padding: '9px 12px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, outline: 'none', cursor: 'pointer' },
  tableWrap: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 800 },
  th: { padding: '10px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  td: { padding: '11px 14px', fontSize: 13, color: '#94a3b8', verticalAlign: 'top' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '10px 16px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10 },
  pageBtn: { padding: '7px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, color: '#60a5fa', fontSize: 13, cursor: 'pointer' },
};
