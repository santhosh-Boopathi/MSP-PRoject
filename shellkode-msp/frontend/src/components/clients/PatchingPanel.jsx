import React, { useState } from 'react';
import { exportToCSV } from '../../utils/exportUtils';

var ALL_SERVERS = [
  { id: 'i-0abc1234', name: 'prod-app-01', os: 'Amazon Linux 2', ip: '10.0.1.10', env: 'Production', type: 't3.medium' },
  { id: 'i-0abc1235', name: 'prod-app-02', os: 'Ubuntu 22.04', ip: '10.0.2.10', env: 'Production', type: 't3.medium' },
  { id: 'i-0abc1236', name: 'prod-app-03', os: 'Amazon Linux 2', ip: '10.0.1.11', env: 'Production', type: 't3.large' },
  { id: 'i-0abc1237', name: 'bastion-host', os: 'Amazon Linux 2', ip: '10.0.0.5', env: 'Production', type: 't2.micro' },
  { id: 'i-0abc1238', name: 'staging-app-01', os: 'Ubuntu 20.04', ip: '10.1.1.10', env: 'Staging', type: 't3.small' },
  { id: 'i-0abc1239', name: 'staging-app-02', os: 'Ubuntu 20.04', ip: '10.1.1.11', env: 'Staging', type: 't3.small' },
  { id: 'i-0abc1240', name: 'dev-server-01', os: 'Amazon Linux 2023', ip: '10.2.1.10', env: 'Dev', type: 't3.micro' },
];

var ENV_COLORS = { Production: '#ef4444', Staging: '#f59e0b', Dev: '#3b82f6' };

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makePreScan(servers) {
  return servers.map(function(s) {
    var pending = randomInt(5, 30);
    var critical = randomInt(0, 4);
    return { ...s, kernelBefore: '5.10.68-62.173.amzn2.x86_64', pendingUpdates: pending, criticalUpdates: critical, status: 'NEEDS_PATCHING', securityUpdates: randomInt(1, 8), bugfixUpdates: randomInt(2, 15) };
  });
}

function makePostScan(preServers) {
  return preServers.map(function(s) {
    return { ...s, kernelAfter: '5.10.210-200.855.amzn2.x86_64', pendingUpdates: 0, criticalUpdates: 0, status: 'PATCHED', securityUpdates: 0, bugfixUpdates: 0, patchedAt: new Date().toISOString() };
  });
}

