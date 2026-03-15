import React, { useState } from 'react';
import { exportToHTML } from '../../utils/exportUtils';

export default function MonthlyReportPanel({ clientId, clientName }) {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { label: d.toLocaleString('default', { month: 'long', year: 'numeric' }), value: `${d.getFullYear()}-${d.getMonth() + 1}` };
  });

  const [selectedMonth, setSelectedMonth] = useState(months[0].value);

  const generateReport = async () => {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1800));
    setGenerated(true);
    setGenerating(false);

    const [year, month] = selectedMonth.split('-');
    const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

    const content = `
      <div class="section">
        <div class="section-title">Executive Summary — ${monthLabel}</div>
        <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:16px">
          This monthly report covers the AWS infrastructure managed by ShellKode Team Cronos for <strong>${clientName}</strong> during ${monthLabel}.
          The report includes security posture, cost analysis, infrastructure health, and compliance status.
        </p>
        <div class="summary-grid">
          <div class="summary-card"><div class="value" style="color:#2563eb">74</div><div class="label">Security Score</div></div>
          <div class="summary-card"><div class="value" style="color:#dc2626">3</div><div class="label">Critical Findings</div></div>
          <div class="summary-card"><div class="value" style="color:#16a34a">$42,180</div><div class="label">Monthly AWS Cost</div></div>
          <div class="summary-card"><div class="value" style="color:#7c3aed">97%</div><div class="label">Uptime SLA</div></div>
          <div class="summary-card"><div class="value" style="color:#16a34a">100%</div><div class="label">Patch Coverage</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Security Highlights</div>
        <table>
          <thead><tr><th>Category</th><th>Status</th><th>Action Taken</th></tr></thead>
          <tbody>
            <tr><td>S3 Public Access</td><td><span class="badge critical">CRITICAL</span></td><td>Remediation in progress</td></tr>
            <tr><td>IAM MFA Enforcement</td><td><span class="badge high">HIGH</span></td><td>Notified client for action</td></tr>
            <tr><td>CloudTrail Logging</td><td><span class="badge success">ENABLED</span></td><td>Verified all regions covered</td></tr>
            <tr><td>VPC Flow Logs</td><td><span class="badge medium">PARTIAL</span></td><td>Enabling in 2 VPCs</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Cost Summary</div>
        <table>
          <thead><tr><th>Service</th><th>Previous Month</th><th>This Month</th><th>Change</th></tr></thead>
          <tbody>
            <tr><td>Amazon EC2</td><td>$16,200</td><td>$17,800</td><td style="color:#dc2626">↑ 9.9%</td></tr>
            <tr><td>Amazon RDS</td><td>$8,400</td><td>$8,100</td><td style="color:#16a34a">↓ 3.6%</td></tr>
            <tr><td>Amazon S3</td><td>$4,200</td><td>$4,800</td><td style="color:#dc2626">↑ 14.3%</td></tr>
            <tr><td>AWS Lambda</td><td>$1,800</td><td>$1,600</td><td style="color:#16a34a">↓ 11.1%</td></tr>
            <tr><td><strong>Total</strong></td><td><strong>$38,900</strong></td><td><strong>$42,180</strong></td><td style="color:#dc2626"><strong>↑ 8.4%</strong></td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Infrastructure Changes</div>
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Performed By</th></tr></thead>
          <tbody>
            <tr><td>${monthLabel.split(' ')[1]}-${String(new Date().getDate()).padStart(2, '0')}</td><td><span class="badge success">PATCH</span></td><td>Quarterly EC2 patching — 14 instances updated</td><td>Team Cronos</td></tr>
            <tr><td>${monthLabel.split(' ')[1]}-12</td><td><span class="badge medium">CHANGE</span></td><td>Security group rules updated for production VPC</td><td>Raghul S</td></tr>
            <tr><td>${monthLabel.split(' ')[1]}-08</td><td><span class="badge success">REVIEW</span></td><td>IAM access review completed — 3 unused keys rotated</td><td>Santhosh B</td></tr>
          </tbody>
        </table>
      </div>
      <div class="section">
        <div class="section-title">Open Action Items</div>
        <table>
          <thead><tr><th>#</th><th>Item</th><th>Owner</th><th>Due Date</th><th>Priority</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Enable MFA for all IAM users</td><td>Client</td><td>${monthLabel.split(' ')[1]}-28</td><td><span class="badge high">HIGH</span></td></tr>
            <tr><td>2</td><td>Review and clean up 2 unused EIPs</td><td>Team Cronos</td><td>${monthLabel.split(' ')[1]}-20</td><td><span class="badge medium">MEDIUM</span></td></tr>
            <tr><td>3</td><td>Enable S3 Block Public Access on 1 bucket</td><td>Team Cronos</td><td>${monthLabel.split(' ')[1]}-15</td><td><span class="badge critical">CRITICAL</span></td></tr>
          </tbody>
        </table>
      </div>
    `;
    exportToHTML(`Monthly Report — ${clientName} — ${monthLabel}`, content);
  };

  const reportHistory = months.map((m, i) => ({
    month: m.label, status: i > 0 ? 'Generated' : 'Current', size: `${Math.floor(Math.random() * 200 + 100)}KB`, date: new Date(m.value.split('-')[0], m.value.split('-')[1] - 1, 28).toLocaleDateString('en-IN')
  }));

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>📄 Monthly Reports</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Comprehensive monthly AWS infrastructure reports · Downloadable HTML & CSV</p>
      </div>

      {/* Generate new report */}
      <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Generate Monthly Report</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
          Generates a comprehensive report including security findings, cost analysis, infrastructure changes, patch status, and action items.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
            style={{ padding: '10px 14px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', minWidth: 200 }}>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <button onClick={generateReport} disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", opacity: generating ? 0.7 : 1 }}>
            {generating ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating...</> : '📄 Generate & Download HTML Report'}
          </button>
        </div>
        {generated && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 13, animation: 'fadeIn 0.3s ease' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
            Report generated and download started!
          </div>
        )}
      </div>

      {/* Report history */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>
          Report History
        </div>
        {reportHistory.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1a2540', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>📄</span>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>Monthly Report — {r.month}</div>
                <div style={{ color: '#4a5878', fontSize: 11, marginTop: 2 }}>{r.date} · {r.size}</div>
              </div>
            </div>
            <div style={{ display: 'flex', align: 'center', gap: 10 }}>
              <span className={`badge badge-${i === 0 ? 'info' : 'success'}`}>{r.status}</span>
              <button onClick={generateReport} style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
