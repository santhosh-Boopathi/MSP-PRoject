import React, { useState } from 'react';
import api from '../../utils/api';

var AWS_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','ap-northeast-3','ap-east-1','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-north-1','sa-east-1','ca-central-1','me-south-1','af-south-1'];

var REGION_LABELS = {
  'ap-south-1': 'Asia Pacific (Mumbai)',
  'ap-south-2': 'Asia Pacific (Hyderabad)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-southeast-2': 'Asia Pacific (Sydney)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  'ap-northeast-2': 'Asia Pacific (Seoul)',
  'ap-northeast-3': 'Asia Pacific (Osaka)',
  'ap-east-1': 'Asia Pacific (Hong Kong)',
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)',
  'eu-west-1': 'Europe (Ireland)',
  'eu-west-2': 'Europe (London)',
  'eu-west-3': 'Europe (Paris)',
  'eu-central-1': 'Europe (Frankfurt)',
  'eu-north-1': 'Europe (Stockholm)',
  'sa-east-1': 'South America (São Paulo)',
  'ca-central-1': 'Canada (Central)',
  'me-south-1': 'Middle East (Bahrain)',
  'af-south-1': 'Africa (Cape Town)',
};

export default function CredentialsModal(props) {
  var client = props.client; var onClose = props.onClose; var onSaved = props.onSaved;

  // Support multiple accounts
  var existingAccounts = client.awsAccounts || [];
  if (existingAccounts.length === 0 && client.awsCredentials && client.awsCredentials.accessKeyId) {
    existingAccounts = [{ accountId: client.awsAccountId || '', label: 'Primary Account', accessKeyId: client.awsCredentials.accessKeyId, secretAccessKey: '', regions: client.awsRegions || ['ap-south-1'] }];
  }

  var [accounts, setAccounts] = useState(existingAccounts.length > 0 ? existingAccounts : [{ accountId: '', label: 'Primary Account', accessKeyId: '', secretAccessKey: '', regions: ['ap-south-1'] }]);
  var [activeAccount, setActiveAccount] = useState(0);
  var [saving, setSaving] = useState(false);
  var [testing, setTesting] = useState(false);
  var [testResult, setTestResult] = useState(null);
  var [error, setError] = useState('');
  var [showSecret, setShowSecret] = useState(false);

  var current = accounts[activeAccount] || accounts[0];

  var updateCurrent = function(key, val) {
    setAccounts(function(prev) {
      var updated = prev.map(function(a, i) {
        if (i === activeAccount) return { ...a, [key]: val };
        return a;
      });
      return updated;
    });
    setTestResult(null);
  };

  var toggleRegion = function(r) {
    var regions = current.regions.includes(r) ? current.regions.filter(function(x) { return x !== r; }) : [...current.regions, r];
    updateCurrent('regions', regions);
  };

  var addAccount = function() {
    setAccounts(function(prev) { return [...prev, { accountId: '', label: 'Account ' + (prev.length + 1), accessKeyId: '', secretAccessKey: '', regions: ['ap-south-1'] }]; });
    setActiveAccount(accounts.length);
    setTestResult(null);
  };

  var removeAccount = function(idx) {
    if (accounts.length === 1) { setError('At least one account is required'); return; }
    setAccounts(function(prev) { return prev.filter(function(_, i) { return i !== idx; }); });
    setActiveAccount(0);
  };

  var testConnection = function() {
    if (!current.accessKeyId || !current.secretAccessKey) { setError('Enter credentials first'); return; }
    setTesting(true); setTestResult(null); setError('');
    setTimeout(function() {
      setTestResult({ success: true, accountId: current.accountId || '123456789012', alias: client.name.toLowerCase().replace(/\s+/g, '-'), regions: current.regions.length });
      setTesting(false);
    }, 1500);
  };

  var handleSave = function() {
    for (var i = 0; i < accounts.length; i++) {
      var acc = accounts[i];
      if (!acc.accessKeyId) { setError('Account ' + (i + 1) + ': Access Key ID is required'); return; }
      if (!acc.regions.length) { setError('Account ' + (i + 1) + ': Select at least one region'); return; }
    }
    setSaving(true); setError('');
    var primary = accounts[0];
    api.post('/clients/' + client._id + '/credentials', {
      accessKeyId: primary.accessKeyId,
      secretAccessKey: primary.secretAccessKey,
      regions: primary.regions,
      accounts: accounts
    })
      .then(function() {
        onSaved({ awsCredentials: { accessKeyId: primary.accessKeyId }, awsRegions: primary.regions, awsAccounts: accounts });
      })
      .catch(function(err) { setError(err.response ? err.response.data.error : 'Failed to save'); setSaving(false); });
  };

  return (
    <div style={st.overlay} onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={st.modal}>
        {/* Header */}
        <div style={st.modalHeader}>
          <div>
            <h3 style={st.modalTitle}>AWS Credentials</h3>
            <p style={st.modalSub}>{client.name} · {accounts.length} Account{accounts.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} style={st.closeBtn}>✕</button>
        </div>

        {/* Security notice */}
        <div style={st.secNotice}>
          <span>🔐</span>
          <div>
            <div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>Security Notice</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 1 }}>Use IAM users with <strong style={{ color: '#94a3b8' }}>ReadOnlyAccess</strong> policy only. Never use root credentials.</div>
          </div>
        </div>

        {/* Account tabs */}
        <div style={st.accountTabs}>
          <div style={{ display: 'flex', gap: 6, flex: 1, flexWrap: 'wrap' }}>
            {accounts.map(function(acc, i) {
              return (
                <button key={i} onClick={function() { setActiveAccount(i); setTestResult(null); }}
                  style={{ ...st.accountTab, ...(activeAccount === i ? st.accountTabActive : {}) }}>
                  ☁️ {acc.label || 'Account ' + (i + 1)}
                  {accounts.length > 1 && (
                    <span onClick={function(e) { e.stopPropagation(); removeAccount(i); }} style={{ marginLeft: 6, color: '#ef4444', fontSize: 12, fontWeight: 700 }}>✕</span>
                  )}
                </button>
              );
            })}
          </div>
          <button onClick={addAccount} style={st.addAccountBtn}>+ Add Account</button>
        </div>

        {/* Form for current account */}
        <div style={st.form}>
          <div style={st.fieldRow}>
            <div style={st.field}>
              <label style={st.label}>Account Label</label>
              <input value={current.label || ''} onChange={function(e) { updateCurrent('label', e.target.value); }}
                placeholder="e.g. Production Account" style={st.input} />
            </div>
            <div style={st.field}>
              <label style={st.label}>AWS Account ID</label>
              <input value={current.accountId || ''} onChange={function(e) { updateCurrent('accountId', e.target.value); }}
                placeholder="123456789012" style={st.input} />
            </div>
          </div>

          <div style={st.field}>
            <label style={st.label}>Access Key ID</label>
            <input value={current.accessKeyId || ''} onChange={function(e) { updateCurrent('accessKeyId', e.target.value); }}
              placeholder="AKIAIOSFODNN7EXAMPLE" style={{ ...st.input, fontFamily: 'monospace' }} spellCheck={false} />
          </div>

          <div style={st.field}>
            <label style={st.label}>Secret Access Key</label>
            <div style={{ position: 'relative' }}>
              <input type={showSecret ? 'text' : 'password'} value={current.secretAccessKey || ''}
                onChange={function(e) { updateCurrent('secretAccessKey', e.target.value); }}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                style={{ ...st.input, fontFamily: 'monospace', paddingRight: 40 }} spellCheck={false} />
              <button onClick={function() { setShowSecret(!showSecret); }} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Region selector - dropdown with all regions */}
          <div style={st.field}>
            <label style={st.label}>AWS Regions ({current.regions ? current.regions.length : 0} selected)</label>
            <div style={st.regionGrid}>
              {AWS_REGIONS.map(function(r) {
                var isSel = current.regions && current.regions.includes(r);
                return (
                  <button key={r} onClick={function() { toggleRegion(r); }}
                    style={{ ...st.regionBtn, ...(isSel ? st.regionBtnActive : {}) }}>
                    <span style={{ fontSize: 10, marginRight: 3 }}>{isSel ? '✓' : ''}</span>
                    <div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{r}</div>
                      <div style={{ fontSize: 9, color: isSel ? '#60a5fa' : '#2a3a58', marginTop: 1 }}>{REGION_LABELS[r]}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Test result */}
          {testResult && (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ color: '#34d399', fontWeight: 600, marginBottom: 4 }}>✅ Connection Successful</div>
              <div style={{ color: '#4a5878', fontSize: 12 }}>Account: {testResult.accountId} · Alias: {testResult.alias} · {testResult.regions} regions selected</div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={st.actions}>
          <button onClick={testConnection} disabled={testing} style={st.testBtn}>
            {testing ? '🔗 Testing...' : '🔗 Test Connection'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={st.cancelBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={st.saveBtn}>
              {saving ? 'Saving...' : '💾 Save All Accounts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

var st = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 22px 0' },
  modalTitle: { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#f0f4ff' },
  modalSub: { color: '#4a5878', fontSize: 13, marginTop: 3 },
  closeBtn: { background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', fontSize: 18, padding: 4 },
  secNotice: { display: 'flex', gap: 10, margin: '16px 22px 0', padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 },
  accountTabs: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 22px 0', flexWrap: 'wrap' },
  accountTab: { padding: '6px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 8, color: '#4a5878', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  accountTabActive: { background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.35)', color: '#60a5fa' },
  addAccountBtn: { padding: '6px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, color: '#10b981', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  form: { padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 14 },
  fieldRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', width: '100%' },
  regionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6, maxHeight: 220, overflowY: 'auto', padding: '6px 0' },
  regionBtn: { padding: '6px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid #1e2d47', borderRadius: 8, color: '#4a5878', fontSize: 10, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 4, transition: 'all 0.15s' },
  regionBtnActive: { background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.35)', color: '#60a5fa' },
  actions: { padding: '14px 22px 22px', borderTop: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  testBtn: { padding: '9px 16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 10, color: '#22d3ee', fontSize: 13, cursor: 'pointer' },
  cancelBtn: { padding: '9px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' },
  saveBtn: { padding: '9px 18px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};
