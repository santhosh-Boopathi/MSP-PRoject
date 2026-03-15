import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../utils/api';
import { exportToHTML, generateCostReportHTML, exportToCSV } from '../../utils/exportUtils';

const COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316'];

export default function CostPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    api.get(`/aws/cost/${clientId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div style={styles.loading}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!data) return null;

  const change = (((data.totalLastMonth - data.totalTwoMonthsAgo) / data.totalTwoMonthsAgo) * 100).toFixed(1);
  const isUp = change > 0;

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'services', label: '🔧 By Service' },
    { id: 'unused', label: '♻️ Waste & Cleanup' },
    { id: 'anomalies', label: '⚠️ Anomalies' },
  ];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>💰 Cost Optimization</h2>
          <p style={styles.sub}>AWS Cost Explorer · Last 2 months analysis · Waste detection</p>
        </div>
        <div style={styles.actions}>
          <button onClick={() => { exportToHTML(`Cost Report — ${clientName}`, generateCostReportHTML(clientName, data)); }} style={styles.exportBtn}>📄 HTML Report</button>
          <button onClick={() => { exportToCSV(`Cost_${clientName}`, ['Service', 'Cost (USD)', '% of Total'], data.serviceBreakdown.map(s => [s.service, s.cost, s.percentage + '%'])); }} style={styles.exportBtn}>📊 CSV</button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={styles.kpiStrip}>
        <div style={styles.kpi}>
          <div style={styles.kpiVal}>${Number(data.totalLastMonth).toLocaleString()}</div>
          <div style={styles.kpiLbl}>Last Month</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiVal, color: '#8b5cf6' }}>${Number(data.totalTwoMonthsAgo).toLocaleString()}</div>
          <div style={styles.kpiLbl}>2 Months Ago</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiVal, color: isUp ? '#ef4444' : '#10b981' }}>
            {isUp ? '↑' : '↓'} {Math.abs(change)}%
          </div>
          <div style={styles.kpiLbl}>MoM Change</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiVal, color: '#f59e0b' }}>{data.unusedEIPs.length + data.oldSnapshots.length + data.oldAMIs.length}</div>
          <div style={styles.kpiLbl}>Waste Items</div>
        </div>
        <div style={styles.kpi}>
          <div style={{ ...styles.kpiVal, color: '#ef4444' }}>{data.anomalies.length}</div>
          <div style={styles.kpiLbl}>Cost Anomalies</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ ...styles.tab, ...(activeTab === t.id ? styles.tabActive : {}) }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Monthly Spend Trend</h4>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.monthlyTrend}>
                <XAxis dataKey="month" tick={{ fill: '#4a5878', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4a5878', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={v => [`$${Number(v).toLocaleString()}`, 'Cost']} />
                <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.chartCard}>
            <h4 style={styles.chartTitle}>Service Breakdown</h4>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.serviceBreakdown} dataKey="cost" nameKey="service" cx="50%" cy="50%" outerRadius={80} paddingAngle={2}>
                  {data.serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={v => [`$${Number(v).toLocaleString()}`, 'Cost']} />
                <Legend iconType="circle" formatter={(val) => <span style={{ color: '#8a9bc5', fontSize: 11 }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Services tab */}
      {activeTab === 'services' && (
        <div style={styles.chartCard}>
          <h4 style={styles.chartTitle}>Cost by Service (Last Month)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.serviceBreakdown} layout="vertical">
              <XAxis type="number" tick={{ fill: '#4a5878', fontSize: 11 }} tickFormatter={v => `$${v}`} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="service" tick={{ fill: '#8a9bc5', fontSize: 12 }} width={160} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 8, color: '#f0f4ff' }} formatter={v => [`$${Number(v).toLocaleString()}`, 'Cost']} />
              <Bar dataKey="cost" radius={[0, 6, 6, 0]}>
                {data.serviceBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Waste tab */}
      {activeTab === 'unused' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <WasteTable title="⚡ Unused Elastic IPs" items={data.unusedEIPs}
            columns={['Allocation ID', 'Public IP', 'Region', 'Monthly Cost', 'Days Idle']}
            rows={data.unusedEIPs.map(e => [e.allocationId, e.publicIp, e.region, e.monthlyCost, e.createdDays])} />
          <WasteTable title="🖼️ AMIs Older than 3 Months" items={data.oldAMIs}
            columns={['AMI ID', 'Name', 'Created', 'Age (Days)', 'Snapshots', 'Est. Cost']}
            rows={data.oldAMIs.map(a => [a.imageId, a.name, a.createdDate, a.ageDays, a.snapshotCount, a.estimatedCost])} />
          <WasteTable title="💾 EBS Snapshots Older than 3 Months" items={data.oldSnapshots}
            columns={['Snapshot ID', 'Volume ID', 'Size', 'Created', 'Age (Days)', 'Est. Cost']}
            rows={data.oldSnapshots.map(s => [s.snapshotId, s.volumeId, s.size, s.createdDate, s.ageDays, s.estimatedCost])} />
          <WasteTable title="🗄️ RDS Snapshots Older than 3 Months" items={data.oldRDSSnapshots}
            columns={['Snapshot ID', 'DB Instance', 'Size', 'Created', 'Age (Days)', 'Est. Cost']}
            rows={data.oldRDSSnapshots.map(s => [s.snapshotId, s.dbInstance, s.size, s.createdDate, s.ageDays, s.estimatedCost])} />
        </div>
      )}

      {/* Anomalies tab */}
      {activeTab === 'anomalies' && (
        <div style={styles.tableWrap}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#f59e0b', fontWeight: 600, fontSize: 14 }}>⚠️ Cost Anomalies Detected</span>
            <span style={{ color: '#4a5878', fontSize: 12 }}>{data.anomalies.length} anomalies this period</span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr style={{ background: '#0d1424' }}>
                {['Date', 'Service', 'Expected', 'Actual', 'Anomaly', 'Severity'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.anomalies.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                  <td style={styles.td}>{a.date}</td>
                  <td style={{ ...styles.td, color: '#06b6d4' }}>{a.service}</td>
                  <td style={{ ...styles.td, color: '#10b981' }}>{a.expectedAmount}</td>
                  <td style={{ ...styles.td, color: '#ef4444', fontWeight: 600 }}>{a.actualAmount}</td>
                  <td style={{ ...styles.td, color: '#f59e0b', fontWeight: 700 }}>{a.anomalyAmount}</td>
                  <td style={styles.td}><span className={`badge badge-${a.severity.toLowerCase()}`}>{a.severity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WasteTable({ title, items, columns, rows }) {
  if (!items?.length) return (
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
          <thead><tr style={{ background: '#0d1424' }}>{columns.map(c => <th key={c} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>{r.map((cell, j) => <td key={j} style={{ padding: '10px 14px', fontSize: 12, color: j === 0 ? '#64748b' : '#94a3b8', fontFamily: j === 0 ? 'monospace' : 'inherit', whiteSpace: 'nowrap' }}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  panel: { animation: 'fadeIn 0.4s ease' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 },
  sub: { color: '#64748b', fontSize: 13 },
  actions: { display: 'flex', gap: 10 },
  exportBtn: { padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 },
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 },
  kpi: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, padding: '16px 14px' },
  kpiVal: { fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: '#3b82f6' },
  kpiLbl: { color: '#4a5878', fontSize: 11, marginTop: 4 },
  tabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tab: { padding: '8px 16px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", transition: 'all 0.2s' },
  tabActive: { background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)', color: '#60a5fa' },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  chartCard: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 },
  chartTitle: { color: '#8a9bc5', fontSize: 13, fontWeight: 600, marginBottom: 16 },
  tableWrap: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' },
  td: { padding: '11px 14px', fontSize: 13, color: '#94a3b8' },
};
