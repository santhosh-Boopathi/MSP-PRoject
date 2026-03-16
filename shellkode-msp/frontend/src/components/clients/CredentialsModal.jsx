import React, { useState } from 'react';
import api from '../../utils/api';

var REGIONS = [
  { v:'ap-south-1', l:'ap-south-1 — Mumbai' },
  { v:'ap-south-2', l:'ap-south-2 — Hyderabad' },
  { v:'ap-southeast-1', l:'ap-southeast-1 — Singapore' },
  { v:'ap-southeast-2', l:'ap-southeast-2 — Sydney' },
  { v:'ap-northeast-1', l:'ap-northeast-1 — Tokyo' },
  { v:'ap-northeast-2', l:'ap-northeast-2 — Seoul' },
  { v:'us-east-1', l:'us-east-1 — N. Virginia' },
  { v:'us-east-2', l:'us-east-2 — Ohio' },
  { v:'us-west-1', l:'us-west-1 — N. California' },
  { v:'us-west-2', l:'us-west-2 — Oregon' },
  { v:'eu-west-1', l:'eu-west-1 — Ireland' },
  { v:'eu-west-2', l:'eu-west-2 — London' },
  { v:'eu-central-1', l:'eu-central-1 — Frankfurt' },
  { v:'eu-north-1', l:'eu-north-1 — Stockholm' },
  { v:'sa-east-1', l:'sa-east-1 — São Paulo' },
  { v:'ca-central-1', l:'ca-central-1 — Canada' },
  { v:'me-south-1', l:'me-south-1 — Bahrain' },
  { v:'af-south-1', l:'af-south-1 — Cape Town' },
];

