import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart } from 'recharts';
import api from '../../utils/api';
import { exportToHTML, generateCostReportHTML, exportToCSV } from '../../utils/exportUtils';

var COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316'];

var MOCK_COST = {
  totalLastMonth: 54282.68,
  totalTwoMonthsAgo: 38910.40,
  monthlyTrend: [
    { month: 'Oct 2024', cost: 28400, budget: 35000 },
    { month: 'Nov 2024', cost: 31200, budget: 35000 },
    { month: 'Dec 2024', cost: 36800, budget: 40000 },
    { month: 'Jan 2025', cost: 38910, budget: 40000 },
    { month: 'Feb 2025', cost: 54282, budget: 45000 },
  ],
  serviceBreakdown: [
    { service: 'Amazon EC2', lastMonth: 22400, twoMonthsAgo: 16800, percentage: 41 },
    { service: 'Amazon RDS', lastMonth: 11200, twoMonthsAgo: 9400, percentage: 21 },
    { service: 'Amazon EKS', lastMonth: 8600, twoMonthsAgo: 5200, percentage: 16 },
    { service: 'Amazon S3', lastMonth: 4800, twoMonthsAgo: 3600, percentage: 9 },
    { service: 'AWS Lambda', lastMonth: 2100, twoMonthsAgo: 1900, percentage: 4 },
    { service: 'Amazon CloudFront', lastMonth: 1800, twoMonthsAgo: 1400, percentage: 3 },
    { service: 'Other Services', lastMonth: 3382, twoMonthsAgo: 610, percentage: 6 },
  ],
  unusedEIPs: [
    { allocationId: 'eipalloc-0abc12345', publicIp: '52.66.32.10', region: 'ap-south-1', monthlyCost: '$3.65', createdDays: 45 },
    { allocationId: 'eipalloc-0def67890', publicIp: '13.234.54.89', region: 'ap-south-1', monthlyCost: '$3.65', createdDays: 120 },
  ],
  oldAMIs: [
    { imageId: 'ami-0abc12345def67890', name: 'prod-app-ami-2024-01', createdDate: '2024-01-15', ageDays: 120, snapshotCount: 2, estimatedCost: '$2.40/month' },
    { imageId: 'ami-0xyz98765abc43210', name: 'staging-ami-backup', createdDate: '2024-02-10', ageDays: 95, snapshotCount: 1, estimatedCost: '$1.20/month' },
    { imageId: 'ami-0lmn11111pqr22222', name: 'bastion-old-ami', createdDate: '2023-11-20', ageDays: 180, snapshotCount: 1, estimatedCost: '$0.90/month' },
  ],
  oldSnapshots: [
    { snapshotId: 'snap-0abc1234def56789', volumeId: 'vol-0abc12345', size: '50 GB', createdDate: '2024-01-05', ageDays: 130, estimatedCost: '$2.50/month' },
    { snapshotId: 'snap-0def5678abc12345', volumeId: 'vol-0def56789', size: '100 GB', createdDate: '2024-02-20', ageDays: 85, estimatedCost: '$5.00/month' },
    { snapshotId: 'snap-0ghi9012jkl34567', volumeId: 'vol-0ghi90123', size: '200 GB', createdDate: '2023-12-10', ageDays: 170, estimatedCost: '$10.00/month' },
  ],
  oldRDSSnapshots: [
    { snapshotId: 'rds:prod-mysql-2024-01-15', dbInstance: 'prod-mysql', size: '100 GB', createdDate: '2024-01-15', ageDays: 120, estimatedCost: '$2.30/month' },
    { snapshotId: 'rds:staging-pg-2024-02-01', dbInstance: 'staging-pg', size: '50 GB', createdDate: '2024-02-01', ageDays: 100, estimatedCost: '$1.15/month' },
  ],
  anomalies: [
    { date: '2025-02-15', service: 'Amazon EC2', anomalyAmount: '$5,600', expectedAmount: '$16,800', actualAmount: '$22,400', severity: 'HIGH', reason: 'New autoscaling group launched 12 extra instances' },
    { date: '2025-02-20', service: 'Amazon EKS', anomalyAmount: '$3,400', expectedAmount: '$5,200', actualAmount: '$8,600', severity: 'HIGH', reason: 'Node group scaled up unexpectedly' },
    { date: '2025-02-22', service: 'Amazon S3', anomalyAmount: '$1,200', expectedAmount: '$3,600', actualAmount: '$4,800', severity: 'MEDIUM', reason: 'Increased data transfer out to internet' },
  ]
};

