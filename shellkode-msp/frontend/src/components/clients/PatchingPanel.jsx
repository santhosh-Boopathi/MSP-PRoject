import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToHTML, exportToCSV } from '../../utils/exportUtils';

var ALL_SERVERS = [
  { id: 'i-0abc1234', name: 'prod-app-01', os: 'Amazon Linux 2', ip: '10.0.1.10', env: 'Production' },
  { id: 'i-0abc1235', name: 'prod-app-02', os: 'Ubuntu 22.04', ip: '10.0.2.10', env: 'Production' },
  { id: 'i-0abc1236', name: 'prod-app-03', os: 'Amazon Linux 2', ip: '10.0.1.11', env: 'Production' },
  { id: 'i-0abc1237', name: 'bastion-host', os: 'Amazon Linux 2', ip: '10.0.0.5', env: 'Production' },
  { id: 'i-0abc1238', name: 'staging-app-01', os: 'Ubuntu 20.04', ip: '10.1.1.10', env: 'Staging' },
  { id: 'i-0abc1239', name: 'staging-app-02', os: 'Ubuntu 20.04', ip: '10.1.1.11', env: 'Staging' },
  { id: 'i-0abc1240', name: 'dev-server-01', os: 'Amazon Linux 2023', ip: '10.2.1.10', env: 'Dev' },
];

function makeScanResult(servers, isPost) {
  return servers.map(function(s) {
    var pending = isPost ? 0 : Math.floor(Math.random() * 25) + 3;
    var critical = isPost ? 0 : Math.floor(Math.random() * 4);
    return {
      id: s.id, name: s.name, os: s.os, ip: s.ip, env: s.env,
      kernelVersion: isPost ? '5.10.210-200.855.amzn2.x86_64' : '5.10.68-62.173.amzn2.x86_64',
      pendingUpdates: pending, criticalUpdates: critical,
      status: isPost ? 'PATCHED' : 'PENDING_PATCH',
      patchedAt: isPost ? new Date().toISOString() : null,
    };
  });
}

