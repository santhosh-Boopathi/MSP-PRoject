import React, { useState } from 'react';
import { exportToHTML } from '../../utils/exportUtils';

export default function MonthlyReportPanel({ clientId, clientName }) {
  var [generating, setGenerating] = useState(false);
  var [generated, setGenerated] = useState(false);
  var [selectedMonth, setSelectedMonth] = useState('');

  var months = [];
  for (var i = 0; i < 6; i++) {
    var d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
      value: d.getFullYear() + '-' + (d.getMonth() + 1)
    });
  }
  if (!selectedMonth) selectedMonth = months[0].value;

  var generateReport = function() {
    setGenerating(true);
    setTimeout(function() {
      setGenerated(true);
      setGenerating(false);

      var parts = selectedMonth.split('-');
      var monthLabel = new Date(Number(parts[0]), Number(parts[1]) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

      var content = '\n      <div class="section">\n        <div class="section-title">Executive Summary</div>\n        <p style="color:#475569;font-size:14px;line-height:1.7;margin-bottom:16px">\n          This monthly operations report covers AWS infrastructure managed by ShellKode Team Cronos for\n          <strong>' + clientName + '</strong> during <strong>' + monthLabel + '</strong>.\n          The report details security posture improvements, cost analysis, infrastructure changes, patching status,\n          SSL/domain monitoring, reserved instance utilization, and open action items.\n        </p>\n        <div class="summary-grid">\n          <div class="summary-card"><div class="value" style="color:#2563eb">74</div><div class="label">Security Score</div></div>\n          <div class="summary-card"><div class="value" style="color:#dc2626">2</div><div class="label">Critical Findings</div></div>\n          <div class="summary-card"><div class="value" style="color:#16a34a">$54,282</div><div class="label">AWS Cost</div></div>\n          <div class="summary-card"><div class="value" style="color:#dc2626">+17.3%</div><div class="label">Cost Change MoM</div></div>\n          <div class="summary-card"><div class="value" style="color:#16a34a">100%</div><div class="label">Patch Coverage</div></div>\n          <div class="summary-card"><div class="value" style="color:#16a34a">99.9%</div><div class="label">Uptime SLA</div></div>\n          <div class="summary-card"><div class="value" style="color:#d97706">23</div><div class="label">FreshDesk Tickets</div></div>\n          <div class="summary-card"><div class="value" style="color:#7c3aed">$611</div><div class="label">Savings Identified</div></div>\n        </div>\n      </div>\n\n      <div class="section">\n        <div class="section-title">Critical Actions Performed This Month</div>\n        <table>\n          <thead><tr><th>Date</th><th>Category</th><th>Action Taken</th><th>Impact</th><th>Performed By</th></tr></thead>\n          <tbody>\n            <tr><td>3rd</td><td><span class="badge critical">SECURITY</span></td><td>Remediated S3 public access bucket — enabled Block Public Access on prod-data-bucket</td><td>HIGH — prevented potential data exposure</td><td>Raghul S</td></tr>\n            <tr><td>7th</td><td><span class="badge high">PATCHING</span></td><td>Quarterly EC2 patch cycle — updated 7 production instances, 2 staging instances</td><td>HIGH — 3 critical CVEs patched</td><td>Santhosh B</td></tr>\n            <tr><td>10th</td><td><span class="badge medium">COST</span></td><td>Identified and flagged 3 unused Elastic IPs and 3 AMIs older than 90 days for cleanup</td><td>MEDIUM — $45/month waste identified</td><td>Surya K</td></tr>\n            <tr><td>14th</td><td><span class="badge high">SECURITY</span></td><td>Restricted SSH Security Group rule from 0.0.0.0/0 to office IP range 203.x.x.x/32</td><td>HIGH — reduced attack surface</td><td>Gokul A</td></tr>\n            <tr><td>18th</td><td><span class="badge medium">MONITORING</span></td><td>Configured CloudWatch alarms for EC2 CPU > 85% and RDS storage > 80%</td><td>MEDIUM — improved visibility</td><td>Hemanath U</td></tr>\n            <tr><td>21st</td><td><span class="badge high">COST</span></td><td>Investigated EC2 cost spike — identified autoscaling misconfiguration, corrected max capacity</td><td>HIGH — prevented $5,600 recurring overcharge</td><td>Raghul S</td></tr>\n            <tr><td>25th</td><td><span class="badge medium">OPTIMIZATION</span></td><td>Applied Compute Optimizer recommendation — downsized 2 EC2 instances (m5.2xlarge to m5.large)</td><td>MEDIUM — saving $208/month</td><td>Pradeep P</td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <div class="section">\n        <div class="section-title">Security Posture</div>\n        <table>\n          <thead><tr><th>Finding</th><th>Severity</th><th>Status</th><th>Action</th></tr></thead>\n          <tbody>\n            <tr><td>S3 public bucket access</td><td><span class="badge critical">CRITICAL</span></td><td><span class="badge success">RESOLVED</span></td><td>Block Public Access enabled</td></tr>\n            <tr><td>SSH open to 0.0.0.0/0</td><td><span class="badge high">HIGH</span></td><td><span class="badge success">RESOLVED</span></td><td>Restricted to office IP</td></tr>\n            <tr><td>IAM User without MFA</td><td><span class="badge high">HIGH</span></td><td><span class="badge medium">IN PROGRESS</span></td><td>Client action pending</td></tr>\n            <tr><td>RDS not encrypted at rest</td><td><span class="badge high">HIGH</span></td><td><span class="badge medium">PLANNED</span></td><td>Scheduled for next month</td></tr>\n            <tr><td>GuardDuty not enabled</td><td><span class="badge medium">MEDIUM</span></td><td><span class="badge success">RESOLVED</span></td><td>Enabled in all regions</td></tr>\n            <tr><td>VPC Flow Logs disabled</td><td><span class="badge low">LOW</span></td><td><span class="badge medium">IN PROGRESS</span></td><td>Enabling in 2 remaining VPCs</td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <div class="section">\n        <div class="section-title">Cost Analysis</div>\n        <table>\n          <thead><tr><th>Service</th><th>Previous Month</th><th>This Month</th><th>Change</th><th>Reason</th></tr></thead>\n          <tbody>\n            <tr><td>Amazon EC2</td><td>$16,800</td><td><strong>$22,400</strong></td><td style="color:#dc2626">↑ +33.3%</td><td>Autoscaling misconfiguration (corrected)</td></tr>\n            <tr><td>Amazon EKS</td><td>$5,200</td><td><strong>$8,600</strong></td><td style="color:#dc2626">↑ +65.4%</td><td>Node group scale-up — being investigated</td></tr>\n            <tr><td>Amazon RDS</td><td>$9,400</td><td><strong>$11,200</strong></td><td style="color:#dc2626">↑ +19.1%</td><td>Read replica added for performance</td></tr>\n            <tr><td>Amazon S3</td><td>$3,600</td><td><strong>$4,800</strong></td><td style="color:#dc2626">↑ +33.3%</td><td>Increased data transfer out</td></tr>\n            <tr><td>AWS Lambda</td><td>$1,900</td><td><strong>$2,100</strong></td><td style="color:#dc2626">↑ +10.5%</td><td>Increased invocations — normal growth</td></tr>\n            <tr><td>Other Services</td><td>$2,010</td><td><strong>$5,182</strong></td><td style="color:#dc2626">↑ +157.8%</td><td>New Data Transfer charges</td></tr>\n            <tr style="background:#f8fafc"><td><strong>TOTAL</strong></td><td><strong>$38,910</strong></td><td><strong>$54,282</strong></td><td style="color:#dc2626"><strong>↑ +39.5%</strong></td><td>Major spikes in EC2 and EKS</td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <div class="section">\n        <div class="section-title">Patching Summary</div>\n        <table>\n          <thead><tr><th>Server</th><th>OS</th><th>Pre-Patch Updates</th><th>Post-Patch Updates</th><th>Critical CVEs Fixed</th><th>Status</th></tr></thead>\n          <tbody>\n            <tr><td>prod-app-01</td><td>Amazon Linux 2</td><td>23</td><td>0</td><td>2</td><td><span class="badge success">PATCHED</span></td></tr>\n            <tr><td>prod-app-02</td><td>Ubuntu 22.04</td><td>15</td><td>0</td><td>1</td><td><span class="badge success">PATCHED</span></td></tr>\n            <tr><td>prod-app-03</td><td>Amazon Linux 2</td><td>18</td><td>0</td><td>0</td><td><span class="badge success">PATCHED</span></td></tr>\n            <tr><td>bastion-host</td><td>Amazon Linux 2</td><td>8</td><td>0</td><td>0</td><td><span class="badge success">PATCHED</span></td></tr>\n            <tr><td>staging-app-01</td><td>Ubuntu 20.04</td><td>31</td><td>0</td><td>1</td><td><span class="badge success">PATCHED</span></td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <div class="section">\n        <div class="section-title">SSL & Expiry Monitoring</div>\n        <table>\n          <thead><tr><th>Type</th><th>Item</th><th>Expiry Date</th><th>Days Remaining</th><th>Status</th></tr></thead>\n          <tbody>\n            <tr><td>SSL Certificate</td><td>paynearby.in</td><td>May 2025</td><td>82 days</td><td><span class="badge success">VALID</span></td></tr>\n            <tr><td>SSL Certificate</td><td>api.paynearby.in</td><td>Mar 2025</td><td>12 days</td><td><span class="badge critical">RENEW NOW</span></td></tr>\n            <tr><td>EC2 Reserved Instance</td><td>m5.xlarge x3</td><td>Apr 2025</td><td>28 days</td><td><span class="badge high">WARNING</span></td></tr>\n            <tr><td>EC2 Reserved Instance</td><td>r5.2xlarge x2</td><td>Mar 2025</td><td>8 days</td><td><span class="badge critical">RENEW NOW</span></td></tr>\n            <tr><td>EC2 Savings Plan</td><td>EC2 Instance Savings Plan</td><td>Apr 2025</td><td>22 days</td><td><span class="badge high">WARNING</span></td></tr>\n            <tr><td>RDS RI</td><td>db.t3.medium PostgreSQL</td><td>Mar 2025</td><td>7 days</td><td><span class="badge critical">RENEW NOW</span></td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <div class="section">\n        <div class="section-title">Open Action Items</div>\n        <table>\n          <thead><tr><th>#</th><th>Item</th><th>Priority</th><th>Owner</th><th>Due Date</th></tr></thead>\n          <tbody>\n            <tr><td>1</td><td>Renew EC2 Reserved Instance: r5.2xlarge x2 (expires in 8 days)</td><td><span class="badge critical">CRITICAL</span></td><td>Client + Team Cronos</td><td>This week</td></tr>\n            <tr><td>2</td><td>Renew SSL for api.paynearby.in (expires in 12 days)</td><td><span class="badge critical">CRITICAL</span></td><td>Team Cronos</td><td>This week</td></tr>\n            <tr><td>3</td><td>Enable MFA for IAM users with console access</td><td><span class="badge high">HIGH</span></td><td>Client</td><td>End of month</td></tr>\n            <tr><td>4</td><td>Investigate EKS node group cost spike ($3,400 overage)</td><td><span class="badge high">HIGH</span></td><td>Team Cronos</td><td>Next 2 weeks</td></tr>\n            <tr><td>5</td><td>Enable RDS encryption at rest for prod-mysql</td><td><span class="badge medium">MEDIUM</span></td><td>Team Cronos</td><td>Next month</td></tr>\n            <tr><td>6</td><td>Clean up 3 unused EIPs ($21.90/month savings)</td><td><span class="badge low">LOW</span></td><td>Team Cronos</td><td>Next month</td></tr>\n          </tbody>\n        </table>\n      </div>\n\n      <div class="section">\n        <div class="section-title">FreshDesk Ticket Summary</div>\n        <div class="summary-grid">\n          <div class="summary-card"><div class="value" style="color:#2563eb">23</div><div class="label">Total Tickets</div></div>\n          <div class="summary-card"><div class="value" style="color:#16a34a">15</div><div class="label">Resolved</div></div>\n          <div class="summary-card"><div class="value" style="color:#dc2626">3</div><div class="label">Open</div></div>\n          <div class="summary-card"><div class="value" style="color:#d97706">3</div><div class="label">Customer Pending</div></div>\n          <div class="summary-card"><div class="value" style="color:#7c3aed">2</div><div class="label">Avg Resolution Time (hrs)</div></div>\n        </div>\n      </div>\n    ';

      exportToHTML('Monthly Report -- ' + clientName + ' -- ' + monthLabel, content);
    }, 1800);
  };

  var reportHistory = months.map(function(m, i) {
    return { month: m.label, status: i === 0 ? 'Current' : 'Generated', size: (Math.floor(Math.random() * 200) + 100) + 'KB' };
  });

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>📄 Monthly Reports</h2>
        <p style={{ color: '#64748b', fontSize: 13 }}>Comprehensive monthly operations report — security, cost, patching, SSL, RIs, tickets, action items</p>
      </div>

      {/* What's included */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
        {['Executive Summary', 'Critical Actions Done', 'Security Findings', 'Cost Analysis & MoM', 'Patching Summary', 'SSL & Expiry Status', 'RI & Savings Plans', 'Ticket Summary', 'Open Action Items'].map(function(item, i) {
          return (
            <div key={i} style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#10b981', fontSize: 14 }}>✅</span>
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{item}</span>
            </div>
          );
        })}
      </div>

      {/* Generate */}
      <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.05))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: '#f0f4ff', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Generate Monthly Report</h3>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
          Downloads a complete HTML report covering all MSP activities for the selected month including all critical actions performed, security remediations, cost analysis, and pending items.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedMonth} onChange={function(e) { selectedMonth = e.target.value; }}
            style={{ padding: '10px 14px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', minWidth: 200 }}>
            {months.map(function(m) { return <option key={m.value} value={m.value}>{m.label}</option>; })}
          </select>
          <button onClick={generateReport} disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: generating ? 0.7 : 1 }}>
            {generating ? 'Generating...' : '📄 Download HTML Report'}
          </button>
        </div>
        {generated && (
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 13, animation: 'fadeIn 0.3s ease' }}>
            ✅ Report generated and downloaded!
          </div>
        )}
      </div>

      {/* History */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>Report History</div>
        {reportHistory.map(function(r, i) {
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1a2540', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20 }}>📄</span>
                <div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500 }}>Monthly Report — {r.month} — {clientName}</div>
                  <div style={{ color: '#4a5878', fontSize: 11, marginTop: 2 }}>{r.size}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={'badge badge-' + (i === 0 ? 'info' : 'success')}>{r.status}</span>
                <button onClick={generateReport} style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>Download</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