export default function PatchingPanel(props) {
  var clientName = props.clientName;
  var [step, setStep] = useState(1); // 1=select, 2=pre, 3=patch, 4=post
  var [selectedIds, setSelectedIds] = useState([]);
  var [envFilter, setEnvFilter] = useState('ALL');
  var [preScan, setPreScan] = useState(null);
  var [postScan, setPostScan] = useState(null);
  var [scanning, setScanning] = useState(false);
  var [patching, setPatching] = useState(false);
  var [patchProgress, setPatchProgress] = useState(0);

  var filtered = ALL_SERVERS.filter(function(s) { return envFilter === 'ALL' || s.env === envFilter; });

  var toggleServer = function(id) {
    setSelectedIds(function(prev) { return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : [...prev, id]; });
  };
  var selectAll = function() { setSelectedIds(filtered.map(function(s) { return s.id; })); };
  var clearAll = function() { setSelectedIds([]); };

  var selectedServers = ALL_SERVERS.filter(function(s) { return selectedIds.includes(s.id); });

  var runPreScan = function() {
    if (!selectedIds.length) return;
    setScanning(true);
    setTimeout(function() {
      setPreScan({ scanDate: new Date().toISOString(), servers: makePreScan(selectedServers) });
      setScanning(false);
      setStep(2);
    }, 2200);
  };

  var runPatching = function() {
    setPatching(true);
    setPatchProgress(0);
    var interval = setInterval(function() {
      setPatchProgress(function(p) {
        if (p >= 100) { clearInterval(interval); return 100; }
        return p + randomInt(5, 15);
      });
    }, 300);
    setTimeout(function() {
      clearInterval(interval);
      setPatchProgress(100);
      setPatching(false);
      setStep(3);
    }, 3500);
  };

  var runPostScan = function() {
    setScanning(true);
    setTimeout(function() {
      setPostScan({ scanDate: new Date().toISOString(), servers: makePostScan(preScan.servers) });
      setScanning(false);
      setStep(4);
    }, 2000);
  };

  var resetAll = function() {
    setStep(1); setSelectedIds([]); setPreScan(null); setPostScan(null); setPatchProgress(0); setEnvFilter('ALL');
  };

  var handleExport = function() {
    if (!preScan) return;
    var headers = ['Instance ID', 'Name', 'OS', 'Type', 'Environment', 'Pre-Patch Kernel', 'Post-Patch Kernel', 'Updates Fixed', 'Critical Fixed', 'Status', 'Patched At'];
    var rows = (postScan ? postScan.servers : preScan.servers).map(function(s) {
      var pre = preScan.servers.find(function(p) { return p.id === s.id; });
      return [s.id, s.name, s.os, s.type, s.env, pre ? pre.kernelBefore : '-', s.kernelAfter || '-', pre ? pre.pendingUpdates : 0, pre ? pre.criticalUpdates : 0, s.status, s.patchedAt ? new Date(s.patchedAt).toLocaleString('en-IN') : '-'];
    });
    exportToCSV('Patching_' + clientName + '_' + new Date().toISOString().split('T')[0], headers, rows);
  };

  var totalPending = preScan ? preScan.servers.reduce(function(a, s) { return a + s.pendingUpdates; }, 0) : 0;
  var totalCritical = preScan ? preScan.servers.reduce(function(a, s) { return a + s.criticalUpdates; }, 0) : 0;

  var STEPS = [
    { num: 1, label: '1. Select Servers', icon: '🖥️', done: step > 1 },
    { num: 2, label: '2. Pre-Scan', icon: '🔍', done: step > 2 },
    { num: 3, label: '3. Patch', icon: '🔧', done: step > 3 },
    { num: 4, label: '4. Post-Scan & Compare', icon: '📊', done: false },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔧 EC2 Patching</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Select servers → Pre-scan → Apply patches → Post-scan → Compare · Quarterly cycle</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(preScan || postScan) && <button onClick={handleExport} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📊 Export</button>}
          <button onClick={resetAll} style={{ padding: '9px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13, cursor: 'pointer' }}>🔄 Reset</button>
        </div>
      </div>

      {/* Step indicator - clickable */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        {STEPS.map(function(s, i) {
          var isCurrent = step === s.num;
          var isDone = s.done;
          var isClickable = isDone || isCurrent;
          return (
            <button key={s.num}
              onClick={function() { if (isDone) setStep(s.num); }}
              disabled={!isClickable}
              style={{ padding: '14px 10px', textAlign: 'center', background: isCurrent ? 'rgba(59,130,246,0.12)' : isDone ? 'rgba(16,185,129,0.06)' : 'transparent', borderRight: i < 3 ? '1px solid #1a2540' : 'none', border: 'none', cursor: isDone ? 'pointer' : 'default', transition: 'background 0.2s' }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{isDone ? '✅' : s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#60a5fa' : isDone ? '#10b981' : '#4a5878' }}>{s.label}</div>
              {isDone && <div style={{ fontSize: 9, color: '#10b981', marginTop: 2 }}>Completed ✓</div>}
            </button>
          );
        })}
      </div>

      {/* STEP 1 — Server Selection */}
      {step === 1 && (
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>🖥️ Select Servers for Patching</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {['ALL','Production','Staging','Dev'].map(function(env) {
                return (
                  <button key={env} onClick={function() { setEnvFilter(env); }}
                    style={{ padding: '4px 12px', background: envFilter === env ? 'rgba(59,130,246,0.12)' : 'transparent', border: '1px solid ' + (envFilter === env ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 8, color: envFilter === env ? '#60a5fa' : '#4a5878', fontSize: 11, cursor: 'pointer' }}>
                    {env}
                  </button>
                );
              })}
              <button onClick={selectAll} style={{ padding: '4px 12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>Select All</button>
              <button onClick={clearAll} style={{ padding: '4px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#f87171', fontSize: 11, cursor: 'pointer' }}>Clear</button>
            </div>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {filtered.map(function(s) {
                var isSel = selectedIds.includes(s.id);
                return (
                  <div key={s.id} onClick={function() { toggleServer(s.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isSel ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isSel ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid ' + (isSel ? '#3b82f6' : '#2a3a58'), background: isSel ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ color: '#4a5878', fontSize: 11, marginTop: 1 }}>{s.os} · {s.ip} · {s.type}</div>
                    </div>
                    <span style={{ background: ENV_COLORS[s.env] + '18', color: ENV_COLORS[s.env], border: '1px solid ' + ENV_COLORS[s.env] + '33', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{s.env}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '14px 18px', borderTop: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#8a9bc5', fontSize: 13 }}>{selectedIds.length} of {ALL_SERVERS.length} servers selected</span>
            <button onClick={runPreScan} disabled={scanning || !selectedIds.length}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: selectedIds.length ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : '#1e2d47', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: selectedIds.length ? 'pointer' : 'not-allowed', opacity: selectedIds.length ? 1 : 0.5, transition: 'all 0.2s' }}>
              {scanning ? '🔍 Running Pre-Scan...' : '🔍 Run Pre-Patch Scan'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Pre-scan results */}
      {step === 2 && preScan && (
        <div>
          {/* Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Servers Scanned', value: preScan.servers.length, color: '#3b82f6' },
              { label: 'Pending Updates', value: totalPending, color: '#f59e0b' },
              { label: 'Critical Updates', value: totalCritical, color: '#ef4444' },
              { label: 'Scan Date', value: new Date(preScan.scanDate).toLocaleDateString('en-IN'), color: '#8b5cf6' },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ background: '#111827', border: '1px solid ' + s.color + '22', borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: s.value.toString().length > 6 ? 14 : 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ color: '#4a5878', fontSize: 11, marginTop: 3 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div style={{ background: '#111827', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>🔴 Pre-Patch Scan — {new Date(preScan.scanDate).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#0d1424' }}>{['Server','OS','Instance Type','Environment','Kernel Version','Pending','Critical','Security','Status'].map(function(h) { return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>; })}</tr></thead>
                <tbody>
                  {preScan.servers.map(function(s, i) {
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                        <td style={{ padding: '11px 14px', color: '#e2e8f0', fontWeight: 600 }}>{s.name}</td>
                        <td style={{ padding: '11px 14px', color: '#8a9bc5', fontSize: 12 }}>{s.os}</td>
                        <td style={{ padding: '11px 14px', color: '#06b6d4', fontSize: 12, fontFamily: 'monospace' }}>{s.type}</td>
                        <td style={{ padding: '11px 14px' }}><span style={{ background: ENV_COLORS[s.env] + '18', color: ENV_COLORS[s.env], borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{s.env}</span></td>
                        <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 10, color: '#4a5878' }}>{s.kernelBefore}</td>
                        <td style={{ padding: '11px 14px', color: s.pendingUpdates > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{s.pendingUpdates}</td>
                        <td style={{ padding: '11px 14px', color: s.criticalUpdates > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{s.criticalUpdates}</td>
                        <td style={{ padding: '11px 14px', color: '#f97316', fontWeight: 600 }}>{s.securityUpdates}</td>
                        <td style={{ padding: '11px 14px' }}><span className="badge badge-warning" style={{ fontSize: 9 }}>{s.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action */}
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 3 }}>⚠️ Pre-scan complete — Ready to patch</div>
              <div style={{ color: '#4a5878', fontSize: 12 }}>{totalPending} updates pending across {preScan.servers.length} servers. Apply patches then run post-scan to verify.</div>
            </div>
            <button onClick={runPatching} disabled={patching}
              style={{ padding: '11px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: patching ? 0.8 : 1 }}>
              {patching ? '🔧 Patching...' : '🔧 Apply Patches Now'}
            </button>
          </div>

          {/* Patch progress */}
          {patching && (
            <div style={{ marginTop: 12, background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: '#8a9bc5', fontSize: 13 }}>Applying patches to {preScan.servers.length} servers...</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{Math.min(patchProgress, 100)}%</span>
              </div>
              <div style={{ height: 8, background: '#1e2d47', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(patchProgress, 100) + '%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 4, transition: 'width 0.3s ease' }} />
              </div>
              <div style={{ color: '#4a5878', fontSize: 11, marginTop: 8 }}>Installing security updates · Updating kernel · Applying bug fixes...</div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Patching done, ready for post-scan */}
      {step === 3 && (
        <div>
          <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '24px', marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#34d399', marginBottom: 6 }}>Patching Complete!</div>
            <div style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>{totalPending} updates applied across {preScan ? preScan.servers.length : 0} servers. Run post-scan to verify all patches were applied successfully.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Servers Patched', value: preScan ? preScan.servers.length : 0, color: '#10b981' },
                { label: 'Updates Applied', value: totalPending, color: '#3b82f6' },
                { label: 'Critical Fixed', value: totalCritical, color: '#ef4444' },
              ].map(function(s, i) {
                return (
                  <div key={i} style={{ background: '#111827', border: '1px solid ' + s.color + '22', borderRadius: 12, padding: '14px 20px', minWidth: 120, textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ color: '#4a5878', fontSize: 12, marginTop: 3 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <button onClick={runPostScan} disabled={scanning}
              style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {scanning ? '🔍 Running Post-Scan...' : '🔍 Run Post-Patch Scan'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 — Comparison */}
      {step === 4 && postScan && preScan && (
        <div>
          {/* Header stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Servers Patched', value: postScan.servers.length + '/' + preScan.servers.length, color: '#10b981' },
              { label: 'Total Updates Fixed', value: totalPending, color: '#3b82f6' },
              { label: 'Critical CVEs Fixed', value: totalCritical, color: '#ef4444' },
              { label: 'Patch Coverage', value: '100%', color: '#10b981' },
              { label: 'Post-Scan Date', value: new Date(postScan.scanDate).toLocaleDateString('en-IN'), color: '#8b5cf6' },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ background: '#111827', border: '1px solid ' + s.color + '22', borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: typeof s.value === 'string' && s.value.includes('/') ? 18 : 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ color: '#4a5878', fontSize: 11, marginTop: 3 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Comparison table */}
          <div style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>✅ Pre vs Post Patch Comparison</span>
              <span style={{ color: '#10b981', fontSize: 12 }}>All {postScan.servers.length} servers patched successfully</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d1424' }}>
                    {['Server','OS','Environment','Pre-Kernel','Post-Kernel (Updated)','Updates Fixed','Critical Fixed','Patched At','Status'].map(function(h) {
                      return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {postScan.servers.map(function(post, i) {
                    var pre = preScan.servers.find(function(p) { return p.id === post.id; });
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                        <td style={{ padding: '11px 14px', color: '#e2e8f0', fontWeight: 600 }}>{post.name}</td>
                        <td style={{ padding: '11px 14px', color: '#8a9bc5', fontSize: 12 }}>{post.os}</td>
                        <td style={{ padding: '11px 14px' }}><span style={{ background: ENV_COLORS[post.env] + '18', color: ENV_COLORS[post.env], borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{post.env}</span></td>
                        <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 10, color: '#ef4444' }}>{pre ? pre.kernelBefore : '-'}</td>
                        <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 10, color: '#10b981' }}>{post.kernelAfter}</td>
                        <td style={{ padding: '11px 14px' }}><span style={{ color: '#10b981', fontWeight: 700 }}>✅ {pre ? pre.pendingUpdates : 0}</span></td>
                        <td style={{ padding: '11px 14px' }}><span style={{ color: '#10b981', fontWeight: 700 }}>✅ {pre ? pre.criticalUpdates : 0}</span></td>
                        <td style={{ padding: '11px 14px', color: '#4a5878', fontSize: 11 }}>{post.patchedAt ? new Date(post.patchedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td style={{ padding: '11px 14px' }}><span className="badge badge-success" style={{ fontSize: 9 }}>PATCHED</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Success message */}
          <div style={{ marginTop: 16, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <div>
              <div style={{ color: '#34d399', fontWeight: 600 }}>Patching cycle complete!</div>
              <div style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>All selected servers have been successfully patched. Export the report or start a new patching cycle.</div>
            </div>
            <button onClick={resetAll} style={{ marginLeft: 'auto', padding: '8px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
              Start New Cycle
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