export default function CostPanel({ clientId, clientName }) {
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [activeTab, setActiveTab] = useState('overview');

  useEffect(function() {
    api.get('/aws/cost/' + clientId)
      .then(function() {})
      .catch(function() {});
    setTimeout(function() {
      setData(MOCK_COST);
      setLoading(false);
    }, 800);
  }, [clientId]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!data) return null;

  var change = (((data.totalLastMonth - data.totalTwoMonthsAgo) / data.totalTwoMonthsAgo) * 100).toFixed(1);
  var isUp = change > 0;

  // Service comparison data with delta
  var serviceCompare = data.serviceBreakdown.map(function(s) {
    var delta = s.lastMonth - s.twoMonthsAgo;
    var pct = ((delta / s.twoMonthsAgo) * 100).toFixed(1);
    return { ...s, delta: delta, deltaPct: pct, isUp: delta > 0 };
  }).sort(function(a, b) { return b.delta - a.delta; });

  var tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'comparison', label: '📈 MoM Comparison' },
    { id: 'services', label: '🔧 By Service' },
    { id: 'waste', label: '♻️ Waste & Cleanup' },
    { id: 'anomalies', label: '⚠️ Anomalies' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>💰 Cost Optimization</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>AWS Cost Explorer · Last 2 months analysis · Waste detection · Anomaly alerts</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={function() { exportToHTML('Cost Report -- ' + clientName, generateCostReportHTML(clientName, data)); }} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📄 HTML</button>
          <button onClick={function() { exportToCSV('Cost_' + clientName, ['Service','Last Month','2 Months Ago','Delta','% Change'], serviceCompare.map(function(s) { return [s.service, '$' + s.lastMonth.toLocaleString(), '$' + s.twoMonthsAgo.toLocaleString(), (s.isUp ? '+' : '') + '$' + Math.abs(s.delta).toLocaleString(), (s.isUp ? '+' : '') + s.deltaPct + '%']; })); }} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📊 CSV</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Last Month', value: '$' + (data.totalLastMonth / 1000).toFixed(1) + 'K', color: '#3b82f6' },
          { label: '2 Months Ago', value: '$' + (data.totalTwoMonthsAgo / 1000).toFixed(1) + 'K', color: '#8b5cf6' },
          { label: 'MoM Change', value: (isUp ? '↑' : '↓') + ' ' + Math.abs(change) + '%', color: isUp ? '#ef4444' : '#10b981' },
          { label: 'Unused EIPs', value: data.unusedEIPs.length, color: '#f59e0b' },
          { label: 'Old Snapshots', value: data.oldSnapshots.length + data.oldRDSSnapshots.length, color: '#f97316' },
          { label: 'Old AMIs', value: data.oldAMIs.length, color: '#ec4899' },
          { label: 'Anomalies', value: data.anomalies.length, color: '#ef4444' },
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background: '#111827', border: '1px solid ' + s.color + '22', borderRadius: 12, padding: '14px' }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ color: '#4a5878', fontSize: 11, marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(function(t) {
          return (
            <button key={t.id} onClick={function() { setActiveTab(t.id); }}
              style={{ padding: '8px 16px', background: activeTab === t.id ? 'rgba(59,130,246,0.12)' : '#111827', border: activeTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2d47', borderRadius: 10, color: activeTab === t.id ? '#60a5fa' : '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
            <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Monthly Spend vs Budget</div>
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={data.monthlyTrend}>
                <XAxis dataKey="month" tick={{ fill: '#4a5878', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a5878', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={function(v) { return '$' + (v/1000).toFixed(0) + 'K'; }} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={function(v, n) { return ['$' + Number(v).toLocaleString(), n]; }} />
                <Bar dataKey="cost" name="Actual Cost" fill="#3b82f6" radius={[4,4,0,0]} />
                <Line type="monotone" dataKey="budget" name="Budget" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
            <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Service Breakdown</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.serviceBreakdown} dataKey="lastMonth" nameKey="service" cx="50%" cy="50%" outerRadius={80} paddingAngle={2} innerRadius={35}>
                  {data.serviceBreakdown.map(function(_, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={function(v) { return ['$' + Number(v).toLocaleString(), 'Cost']; }} />
                <Legend iconType="circle" formatter={function(val) { return React.createElement('span', { style: { color: '#8a9bc5', fontSize: 11 } }, val); }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Month-over-Month Comparison */}
      {activeTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
            <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Service Cost Comparison — Last Month vs Previous Month</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={serviceCompare} layout="vertical">
                <XAxis type="number" tick={{ fill: '#4a5878', fontSize: 11 }} tickFormatter={function(v) { return '$' + (v/1000).toFixed(0) + 'K'; }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="service" tick={{ fill: '#8a9bc5', fontSize: 11 }} width={140} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={function(v) { return ['$' + Number(v).toLocaleString(), '']; }} />
                <Bar dataKey="twoMonthsAgo" name="2 Months Ago" fill="#4a5878" radius={[0,4,4,0]} />
                <Bar dataKey="lastMonth" name="Last Month" fill="#3b82f6" radius={[0,4,4,0]} />
                <Legend formatter={function(val) { return React.createElement('span', { style: { color: '#8a9bc5', fontSize: 11 } }, val); }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Services with biggest increase */}
          <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540' }}>
              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>🔺 Services with Cost Increase</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1424' }}>
                  {['Service','2 Months Ago','Last Month','Increase','% Change','Action'].map(function(h) {
                    return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {serviceCompare.map(function(s, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                      <td style={{ padding: '11px 14px', color: '#e2e8f0', fontWeight: 600, fontSize: 13 }}>{s.service}</td>
                      <td style={{ padding: '11px 14px', color: '#8b5cf6', fontSize: 13 }}>${s.twoMonthsAgo.toLocaleString()}</td>
                      <td style={{ padding: '11px 14px', color: '#3b82f6', fontSize: 13, fontWeight: 700 }}>${s.lastMonth.toLocaleString()}</td>
                      <td style={{ padding: '11px 14px', color: s.isUp ? '#ef4444' : '#10b981', fontWeight: 700, fontSize: 13 }}>
                        {s.isUp ? '+' : ''}{s.delta < 0 ? '-' : ''}${Math.abs(s.delta).toLocaleString()}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ background: s.isUp ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: s.isUp ? '#ef4444' : '#10b981', border: '1px solid ' + (s.isUp ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'), borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>
                          {s.isUp ? '↑' : '↓'} {Math.abs(s.deltaPct)}%
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', color: '#4a5878', fontSize: 12 }}>
                        {s.isUp && s.deltaPct > 20 ? '⚠️ Investigate spike' : s.isUp ? 'Monitor usage' : '✅ Reduced'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Service */}
      {activeTab === 'services' && (
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
          <div style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Cost by Service — Last Month</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.serviceBreakdown} layout="vertical">
              <XAxis type="number" tick={{ fill: '#4a5878', fontSize: 11 }} tickFormatter={function(v) { return '$' + (v/1000).toFixed(0) + 'K'; }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="service" tick={{ fill: '#8a9bc5', fontSize: 12 }} width={160} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={function(v) { return ['$' + Number(v).toLocaleString(), 'Cost']; }} />
              <Bar dataKey="lastMonth" name="Cost" radius={[0,6,6,0]}>
                {data.serviceBreakdown.map(function(_, i) { return <Cell key={i} fill={COLORS[i % COLORS.length]} />; })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Waste */}
      {activeTab === 'waste' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <WasteTable title="⚡ Unused Elastic IPs" items={data.unusedEIPs}
            cols={['Allocation ID','Public IP','Region','Monthly Cost','Days Idle']}
            rows={data.unusedEIPs.map(function(e) { return [e.allocationId, e.publicIp, e.region, e.monthlyCost, e.createdDays + ' days']; })} />
          <WasteTable title="🖼️ AMIs Older than 3 Months" items={data.oldAMIs}
            cols={['AMI ID','Name','Created','Age (Days)','Snapshots','Est. Cost']}
            rows={data.oldAMIs.map(function(a) { return [a.imageId, a.name, a.createdDate, a.ageDays, a.snapshotCount, a.estimatedCost]; })} />
          <WasteTable title="💾 EBS Snapshots Older than 3 Months" items={data.oldSnapshots}
            cols={['Snapshot ID','Volume ID','Size','Created','Age (Days)','Est. Cost']}
            rows={data.oldSnapshots.map(function(s) { return [s.snapshotId, s.volumeId, s.size, s.createdDate, s.ageDays, s.estimatedCost]; })} />
          <WasteTable title="🗄️ RDS Snapshots Older than 3 Months" items={data.oldRDSSnapshots}
            cols={['Snapshot ID','DB Instance','Size','Created','Age (Days)','Est. Cost']}
            rows={data.oldRDSSnapshots.map(function(s) { return [s.snapshotId, s.dbInstance, s.size, s.createdDate, s.ageDays, s.estimatedCost]; })} />
        </div>
      )}

      {/* Anomalies */}
      {activeTab === 'anomalies' && (
        <div style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14 }}>⚠️ Cost Anomalies — {data.anomalies.length} detected</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d1424' }}>
                {['Date','Service','Expected','Actual','Anomaly Amount','Severity','Likely Reason'].map(function(h) {
                  return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {data.anomalies.map(function(a, i) {
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                    <td style={{ padding: '12px 14px', color: '#8a9bc5', fontSize: 13 }}>{a.date}</td>
                    <td style={{ padding: '12px 14px', color: '#06b6d4', fontWeight: 600 }}>{a.service}</td>
                    <td style={{ padding: '12px 14px', color: '#10b981' }}>{a.expectedAmount}</td>
                    <td style={{ padding: '12px 14px', color: '#ef4444', fontWeight: 700 }}>{a.actualAmount}</td>
                    <td style={{ padding: '12px 14px', color: '#f59e0b', fontWeight: 800 }}>{a.anomalyAmount}</td>
                    <td style={{ padding: '12px 14px' }}><span className={'badge badge-' + a.severity.toLowerCase()}>{a.severity}</span></td>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12 }}>{a.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WasteTable(props) {
  var title = props.title; var items = props.items; var cols = props.cols; var rows = props.rows;
  if (!items || !items.length) return (
    <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, padding: '20px 18px' }}>
      <div style={{ color: '#8a9bc5', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ color: '#10b981', fontSize: 13 }}>✅ No items found — clean!</div>
    </div>
  );
  return (
    <div style={{ background: '#111827', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '2px 10px', color: '#f59e0b', fontSize: 12 }}>{items.length} items</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#0d1424' }}>{cols.map(function(c) { return <th key={c} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c}</th>; })}</tr></thead>
          <tbody>{rows.map(function(r, i) { return <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>{r.map(function(cell, j) { return <td key={j} style={{ padding: '10px 14px', fontSize: 12, color: j === 0 ? '#64748b' : '#94a3b8', fontFamily: j === 0 ? 'monospace' : 'inherit', whiteSpace: 'nowrap' }}>{cell}</td>; })}</tr>; })}</tbody>
        </table>
      </div>
    </div>
  );
}
