import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToHTML, exportToCSV } from '../../utils/exportUtils';

export default function PatchingPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('comparison');

  useEffect(() => {
    api.get(`/aws/patching/${clientId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [clientId]);

  const handleExportHTML = () => {
    if (!data) return;
    const preScanRows = data.preScan.instances.map(i => `
      <tr>
        <td style="font-family:monospace">${i.id}</td><td>${i.name}</td><td>${i.os}</td>
        <td style="font-family:monospace;font-size:11px">${i.kernelVersion}</td>
        <td style="color:#d97706;font-weight:700">${i.pendingUpdates}</td>
        <td style="color:#dc2626;font-weight:700">${i.criticalUpdates}</td>
        <td><span class="badge medium">${i.status}</span></td>
      </tr>
    `).join('');
    const postScanRows = data.postScan.instances.map(i => `
      <tr>
        <td style="font-family:monospace">${i.id}</td><td>${i.name}</td><td>${i.os}</td>
        <td style="font-family:monospace;font-size:11px">${i.kernelVersion}</td>
        <td style="color:#16a34a;font-weight:700">${i.pendingUpdates}</td>
        <td style="color:#16a34a;font-weight:700">${i.criticalUpdates}</td>
        <td><span class="badge success">${i.status}</span></td>
      </tr>
    `).join('');
    const content = `
      <div class="section">
        <div class="section-title">Pre-Patch Scan — ${new Date(data.preScan.scanDate).toLocaleString()}</div>
        <table><thead><tr><th>Instance ID</th><th>Name</th><th>OS</th><th>Kernel</th><th>Pending</th><th>Critical</th><th>Status</th></tr></thead>
        <tbody>${preScanRows}</tbody></table>
      </div>
      <div class="section">
        <div class="section-title">Post-Patch Scan — ${new Date(data.postScan.scanDate).toLocaleString()}</div>
        <table><thead><tr><th>Instance ID</th><th>Name</th><th>OS</th><th>Kernel</th><th>Pending</th><th>Critical</th><th>Status</th></tr></thead>
        <tbody>${postScanRows}</tbody></table>
      </div>
    `;
    exportToHTML(`EC2 Patching Report — ${clientName}`, content);
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!data) return null;

  const totalPatched = data.postScan.instances.filter(i => i.status === 'PATCHED').length;
  const totalPatchedPct = Math.round((totalPatched / data.postScan.instances.length) * 100);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔧 EC2 Patching</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Pre & Post patch scan comparison · Quarterly patching cycle</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExportHTML} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📄 Export Report</button>
        </div>
      </div>

      {/* Summary banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Instances', value: data.preScan.instances.length, color: '#3b82f6', icon: '🖥️' },
          { label: 'Patched Successfully', value: totalPatched, color: '#10b981', icon: '✅' },
          { label: 'Patch Coverage', value: `${totalPatchedPct}%`, color: '#10b981', icon: '📊' },
          { label: 'Pre-Scan Date', value: new Date(data.preScan.scanDate).toLocaleDateString('en-IN'), color: '#f59e0b', icon: '📅' },
          { label: 'Post-Scan Date', value: new Date(data.postScan.scanDate).toLocaleDateString('en-IN'), color: '#8b5cf6', icon: '📅' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#111827', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 14px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#4a5878', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'comparison', label: '↔️ Side-by-side' },
          { id: 'pre', label: '🔴 Pre-Patch' },
          { id: 'post', label: '✅ Post-Patch' },
        ].map(v => (
          <button key={v.id} onClick={() => setView(v.id)}
            style={{ padding: '8px 16px', background: view === v.id ? 'rgba(59,130,246,0.12)' : '#111827', border: view === v.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2d47', borderRadius: 10, color: view === v.id ? '#60a5fa' : '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Tables */}
      {view === 'comparison' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ScanTable title="🔴 Pre-Patch Scan" scan={data.preScan} isPre />
          <ScanTable title="✅ Post-Patch Scan" scan={data.postScan} isPre={false} />
        </div>
      )}
      {view === 'pre' && <ScanTable title="🔴 Pre-Patch Scan" scan={data.preScan} isPre full />}
      {view === 'post' && <ScanTable title="✅ Post-Patch Scan" scan={data.postScan} isPre={false} full />}
    </div>
  );
}

function ScanTable({ title, scan, isPre, full }) {
  return (
    <div style={{ background: '#111827', border: `1px solid ${isPre ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: isPre ? '#f87171' : '#34d399' }}>{title}</span>
        <span style={{ fontSize: 11, color: '#4a5878' }}>{new Date(scan.scanDate).toLocaleString('en-IN')}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d1424' }}>
              <th style={thStyle}>Name</th>
              {full && <th style={thStyle}>Instance ID</th>}
              <th style={thStyle}>OS</th>
              <th style={thStyle}>Pending</th>
              <th style={thStyle}>Critical</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {scan.instances.map((inst, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                <td style={{ ...tdStyle, color: '#e2e8f0', fontWeight: 500 }}>{inst.name}</td>
                {full && <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{inst.id}</td>}
                <td style={{ ...tdStyle, color: '#8a9bc5', fontSize: 11 }}>{inst.os}</td>
                <td style={tdStyle}>
                  <span style={{ color: inst.pendingUpdates > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{inst.pendingUpdates}</span>
                </td>
                <td style={tdStyle}>
                  <span style={{ color: inst.criticalUpdates > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{inst.criticalUpdates}</span>
                </td>
                <td style={tdStyle}>
                  <span className={`badge badge-${inst.status === 'PATCHED' ? 'success' : 'warning'}`} style={{ fontSize: 10 }}>
                    {inst.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = { padding: '9px 12px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdStyle = { padding: '10px 12px', fontSize: 12, color: '#94a3b8' };
