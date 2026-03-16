import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

function daysUntil(date) { return Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)); }

function StatusBar(props) {
  var days = props.days;
  var pct = Math.min(100, Math.max(0, (days / 365) * 100));
  var color = days < 14 ? '#ef4444' : days < 30 ? '#f59e0b' : days < 60 ? '#f97316' : '#10b981';
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4a5878', marginBottom: 3 }}>
        <span>{days < 0 ? '⚠️ EXPIRED' : days + ' days left'}</span>
        <span>{new Date(props.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>
      <div style={{ height: 5, background: '#1e2d47', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: Math.max(2, pct) + '%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

var TYPE_ICONS = { ssl: '🔒', domain: '🌐', csp: '📜', ri_ec2: '💻', ri_rds: '🗄️', savings_plan: '💰', custom: '📌' };
var TYPE_LABELS = { ssl: 'SSL Certificate', domain: 'Domain Name', csp: 'CSP / Certificate', ri_ec2: 'EC2 Reserved Instance', ri_rds: 'RDS Reserved Instance', savings_plan: 'Savings Plan', custom: 'Custom' };

export default function SSLPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var domains = props.domains || []; var onAddCredentials = props.onAddCredentials;

  var [manualEntries, setManualEntries] = useState([]);
  var [awsEntries, setAwsEntries] = useState([]);
  var [loadingManual, setLoadingManual] = useState(true);
  var [loadingAWS, setLoadingAWS] = useState(false);
  var [showAdd, setShowAdd] = useState(false);
  var [form, setForm] = useState({ type: 'ssl', name: '', expiryDate: '', notes: '', alertEmails: '', alertDays: '30', autoRenew: false });
  var [saving, setSaving] = useState(false);
  var [filter, setFilter] = useState('ALL');

  useEffect(function() {
    api.get('/clients/' + clientId + '/ssl-entries')
      .then(function(r) { setManualEntries(r.data); })
      .catch(function() {})
      .finally(function() { setLoadingManual(false); });
  }, [clientId]);

  var fetchAWSData = function() {
    setLoadingAWS(true);
    api.get('/aws/ssl-aws/' + clientId)
      .then(function(r) {
        if (r.data.hasData) setAwsEntries(r.data.entries || []);
        else setAwsEntries([]);
      })
      .catch(function() { setAwsEntries([]); })
      .finally(function() { setLoadingAWS(false); });
  };

  var addEntry = function() {
    if (!form.name.trim() || !form.expiryDate) return;
    setSaving(true);
    var payload = { ...form, source: 'manual', alertDays: [parseInt(form.alertDays || '30')], alertEmails: form.alertEmails ? form.alertEmails.split(',').map(function(e) { return e.trim(); }) : [], clientName: clientName };
    api.post('/clients/' + clientId + '/ssl-entries', payload)
      .then(function(r) { setManualEntries(function(p) { return [...p, r.data]; }); setShowAdd(false); setForm({ type: 'ssl', name: '', expiryDate: '', notes: '', alertEmails: '', alertDays: '30', autoRenew: false }); })
      .catch(function() {})
      .finally(function() { setSaving(false); });
  };

  var deleteEntry = function(id) {
    api.delete('/clients/' + clientId + '/ssl-entries/' + id)
      .then(function() { setManualEntries(function(p) { return p.filter(function(e) { return e._id !== id; }); }); });
  };

  var allEntries = [
    ...manualEntries.map(function(e) { return { ...e, days: daysUntil(e.expiryDate), source: 'manual' }; }),
    ...awsEntries.map(function(e) { return { ...e, days: daysUntil(e.expiryDate), source: 'aws' }; }),
  ].sort(function(a, b) { return a.days - b.days; });

  var filtered = filter === 'ALL' ? allEntries : allEntries.filter(function(e) { return filter === 'critical' ? e.days < 30 : e.type === filter; });

  var critical = allEntries.filter(function(e) { return e.days < 14; }).length;
  var warning = allEntries.filter(function(e) { return e.days >= 14 && e.days < 30; }).length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔒 SSL, Domain & Expiry Monitor</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Track SSL certs, domain names, Reserved Instances & Savings Plans — manual or from AWS</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={fetchAWSData} disabled={loadingAWS}
            style={{ padding: '8px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: '#60a5fa', fontSize: 13, cursor: 'pointer', opacity: loadingAWS ? 0.7 : 1 }}>
            {loadingAWS ? '🔄 Loading...' : '🔄 Sync from AWS'}
          </button>
          <button onClick={function() { setShowAdd(!showAdd); }}
            style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + Add Manually
          </button>
        </div>
      </div>

      {/* Summary */}
      {allEntries.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[{ l: 'Total Entries', v: allEntries.length, c: '#3b82f6' }, { l: 'Critical (<14d)', v: critical, c: '#ef4444' }, { l: 'Warning (<30d)', v: warning, c: '#f59e0b' }, { l: 'Healthy', v: allEntries.length - critical - warning, c: '#10b981' }].map(function(s, i) {
            return <div key={i} style={{ background: '#111827', border: '1px solid ' + s.c + '22', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 800, fontSize: 20, color: s.c }}>{s.v}</span><span style={{ color: '#4a5878', fontSize: 12 }}>{s.l}</span></div>;
          })}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div style={{ background: '#111827', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 14, padding: 20, marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Add Expiry Entry (Manual)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Type</label>
                <select value={form.type} onChange={function(e) { setForm(function(f) { return { ...f, type: e.target.value }; }); }} style={{ ...inp, background: '#0d1424' }}>
                  {Object.entries(TYPE_LABELS).map(function(entry) { return <option key={entry[0]} value={entry[0]}>{TYPE_ICONS[entry[0]]} {entry[1]}</option>; })}
                </select>
              </div>
              <div>
                <label style={lbl}>Name / Domain *</label>
                <input value={form.name} onChange={function(e) { setForm(function(f) { return { ...f, name: e.target.value }; }); }} placeholder="e.g. api.paynearby.in" style={inp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Expiry Date *</label>
                <input type="date" value={form.expiryDate} onChange={function(e) { setForm(function(f) { return { ...f, expiryDate: e.target.value }; }); }} style={inp} />
              </div>
              <div>
                <label style={lbl}>Alert Email(s) (comma separated)</label>
                <input value={form.alertEmails} onChange={function(e) { setForm(function(f) { return { ...f, alertEmails: e.target.value }; }); }} placeholder="ops@shellkode.com" style={inp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Alert Threshold: <strong style={{ color: '#60a5fa' }}>{form.alertDays} days before expiry</strong></label>
                <input type="range" min={7} max={90} value={form.alertDays} onChange={function(e) { setForm(function(f) { return { ...f, alertDays: e.target.value }; }); }} style={{ width: '100%', accentColor: '#3b82f6' }} />
              </div>
              <div>
                <label style={lbl}>Notes</label>
                <input value={form.notes} onChange={function(e) { setForm(function(f) { return { ...f, notes: e.target.value }; }); }} placeholder="Optional notes" style={inp} />
              </div>
            </div>
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 9, padding: '10px 13px', color: '#8a9bc5', fontSize: 12 }}>
              ℹ️ For items outside AWS (external SSL certs, GoDaddy domains, etc.) — add them manually here and configure alert emails to receive expiry reminders.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={function() { setShowAdd(false); }} style={cancelBtn}>Cancel</button>
              <button onClick={addEntry} disabled={saving || !form.name.trim() || !form.expiryDate} style={saveBtn}>{saving ? 'Saving...' : '💾 Add Entry'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['ALL', 'critical', 'ssl', 'domain', 'ri_ec2', 'ri_rds', 'savings_plan'].map(function(f) {
          return (
            <button key={f} onClick={function() { setFilter(f); }}
              style={{ padding: '4px 12px', background: filter === f ? 'rgba(59,130,246,0.12)' : 'transparent', border: '1px solid ' + (filter === f ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 8, color: filter === f ? '#60a5fa' : '#4a5878', fontSize: 12, cursor: 'pointer' }}>
              {f === 'ALL' ? 'All' : f === 'critical' ? '🚨 Critical (<30d)' : (TYPE_ICONS[f] || '') + ' ' + (TYPE_LABELS[f] || f)}
            </button>
          );
        })}
      </div>

      {/* Domains from client config note */}
      {domains.length > 0 && awsEntries.length === 0 && (
        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '11px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>🌐</span>
          <div style={{ fontSize: 12, color: '#8a9bc5' }}>
            Client domains configured: <strong style={{ color: '#60a5fa' }}>{domains.join(', ')}</strong> — Add them manually above or click "Sync from AWS" to fetch RI/Savings Plan data
          </div>
        </div>
      )}

      {/* Entries list */}
      {loadingManual ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 50, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ color: '#8a9bc5', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No entries found</div>
          <div style={{ color: '#4a5878', fontSize: 12, marginBottom: 16 }}>Add SSL certs, domains, and reserved instances to track expiry</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={function() { setShowAdd(true); }} style={saveBtn}>+ Add Manually</button>
            <button onClick={fetchAWSData} style={{ ...saveBtn, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' }}>🔄 Sync from AWS</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(function(entry, i) {
            var days = entry.days;
            var urgentColor = days < 14 ? '#ef4444' : days < 30 ? '#f59e0b' : days < 60 ? '#f97316' : '#10b981';
            return (
              <div key={entry._id || i} style={{ background: '#111827', border: '1px solid ' + urgentColor + (days < 30 ? '44' : '22'), borderRadius: 14, padding: 16, position: 'relative' }}>
                {entry.source === 'aws' && <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 600 }}>AWS</span>}
                {entry.source === 'manual' && <span style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: 6, padding: '2px 7px', fontSize: 9, fontWeight: 600 }}>MANUAL</span>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{TYPE_ICONS[entry.type] || '📌'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                    <div style={{ color: '#4a5878', fontSize: 10 }}>{TYPE_LABELS[entry.type] || entry.type}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ background: urgentColor + '18', color: urgentColor, border: '1px solid ' + urgentColor + '33', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                    {days < 0 ? '⚠️ EXPIRED' : days < 14 ? '🚨 ' + days + ' days' : days + ' days left'}
                  </span>
                </div>
                <StatusBar days={days} expiryDate={entry.expiryDate} />
                {entry.notes && <div style={{ color: '#4a5878', fontSize: 11, marginTop: 8 }}>{entry.notes}</div>}
                {entry.source === 'manual' && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1a2540', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={function() { deleteEntry(entry._id); }} style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#f87171', fontSize: 11, cursor: 'pointer', padding: '3px 10px' }}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

var lbl = { display: 'block', color: '#8a9bc5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 };
var inp = { width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 9, color: '#f0f4ff', fontSize: 13, outline: 'none' };
var cancelBtn = { padding: '9px 18px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 9, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' };
var saveBtn = { padding: '9px 22px', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', border: 'none', borderRadius: 9, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
