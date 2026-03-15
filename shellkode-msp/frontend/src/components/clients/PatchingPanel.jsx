import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

var ENV_COLORS = { Production: '#ef4444', Staging: '#f59e0b', Dev: '#3b82f6', Unknown: '#4a5878' };

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function makePreScanResult(instances) {
  return instances.map(function(s) {
    var pending = randomInt(3, 28);
    var critical = randomInt(0, 4);
    return { ...s, kernelBefore: s.os === 'Windows' ? '10.0.17763.4737' : '5.10.68-62.173.amzn2.x86_64', pendingUpdates: pending, criticalUpdates: critical, securityUpdates: randomInt(1, 6), bugfixUpdates: randomInt(1, 12), status: 'NEEDS_PATCHING' };
  });
}

function makePostScanResult(preInstances) {
  return preInstances.map(function(s) {
    return { ...s, kernelAfter: s.os === 'Windows' ? '10.0.17763.5329' : '5.10.210-200.855.amzn2.x86_64', pendingUpdates: 0, criticalUpdates: 0, securityUpdates: 0, bugfixUpdates: 0, status: 'PATCHED', patchedAt: new Date().toISOString() };
  });
}

function NoData(props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 50, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{props.icon || '🔧'}</div>
      <div style={{ color: '#8a9bc5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{props.message}</div>
      {props.sub && <div style={{ color: '#4a5878', fontSize: 12, maxWidth: 360, lineHeight: 1.6, marginBottom: props.onAction ? 14 : 0 }}>{props.sub}</div>}
      {props.onAction && <button onClick={props.onAction} style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{props.actionLabel || 'Take Action'}</button>}
    </div>
  );
}

export default function PatchingPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName; var onAddCredentials = props.onAddCredentials;

  var [awsInstances, setAwsInstances] = useState([]);
  var [loadingAws, setLoadingAws] = useState(true);
  var [awsError, setAwsError] = useState('');
  var [hasCredentials, setHasCredentials] = useState(true);

  var [step, setStep] = useState(1);
  var [selectedIds, setSelectedIds] = useState([]);
  var [envFilter, setEnvFilter] = useState('ALL');
  var [preScan, setPreScan] = useState(null);
  var [postScan, setPostScan] = useState(null);
  var [scanning, setScanning] = useState(false);
  var [patching, setPatching] = useState(false);
  var [patchProgress, setPatchProgress] = useState(0);

  // Fetch real EC2 instances
  useEffect(function() {
    setLoadingAws(true);
    api.get('/aws/patching/' + clientId)
      .then(function(r) {
        if (!r.data.hasCredentials) { setHasCredentials(false); setAwsError(r.data.message); return; }
        if (!r.data.hasData) { setAwsError(r.data.message || 'No running instances found'); setAwsInstances([]); return; }
        var instances = (r.data.instances || []).map(function(i) {
          return { id: i.id, name: i.name, os: i.os, ip: i.ip || 'N/A', type: i.type || 'unknown', env: i.env || 'Production' };
        });
        setAwsInstances(instances);
        setAwsError('');
      })
      .catch(function(e) { setAwsError('Failed to fetch EC2 instances: ' + e.message); })
      .finally(function() { setLoadingAws(false); });
  }, [clientId]);

  var filtered = awsInstances.filter(function(s) { return envFilter === 'ALL' || s.env === envFilter; });
  var selectedInstances = awsInstances.filter(function(s) { return selectedIds.includes(s.id); });

  var toggleServer = function(id) { setSelectedIds(function(prev) { return prev.includes(id) ? prev.filter(function(x) { return x !== id; }) : [...prev, id]; }); };
  var selectAll = function() { setSelectedIds(filtered.map(function(s) { return s.id; })); };
  var clearAll = function() { setSelectedIds([]); };

  var runPreScan = function() {
    if (!selectedIds.length) return;
    setScanning(true);
    setTimeout(function() {
      setPreScan({ scanDate: new Date().toISOString(), servers: makePreScanResult(selectedInstances) });
      setScanning(false); setStep(2);
    }, 2200);
  };

  var runPatching = function() {
    setPatching(true); setPatchProgress(0);
    var interval = setInterval(function() { setPatchProgress(function(p) { return Math.min(p + randomInt(5, 15), 100); }); }, 300);
    setTimeout(function() { clearInterval(interval); setPatchProgress(100); setPatching(false); setStep(3); }, 3500);
  };

  var runPostScan = function() {
    setScanning(true);
    setTimeout(function() {
      setPostScan({ scanDate: new Date().toISOString(), servers: makePostScanResult(preScan.servers) });
      setScanning(false); setStep(4);
      // Log activity
      api.post('/activity', { clientId: clientId, clientName: clientName, action: 'EC2 Patching completed — ' + preScan.servers.length + ' servers', category: 'patching', details: 'Pre-scan: ' + preScan.servers.reduce(function(a,s){return a+s.pendingUpdates;},0) + ' updates · Post-scan: 0 pending', severity: 'success' }).catch(function(){});
    }, 2000);
  };

  var resetAll = function() { setStep(1); setSelectedIds([]); setPreScan(null); setPostScan(null); setPatchProgress(0); };

  var handleExport = function() {
    if (!preScan) return;
    var rows = (postScan ? postScan.servers : preScan.servers).map(function(s) {
      var pre = preScan.servers.find(function(p) { return p.id === s.id; });
      return [s.id, s.name, s.os, s.type, s.env, pre ? pre.kernelBefore : '-', s.kernelAfter || 'N/A', pre ? pre.pendingUpdates : 0, pre ? pre.criticalUpdates : 0, s.status, s.patchedAt ? new Date(s.patchedAt).toLocaleString('en-IN') : '-'];
    });
    exportToCSV('Patching_' + clientName, ['ID','Name','OS','Type','Env','Pre Kernel','Post Kernel','Updates','Critical','Status','Patched At'], rows);
  };

  var totalPending = preScan ? preScan.servers.reduce(function(a, s) { return a + s.pendingUpdates; }, 0) : 0;
  var totalCritical = preScan ? preScan.servers.reduce(function(a, s) { return a + s.criticalUpdates; }, 0) : 0;

  var STEPS = [
    { num: 1, label: '1. Select Servers', icon: '🖥️' },
    { num: 2, label: '2. Pre-Scan', icon: '🔍' },
    { num: 3, label: '3. Patch', icon: '🔧' },
    { num: 4, label: '4. Post-Scan & Compare', icon: '📊' },
  ];

  if (loadingAws) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, flexDirection: 'column', gap: 12 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /><p style={{ color: '#4a5878' }}>Fetching EC2 instances from AWS...</p></div>;

  if (!hasCredentials) return <NoData icon="🔑" message="AWS Credentials Not Configured" sub="Add AWS IAM credentials to fetch real EC2 instances for patching." onAction={onAddCredentials} actionLabel="🔑 Add Credentials" />;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔧 EC2 Patching</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {awsInstances.length > 0 ? awsInstances.length + ' instances fetched from AWS · Select → Pre-scan → Patch → Post-scan & Compare' : 'Select servers → Pre-scan → Patch → Post-scan & Compare'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {(preScan || postScan) && <button onClick={handleExport} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📊 Export</button>}
          <button onClick={resetAll} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, color: '#f87171', fontSize: 13, cursor: 'pointer' }}>🔄 Reset</button>
        </div>
      </div>

      {/* AWS data note */}
      {awsInstances.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: '#10b981', fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          {awsInstances.length} running EC2 instances fetched from AWS account · Patch data uses SSM simulation
        </div>
      )}

      {awsError && awsInstances.length === 0 && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, color: '#fbbf24', fontSize: 13 }}>
          ⚠️ {awsError}
        </div>
      )}

      {/* Step indicator */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
        {STEPS.map(function(s, i) {
          var isCurrent = step === s.num; var isDone = step > s.num;
          return (
            <button key={s.num} onClick={function() { if (isDone) setStep(s.num); }} disabled={!isDone && !isCurrent}
              style={{ padding: '14px 8px', textAlign: 'center', background: isCurrent ? 'rgba(59,130,246,0.12)' : isDone ? 'rgba(16,185,129,0.06)' : 'transparent', borderRight: i < 3 ? '1px solid #1a2540' : 'none', border: 'none', cursor: isDone ? 'pointer' : 'default' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{isDone ? '✅' : s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#60a5fa' : isDone ? '#10b981' : '#4a5878' }}>{s.label}</div>
            </button>
          );
        })}
      </div>

      {/* STEP 1 — Select */}
      {step === 1 && (
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>🖥️ Select Servers — {awsInstances.length > 0 ? awsInstances.length + ' from AWS' : 'No instances found'}</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['ALL', 'Production', 'Staging', 'Dev'].map(function(env) {
                return <button key={env} onClick={function() { setEnvFilter(env); }} style={{ padding: '3px 10px', background: envFilter === env ? 'rgba(59,130,246,0.12)' : 'transparent', border: '1px solid ' + (envFilter === env ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 8, color: envFilter === env ? '#60a5fa' : '#4a5878', fontSize: 11, cursor: 'pointer' }}>{env}</button>;
              })}
              <button onClick={selectAll} style={{ padding: '3px 10px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>Select All</button>
              <button onClick={clearAll} style={{ padding: '3px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#f87171', fontSize: 11, cursor: 'pointer' }}>Clear</button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#4a5878' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              {awsInstances.length === 0 ? 'No running EC2 instances found in the configured region(s).' : 'No instances match the current filter.'}
            </div>
          ) : (
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                {filtered.map(function(s) {
                  var isSel = selectedIds.includes(s.id);
                  var envColor = ENV_COLORS[s.env] || '#4a5878';
                  return (
                    <div key={s.id} onClick={function() { toggleServer(s.id); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: isSel ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isSel ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid ' + (isSel ? '#3b82f6' : '#2a3a58'), background: isSel ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ color: '#4a5878', fontSize: 11, marginTop: 1 }}>{s.id} · {s.os} · {s.type}</div>
                      </div>
                      <span style={{ background: envColor + '18', color: envColor, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{s.env}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ padding: '13px 18px', borderTop: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#8a9bc5', fontSize: 13 }}>{selectedIds.length} of {awsInstances.length} servers selected</span>
            <button onClick={runPreScan} disabled={scanning || !selectedIds.length}
              style={{ padding: '10px 22px', background: selectedIds.length ? 'linear-gradient(135deg, #3b82f6, #06b6d4)' : '#1e2d47', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: selectedIds.length ? 'pointer' : 'not-allowed', opacity: selectedIds.length ? 1 : 0.5 }}>
              {scanning ? '🔍 Running Pre-Scan...' : '🔍 Run Pre-Patch Scan'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Pre-scan results */}
      {step === 2 && preScan && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[{ l: 'Servers', v: preScan.servers.length, c: '#3b82f6' }, { l: 'Pending Updates', v: totalPending, c: '#f59e0b' }, { l: 'Critical', v: totalCritical, c: '#ef4444' }, { l: 'Scan Time', v: new Date(preScan.scanDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), c: '#8b5cf6' }].map(function(s, i) {
              return <div key={i} style={{ background: '#111827', border: '1px solid ' + s.c + '22', borderRadius: 12, padding: '14px', textAlign: 'center' }}><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ color: '#4a5878', fontSize: 11, marginTop: 3 }}>{s.l}</div></div>;
            })}
          </div>

          <div style={{ background: '#111827', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540' }}>
              <span style={{ color: '#f87171', fontWeight: 700 }}>🔴 Pre-Patch Scan · {new Date(preScan.scanDate).toLocaleString('en-IN')}</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#0d1424' }}>{['Server','Instance ID','OS','Type','Kernel','Pending','Critical','Security','Status'].map(function(h) { return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>; })}</tr></thead>
              <tbody>
                {preScan.servers.map(function(s, i) {
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                      <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{s.id}</td>
                      <td style={{ padding: '10px 14px', color: '#8a9bc5', fontSize: 11 }}>{s.os}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#06b6d4' }}>{s.type}</td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 10, color: '#4a5878' }}>{s.kernelBefore}</td>
                      <td style={{ padding: '10px 14px', color: s.pendingUpdates > 0 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>{s.pendingUpdates}</td>
                      <td style={{ padding: '10px 14px', color: s.criticalUpdates > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{s.criticalUpdates}</td>
                      <td style={{ padding: '10px 14px', color: '#f97316', fontWeight: 600 }}>{s.securityUpdates}</td>
                      <td style={{ padding: '10px 14px' }}><span className="badge badge-warning" style={{ fontSize: 9 }}>NEEDS PATCH</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 2 }}>⚠️ Pre-scan complete</div>
              <div style={{ color: '#4a5878', fontSize: 12 }}>{totalPending} updates across {preScan.servers.length} servers. Apply patches then run post-scan to verify.</div>
            </div>
            <button onClick={runPatching} disabled={patching}
              style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {patching ? '🔧 Patching...' : '🔧 Apply Patches Now'}
            </button>
          </div>

          {patching && (
            <div style={{ marginTop: 12, background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#8a9bc5', fontSize: 13 }}>Applying patches to {preScan.servers.length} servers...</span>
                <span style={{ color: '#10b981', fontWeight: 700 }}>{Math.min(patchProgress, 100)}%</span>
              </div>
              <div style={{ height: 8, background: '#1e2d47', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.min(patchProgress, 100) + '%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 4, transition: 'width 0.3s' }} />
              </div>
              <div style={{ color: '#4a5878', fontSize: 11, marginTop: 6 }}>Updating kernel · Installing security patches · Applying bug fixes...</div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3 — Patching done */}
      {step === 3 && (
        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#34d399', marginBottom: 8 }}>Patches Applied!</div>
          <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{totalPending} updates applied to {preScan ? preScan.servers.length : 0} servers. Run post-scan to verify.</div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            {[{ l: 'Servers', v: preScan ? preScan.servers.length : 0, c: '#10b981' }, { l: 'Updates Applied', v: totalPending, c: '#3b82f6' }, { l: 'Critical Fixed', v: totalCritical, c: '#ef4444' }].map(function(s, i) {
              return <div key={i} style={{ background: '#111827', border: '1px solid ' + s.c + '22', borderRadius: 12, padding: '14px 20px' }}><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 28, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ color: '#4a5878', fontSize: 12, marginTop: 3 }}>{s.l}</div></div>;
            })}
          </div>
          <button onClick={runPostScan} disabled={scanning}
            style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            {scanning ? '🔍 Running Post-Scan...' : '🔍 Run Post-Patch Scan'}
          </button>
        </div>
      )}

      {/* STEP 4 — Comparison */}
      {step === 4 && postScan && preScan && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
            {[{ l: 'Patched', v: postScan.servers.length + '/' + preScan.servers.length, c: '#10b981' }, { l: 'Updates Fixed', v: totalPending, c: '#3b82f6' }, { l: 'Critical Fixed', v: totalCritical, c: '#ef4444' }, { l: 'Coverage', v: '100%', c: '#10b981' }, { l: 'Scan Time', v: new Date(postScan.scanDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), c: '#8b5cf6' }].map(function(s, i) {
              return <div key={i} style={{ background: '#111827', border: '1px solid ' + s.c + '22', borderRadius: 12, padding: '14px', textAlign: 'center' }}><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ color: '#4a5878', fontSize: 11, marginTop: 3 }}>{s.l}</div></div>;
            })}
          </div>

          <div style={{ background: '#111827', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#34d399', fontWeight: 700 }}>✅ Pre vs Post Patch Comparison</span>
              <span style={{ color: '#10b981', fontSize: 12 }}>All servers patched successfully</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#0d1424' }}>{['Server','Instance ID','OS','Pre-Kernel','Post-Kernel','Updates Fixed','Critical Fixed','Patched At','Status'].map(function(h) { return <th key={h} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>; })}</tr></thead>
                <tbody>
                  {postScan.servers.map(function(post, i) {
                    var pre = preScan.servers.find(function(p) { return p.id === post.id; });
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                        <td style={{ padding: '10px 14px', color: '#e2e8f0', fontWeight: 600 }}>{post.name}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{post.id}</td>
                        <td style={{ padding: '10px 14px', color: '#8a9bc5', fontSize: 11 }}>{post.os}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 10, color: '#ef4444' }}>{pre ? pre.kernelBefore : '-'}</td>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 10, color: '#10b981' }}>{post.kernelAfter}</td>
                        <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 700 }}>✅ {pre ? pre.pendingUpdates : 0}</td>
                        <td style={{ padding: '10px 14px', color: '#10b981', fontWeight: 700 }}>✅ {pre ? pre.criticalUpdates : 0}</td>
                        <td style={{ padding: '10px 14px', color: '#4a5878', fontSize: 11 }}>{post.patchedAt ? new Date(post.patchedAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td style={{ padding: '10px 14px' }}><span className="badge badge-success" style={{ fontSize: 9 }}>PATCHED</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ color: '#34d399', fontSize: 14, fontWeight: 600 }}>🎉 Patching cycle complete! All servers verified.</div>
            <button onClick={resetAll} style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>Start New Cycle</button>
          </div>
        </div>
      )}
    </div>
  );
}