export default function PatchingPanel({ clientId, clientName }) {
  var [step, setStep] = useState('select');
  var [selectedServers, setSelectedServers] = useState([]);
  var [preScan, setPreScan] = useState(null);
  var [postScan, setPostScan] = useState(null);
  var [scanning, setScanning] = useState(false);
  var [scanType, setScanType] = useState('');

  var toggleServer = function(id) {
    setSelectedServers(function(prev) {
      return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : [...prev, id];
    });
  };

  var selectAll = function() {
    setSelectedServers(ALL_SERVERS.map(function(s) { return s.id; }));
  };

  var clearAll = function() { setSelectedServers([]); };

  var runPreScan = function() {
    if (!selectedServers.length) { alert('Select at least one server'); return; }
    setScanning(true); setScanType('pre');
    var servers = ALL_SERVERS.filter(function(s) { return selectedServers.includes(s.id); });
    setTimeout(function() {
      setPreScan({ scanDate: new Date().toISOString(), servers: makeScanResult(servers, false) });
      setScanning(false);
      setStep('pre-done');
    }, 2000);
  };

  var runPostScan = function() {
    setScanning(true); setScanType('post');
    var servers = ALL_SERVERS.filter(function(s) { return selectedServers.includes(s.id); });
    setTimeout(function() {
      setPostScan({ scanDate: new Date().toISOString(), servers: makeScanResult(servers, true) });
      setScanning(false);
      setStep('comparison');
    }, 2000);
  };

  var handleExport = function() {
    if (!preScan || !postScan) return;
    var preRows = preScan.servers.map(function(s) { return [s.id, s.name, s.os, s.kernelVersion, s.pendingUpdates, s.criticalUpdates, 'PRE-PATCH']; });
    var postRows = postScan.servers.map(function(s) { return [s.id, s.name, s.os, s.kernelVersion, s.pendingUpdates, s.criticalUpdates, 'PATCHED']; });
    exportToCSV('Patching_' + clientName,
      ['Instance ID','Name','OS','Kernel Version','Pending Updates','Critical Updates','Status'],
      [...preRows, ...postRows]
    );
  };

  var totalPending = preScan ? preScan.servers.reduce(function(a, s) { return a + s.pendingUpdates; }, 0) : 0;
  var totalCritical = preScan ? preScan.servers.reduce(function(a, s) { return a + s.criticalUpdates; }, 0) : 0;
  var patchedCount = postScan ? postScan.servers.filter(function(s) { return s.status === 'PATCHED'; }).length : 0;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔧 EC2 Patching</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Select servers → Pre-scan → Patch → Post-scan → Comparison · Quarterly cycle</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {postScan && <button onClick={handleExport} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📊 Export</button>}
          {step !== 'select' && <button onClick={function() { setStep('select'); setPreScan(null); setPostScan(null); setSelectedServers([]); }} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>🔄 Reset</button>}
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, overflow: 'hidden' }}>
        {[
          { id: 'select', label: '1. Select Servers', icon: '🖥️' },
          { id: 'pre-done', label: '2. Pre-Scan', icon: '🔍' },
          { id: 'patch', label: '3. Patch', icon: '🔧' },
          { id: 'comparison', label: '4. Post-Scan & Compare', icon: '📊' },
        ].map(function(s, i) {
          var steps = ['select','pre-done','patch','comparison'];
          var currentIdx = steps.indexOf(step);
          var stepIdx = steps.indexOf(s.id);
          var isDone = stepIdx < currentIdx;
          var isCurrent = stepIdx === currentIdx;
          return (
            <div key={s.id} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', background: isCurrent ? 'rgba(59,130,246,0.12)' : isDone ? 'rgba(16,185,129,0.08)' : 'transparent', borderRight: i < 3 ? '1px solid #1a2540' : 'none' }}>
              <div style={{ fontSize: 18 }}>{isDone ? '✅' : s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#60a5fa' : isDone ? '#10b981' : '#4a5878', marginTop: 4 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Step 1 — Select Servers */}
      {(step === 'select' || step === 'pre-done') && (
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#8a9bc5', fontWeight: 600, fontSize: 14 }}>Select Servers for Patching</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={selectAll} style={{ padding: '5px 12px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>Select All</button>
              <button onClick={clearAll} style={{ padding: '5px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Clear</button>
            </div>
          </div>
          <div style={{ padding: '16px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {ALL_SERVERS.map(function(s) {
                var isSelected = selectedServers.includes(s.id);
                return (
                  <div key={s.id} onClick={function() { toggleServer(s.id); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isSelected ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid ' + (isSelected ? '#3b82f6' : '#2a3a58'), background: isSelected ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ color: '#4a5878', fontSize: 11, marginTop: 1 }}>{s.os} · {s.ip}</div>
                    </div>
                    <span style={{ background: s.env === 'Production' ? 'rgba(239,68,68,0.1)' : s.env === 'Staging' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)', color: s.env === 'Production' ? '#f87171' : s.env === 'Staging' ? '#fbbf24' : '#60a5fa', border: '1px solid transparent', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{s.env}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ padding: '14px 18px', borderTop: '1px solid #1a2540', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#4a5878', fontSize: 13 }}>{selectedServers.length} of {ALL_SERVERS.length} servers selected</span>
            <button onClick={runPreScan} disabled={scanning || !selectedServers.length}
              style={{ marginLeft: 'auto', padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: selectedServers.length ? 'pointer' : 'not-allowed', opacity: selectedServers.length ? 1 : 0.5 }}>
              {scanning && scanType === 'pre' ? '🔍 Running Pre-Scan...' : '🔍 Run Pre-Patch Scan'}
            </button>
          </div>
        </div>
      )}

      {/* Pre-scan results */}
      {preScan && (
        <div style={{ background: '#111827', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, marginBottom: 20 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>🔴 Pre-Patch Scan Results — {new Date(preScan.scanDate).toLocaleString('en-IN')}</span>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ color: '#f59e0b', fontSize: 13 }}><strong>{totalPending}</strong> pending updates</span>
              <span style={{ color: '#ef4444', fontSize: 13 }}><strong>{totalCritical}</strong> critical</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#0d1424' }}>{['Server','OS','Kernel Version','Pending','Critical','Status'].map(function(h) { return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>; })}</tr></thead>
            <tbody>{preScan.servers.map(function(s, i) {
              return (
                <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                  <td style={{ padding: '11px 14px', color: '#e2e8f0', fontWeight: 600 }}>{s.name}</td>
                  <td style={{ padding: '11px 14px', color: '#8a9bc5', fontSize: 12 }}>{s.os}</td>
                  <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{s.kernelVersion}</td>
                  <td style={{ padding: '11px 14px', color: s.pendingUpdates > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{s.pendingUpdates}</td>
                  <td style={{ padding: '11px 14px', color: s.criticalUpdates > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{s.criticalUpdates}</td>
                  <td style={{ padding: '11px 14px' }}><span className="badge badge-warning" style={{ fontSize: 10 }}>{s.status}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
          {step === 'pre-done' && (
            <div style={{ padding: '14px 18px', borderTop: '1px solid #1a2540', background: 'rgba(245,158,11,0.04)' }}>
              <div style={{ color: '#fbbf24', fontSize: 13, marginBottom: 10 }}>⚠️ Pre-scan complete. Apply patches to the servers above, then run Post-Patch Scan to verify.</div>
              <button onClick={runPostScan} disabled={scanning}
                style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {scanning && scanType === 'post' ? '🔍 Running Post-Scan...' : '✅ Run Post-Patch Scan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Comparison */}
      {postScan && preScan && step === 'comparison' && (
        <div style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>✅ Patch Comparison — Pre vs Post</span>
            <span style={{ color: '#10b981', fontSize: 13 }}>{patchedCount}/{postScan.servers.length} servers patched successfully</span>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              { label: 'Servers Patched', value: patchedCount, color: '#10b981' },
              { label: 'Updates Applied', value: totalPending, color: '#3b82f6' },
              { label: 'Critical Fixed', value: totalCritical, color: '#ef4444' },
              { label: 'Patch Coverage', value: Math.round((patchedCount / postScan.servers.length) * 100) + '%', color: '#10b981' },
            ].map(function(s, i) {
              return (
                <div key={i} style={{ padding: '16px', textAlign: 'center', borderRight: i < 3 ? '1px solid #1a2540' : 'none' }}>
                  <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ color: '#4a5878', fontSize: 11, marginTop: 4 }}>{s.label}</div>
                </div>
              );
            })}
          </div>

          <div style={{ overflowX: 'auto', borderTop: '1px solid #1a2540' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1424' }}>
                  {['Server','OS','Pre-Patch Kernel','Post-Patch Kernel','Updates Fixed','Critical Fixed','Status'].map(function(h) {
                    return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>;
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
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 10, color: '#ef4444' }}>{pre ? pre.kernelVersion : '-'}</td>
                      <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: 10, color: '#10b981' }}>{post.kernelVersion}</td>
                      <td style={{ padding: '11px 14px', color: '#10b981', fontWeight: 700 }}>✅ {pre ? pre.pendingUpdates : 0} fixed</td>
                      <td style={{ padding: '11px 14px', color: '#10b981', fontWeight: 700 }}>✅ {pre ? pre.criticalUpdates : 0} fixed</td>
                      <td style={{ padding: '11px 14px' }}><span className="badge badge-success" style={{ fontSize: 10 }}>PATCHED</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