export default function CredentialsModal(props) {
  var client = props.client;
  var onClose = props.onClose;
  var onSaved = props.onSaved;

  // Load existing accounts - include secret keys if they were saved
  var buildInitial = function() {
    var existing = client.awsAccounts || [];
    if (existing.length > 0) return existing.map(function(a) {
      return { accountId: a.accountId||'', label: a.label||'Primary Account', accessKeyId: a.accessKeyId||'', secretAccessKey: a.secretAccessKey||'', regions: a.regions||['ap-south-1'] };
    });
    if (client.awsCredentials && client.awsCredentials.accessKeyId) {
      return [{ accountId: client.awsAccountId||'', label: 'Primary Account', accessKeyId: client.awsCredentials.accessKeyId, secretAccessKey: client.awsCredentials.secretAccessKey||'', regions: client.awsRegions||['ap-south-1'] }];
    }
    return [{ accountId:'', label:'Primary Account', accessKeyId:'', secretAccessKey:'', regions:['ap-south-1'] }];
  };

  var [accounts, setAccounts] = useState(buildInitial());
  var [activeIdx, setActiveIdx] = useState(0);
  var [saving, setSaving] = useState(false);
  var [testing, setTesting] = useState(false);
  var [testResult, setTestResult] = useState(null);
  var [testError, setTestError] = useState('');
  var [saveError, setSaveError] = useState('');
  var [showSecret, setShowSecret] = useState(false);
  var [confirmDelete, setConfirmDelete] = useState(null);

  var cur = accounts[activeIdx] || accounts[0];

  var update = function(key, val) {
    setTestResult(null); setTestError('');
    setAccounts(function(prev) {
      return prev.map(function(a, i) { return i === activeIdx ? { ...a, [key]: val } : a; });
    });
  };

  var toggleRegion = function(r) {
    var regions = (cur.regions||[]).includes(r)
      ? (cur.regions||[]).filter(function(x) { return x !== r; })
      : [...(cur.regions||[]), r];
    update('regions', regions);
  };

  var addAccount = function() {
    var newAcc = { accountId:'', label:'Account '+(accounts.length+1), accessKeyId:'', secretAccessKey:'', regions:['ap-south-1'] };
    setAccounts(function(prev) { return [...prev, newAcc]; });
    setActiveIdx(accounts.length);
    setTestResult(null); setTestError('');
  };

  var removeAccount = function(idx) {
    if (accounts.length === 1) return;
    setAccounts(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
    setActiveIdx(0);
    setConfirmDelete(null);
  };

  // CRITICAL FIX: Test uses form input values, NOT what's in DB
  var handleTest = function() {
    if (!cur.accessKeyId.trim()) { setTestError('Enter Access Key ID first'); return; }
    if (!cur.secretAccessKey.trim()) { setTestError('Enter Secret Access Key first'); return; }
    setTesting(true); setTestResult(null); setTestError('');

    // Call /verify-live which accepts creds in body and tests them directly
    api.post('/aws/verify-live', {
      accessKeyId: cur.accessKeyId.trim(),
      secretAccessKey: cur.secretAccessKey.trim(),
      region: (cur.regions||['ap-south-1'])[0]
    }).then(function(r) {
      if (r.data.connected) {
        setTestResult(r.data);
        // Auto-fill account ID if returned
        if (r.data.accountId && !cur.accountId) update('accountId', r.data.accountId);
      } else {
        setTestError(r.data.error || 'Connection failed');
      }
    }).catch(function(err) {
      setTestError('Request failed: ' + (err.response?.data?.error || err.message));
    }).finally(function() { setTesting(false); });
  };

  var handleSave = function() {
    for (var i = 0; i < accounts.length; i++) {
      var acc = accounts[i];
      if (!acc.accessKeyId.trim()) { setSaveError('Account '+(i+1)+': Access Key ID is required'); return; }
      if (!acc.secretAccessKey.trim()) { setSaveError('Account '+(i+1)+': Secret Access Key is required. It will be stored securely.'); return; }
      if (!acc.regions || acc.regions.length === 0) { setSaveError('Account '+(i+1)+': Select at least one region'); return; }
    }
    setSaving(true); setSaveError('');
    var primary = accounts[0];
    api.post('/clients/' + client._id + '/credentials', {
      accessKeyId: primary.accessKeyId.trim(),
      secretAccessKey: primary.secretAccessKey.trim(),
      regions: primary.regions,
      accounts: accounts.map(function(a) { return { ...a, accessKeyId: a.accessKeyId.trim(), secretAccessKey: a.secretAccessKey.trim() }; })
    }).then(function(r) {
      onSaved({ awsCredentials: { accessKeyId: primary.accessKeyId.trim(), secretAccessKey: primary.secretAccessKey.trim() }, awsRegions: primary.regions, awsAccounts: accounts, awsAccountId: primary.accountId });
    }).catch(function(err) {
      setSaveError(err.response?.data?.error || 'Failed to save credentials');
      setSaving(false);
    });
  };

  return (
    <div style={st.overlay} onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={st.modal}>
        <div style={st.header}>
          <div>
            <h3 style={st.title}>🔑 AWS Credentials</h3>
            <p style={st.sub}>{client.name} · {accounts.length} Account{accounts.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={st.closeBtn}>✕</button>
        </div>

        {/* Security notice */}
        <div style={st.notice}>
          <span style={{ fontSize: 16 }}>🔐</span>
          <div>
            <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>IAM User with ReadOnlyAccess only</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>Never use root credentials. Create an IAM user with <strong style={{ color: '#94a3b8' }}>ReadOnlyAccess</strong> managed policy. Keys are stored encrypted.</div>
          </div>
        </div>

        {/* Account tabs */}
        <div style={st.tabBar}>
          <div style={{ display:'flex', gap:6, flex:1, flexWrap:'wrap' }}>
            {accounts.map(function(acc, i) {
              return (
                <button key={i} onClick={function() { setActiveIdx(i); setTestResult(null); setTestError(''); }}
                  style={{ ...st.tab, ...(activeIdx===i ? st.tabActive : {}) }}>
                  ☁️ {acc.label || 'Account '+(i+1)}
                  {acc.accessKeyId ? <span style={{ marginLeft:4, color:'#10b981', fontSize:10 }}>✓</span> : <span style={{ marginLeft:4, color:'#ef4444', fontSize:10 }}>!</span>}
                  {accounts.length > 1 && (
                    <span onClick={function(e) { e.stopPropagation(); setConfirmDelete(i); }}
                      style={{ marginLeft:6, color:'#4a5878', fontSize:12, cursor:'pointer' }}>✕</span>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={addAccount} style={st.addAccBtn}>+ Add Account</button>
        </div>

        {confirmDelete !== null && (
          <div style={{ margin:'0 20px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ color:'#f87171', fontSize:13 }}>Remove "{accounts[confirmDelete]?.label}"?</span>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={function() { setConfirmDelete(null); }} style={{ padding:'4px 12px', background:'transparent', border:'1px solid #2a3a58', borderRadius:7, color:'#8a9bc5', fontSize:12, cursor:'pointer' }}>Cancel</button>
              <button onClick={function() { removeAccount(confirmDelete); }} style={{ padding:'4px 12px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:7, color:'#f87171', fontSize:12, cursor:'pointer' }}>Remove</button>
            </div>
          </div>
        )}

        {/* Form */}
        <div style={st.form}>
          <div style={st.fieldRow}>
            <div style={st.field}>
              <label style={st.lbl}>Account Label</label>
              <input value={cur.label||''} onChange={function(e){update('label',e.target.value);}} placeholder="e.g. Production Account" style={st.inp} />
            </div>
            <div style={st.field}>
              <label style={st.lbl}>AWS Account ID (12 digits)</label>
              <input value={cur.accountId||''} onChange={function(e){update('accountId',e.target.value);}} placeholder="123456789012" style={st.inp} />
            </div>
          </div>

          <div style={st.field}>
            <label style={st.lbl}>Access Key ID *</label>
            <input value={cur.accessKeyId||''} onChange={function(e){update('accessKeyId',e.target.value);}} placeholder="AKIAIOSFODNN7EXAMPLE" style={{ ...st.inp, fontFamily:'monospace' }} autoComplete="off" spellCheck={false} />
          </div>

          <div style={st.field}>
            <label style={st.lbl}>Secret Access Key * <span style={{ color:'#4a5878', fontWeight:400, fontSize:10 }}>(stored securely, required for AWS calls)</span></label>
            <div style={{ position:'relative' }}>
              <input type={showSecret?'text':'password'} value={cur.secretAccessKey||''} onChange={function(e){update('secretAccessKey',e.target.value);}} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" style={{ ...st.inp, fontFamily:'monospace', paddingRight:42 }} autoComplete="new-password" spellCheck={false} />
              <button onClick={function(){setShowSecret(!showSecret);}} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#4a5878' }}>
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ color:'#34d399', fontWeight:700, fontSize:13, marginBottom:4 }}>✅ Connected to AWS!</div>
              <div style={{ color:'#64748b', fontSize:12 }}>Account ID: <strong style={{ color:'#e2e8f0' }}>{testResult.accountId}</strong></div>
              <div style={{ color:'#64748b', fontSize:11, marginTop:2 }}>ARN: {testResult.arn}</div>
            </div>
          )}
          {testError && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:10, padding:'10px 14px', color:'#f87171', fontSize:13 }}>
              ❌ {testError}
            </div>
          )}

          {/* Regions */}
          <div style={st.field}>
            <label style={st.lbl}>AWS Regions ({(cur.regions||[]).length} selected)</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:5, maxHeight:180, overflowY:'auto', padding:'4px 0', border:'1px solid #1e2d47', borderRadius:8, padding:8 }}>
              {REGIONS.map(function(r) {
                var sel = (cur.regions||[]).includes(r.v);
                return (
                  <button key={r.v} onClick={function(){toggleRegion(r.v);}}
                    style={{ padding:'5px 10px', background:sel?'rgba(59,130,246,0.1)':'rgba(255,255,255,0.02)', border:'1px solid '+(sel?'rgba(59,130,246,0.4)':'#1e2d47'), borderRadius:6, color:sel?'#60a5fa':'#4a5878', fontSize:11, cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ fontSize:9, width:12, color:sel?'#3b82f6':'transparent' }}>✓</span>
                    <span style={{ fontFamily:'monospace' }}>{r.l}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {saveError && (
            <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, padding:'10px 14px', color:'#f87171', fontSize:13 }}>
              {saveError}
            </div>
          )}
        </div>

        <div style={st.footer}>
          <button onClick={handleTest} disabled={testing||!cur.accessKeyId.trim()||!cur.secretAccessKey.trim()}
            style={{ ...st.testBtn, opacity:(testing||!cur.accessKeyId.trim()||!cur.secretAccessKey.trim())?0.5:1 }}>
            {testing ? '🔄 Testing...' : '🔗 Test Connection'}
          </button>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={st.cancelBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={{ ...st.saveBtn, opacity:saving?0.7:1 }}>
              {saving ? 'Saving...' : '💾 Save All Accounts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

var st = {
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
  modal: { background:'#111827', border:'1px solid #1e2d47', borderRadius:20, width:'100%', maxWidth:640, maxHeight:'92vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.7)' },
  header: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 20px 0' },
  title: { fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:'#f0f4ff' },
  sub: { color:'#4a5878', fontSize:12, marginTop:3 },
  closeBtn: { background:'none', border:'none', color:'#4a5878', cursor:'pointer', fontSize:18, padding:4 },
  notice: { display:'flex', gap:10, margin:'14px 20px 0', padding:'12px 14px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 },
  tabBar: { display:'flex', alignItems:'center', gap:8, padding:'12px 20px 0', flexWrap:'wrap' },
  tab: { padding:'5px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid #1e2d47', borderRadius:8, color:'#4a5878', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:3 },
  tabActive: { background:'rgba(59,130,246,0.12)', borderColor:'rgba(59,130,246,0.35)', color:'#60a5fa' },
  addAccBtn: { padding:'5px 12px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, color:'#10b981', fontSize:12, cursor:'pointer', whiteSpace:'nowrap' },
  form: { padding:'14px 20px', display:'flex', flexDirection:'column', gap:12 },
  fieldRow: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  field: { display:'flex', flexDirection:'column', gap:4 },
  lbl: { color:'#8a9bc5', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' },
  inp: { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid #1e2d47', borderRadius:9, color:'#f0f4ff', fontSize:13, outline:'none' },
  footer: { padding:'12px 20px 20px', borderTop:'1px solid #1a2540', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' },
  testBtn: { padding:'9px 16px', background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.25)', borderRadius:9, color:'#22d3ee', fontSize:13, cursor:'pointer' },
  cancelBtn: { padding:'9px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid #1e2d47', borderRadius:9, color:'#8a9bc5', fontSize:13, cursor:'pointer' },
  saveBtn: { padding:'9px 20px', background:'linear-gradient(135deg, #3b82f6, #06b6d4)', border:'none', borderRadius:9, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' },
};
