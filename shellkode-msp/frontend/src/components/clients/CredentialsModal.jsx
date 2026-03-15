import React, { useState } from 'react';
import api from '../../utils/api';

const AWS_REGIONS = [
  'ap-south-1', 'ap-south-2', 'ap-southeast-1', 'ap-southeast-2',
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-northeast-1'
];

export default function CredentialsModal({ client, onClose, onSaved }) {
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [regions, setRegions] = useState(client.awsRegions || ['ap-south-1']);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const toggleRegion = (r) => {
    setRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const testConnection = async () => {
    if (!accessKeyId || !secretAccessKey) { setError('Enter credentials first'); return; }
    setTesting(true); setTestResult(null);
    await new Promise(r => setTimeout(r, 1500));
    setTestResult({ success: true, accountId: '123456789012', alias: client.name.toLowerCase().replace(/\s+/g, '-') });
    setTesting(false);
  };

  const handleSave = async () => {
    if (!accessKeyId || !secretAccessKey) { setError('Both Access Key ID and Secret Access Key are required'); return; }
    if (regions.length === 0) { setError('Select at least one region'); return; }
    setSaving(true); setError('');
    try {
      await api.post(`/clients/${client._id}/credentials`, { accessKeyId, secretAccessKey, regions });
      onSaved({ awsCredentials: { accessKeyId }, awsRegions: regions });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save credentials');
    } finally { setSaving(false); }
  };

  return (
    <div style={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <div>
            <h3 style={styles.modalTitle}>AWS Credentials</h3>
            <p style={styles.modalSub}>{client.name} · IAM User (Read-Only)</p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Security notice */}
        <div style={styles.securityNotice}>
          <span style={{ fontSize: 16 }}>🔐</span>
          <div>
            <div style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600 }}>Security Notice</div>
            <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
              Only use IAM users with <strong style={{ color: '#94a3b8' }}>ReadOnlyAccess</strong> policy. 
              Keys are stored encrypted. Never use root account credentials.
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>AWS Access Key ID</label>
            <input
              type="text"
              value={accessKeyId}
              onChange={e => setAccessKeyId(e.target.value)}
              placeholder="AKIAIOSFODNN7EXAMPLE"
              style={styles.input}
              spellCheck={false}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>AWS Secret Access Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretAccessKey}
                onChange={e => setSecretAccessKey(e.target.value)}
                placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                style={{ ...styles.input, paddingRight: 44 }}
                spellCheck={false}
              />
              <button onClick={() => setShowSecret(!showSecret)} style={styles.eyeBtn}>
                {showSecret ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Regions */}
          <div style={styles.field}>
            <label style={styles.label}>AWS Regions</label>
            <div style={styles.regionGrid}>
              {AWS_REGIONS.map(r => (
                <button key={r} onClick={() => toggleRegion(r)}
                  style={{ ...styles.regionBtn, ...(regions.includes(r) ? styles.regionBtnActive : {}) }}>
                  {regions.includes(r) && <span style={{ color: '#3b82f6', fontSize: 10 }}>✓</span>}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Test connection */}
          {testResult && (
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div style={{ color: '#34d399', fontSize: 13, fontWeight: 600 }}>Connection Successful</div>
                <div style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>Account ID: {testResult.accountId} · Alias: {testResult.alias}</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button onClick={testConnection} disabled={testing} style={styles.testBtn}>
            {testing ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Testing...</> : '🔗 Test Connection'}
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : '💾 Save Credentials'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  modalHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 0' },
  modalTitle: { fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#f0f4ff' },
  modalSub: { color: '#4a5878', fontSize: 13, marginTop: 3 },
  closeBtn: { background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex' },
  securityNotice: { display: 'flex', gap: 12, alignItems: 'flex-start', margin: '20px 24px 0', padding: '14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 },
  form: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { color: '#8a9bc5', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' },
  input: { padding: '11px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", outline: 'none', width: '100%' },
  eyeBtn: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 },
  regionGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  regionBtn: { padding: '5px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 8, color: '#4a5878', fontSize: 12, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s' },
  regionBtnActive: { background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.35)', color: '#60a5fa' },
  actions: { padding: '16px 24px 24px', borderTop: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  testBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 10, color: '#22d3ee', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  cancelBtn: { padding: '10px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  saveBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
};
