import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

var CLIENT_ICONS = { 'PAYNEARBY': '💳', 'VANAN SERVICES': '🖥️', 'NARAYANA NETHRALAYA': '👁️', 'BOTREE': '🌳', 'FINNEVA': '💹', 'LUCAS TVS': '⚙️', '5C NETWORK': '🏥', 'UWC': '🎓', 'BIOVUS': '🧬', 'ZETAPP': '📲', 'GRAYQUEST': '🎓', 'SBFC': '🏦' };
var CLIENT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#a855f7'];
var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1'];
var INDUSTRIES = ['FinTech','IT Services','Healthcare','Manufacturing','Technology','EdTech','BioTech','NBFC / Finance','E-Commerce','Logistics','Media','Retail'];

export default function ClientsPage() {
  var [clients, setClients] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');
  var [showAdd, setShowAdd] = useState(false);
  var navigate = useNavigate();

  useEffect(function() {
    api.get('/clients?team=Cronos')
      .then(function(r) { setClients(r.data); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }, []);

  var filtered = clients.filter(function(c) { return c.name.toLowerCase().includes(search.toLowerCase()); });

  var handleAdd = function(newClient) {
    setClients(function(prev) { return [...prev, newClient]; });
    setShowAdd(false);
  };

  return (
    <div style={st.page}>
      <div style={st.header}>
        <div>
          <h1 style={st.title}>Client Portfolio</h1>
          <p style={st.sub}>Team Cronos · {clients.length} Managed AWS Accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a5878' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search clients..." style={st.searchInput} />
          </div>
          <button onClick={function() { setShowAdd(true); }} style={st.addBtn}>
            + Add Client
          </button>
          <div style={st.countBadge}>{filtered.length} clients</div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: 300 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <div style={st.grid}>
          {filtered.map(function(client, i) {
            var color = CLIENT_COLORS[i % CLIENT_COLORS.length];
            var icon = CLIENT_ICONS[client.name] || '☁️';
            return (
              <div key={client._id} style={st.card} onClick={function() { navigate('/msp/cronos/clients/' + client._id); }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#1e2d47'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ ...st.colorBar, background: color }} />
                <div style={st.cardHeader}>
                  <div style={{ ...st.clientIcon, background: color + '18' }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                  </div>
                  <div style={{ ...st.statusDot, background: client.status === 'active' ? '#10b981' : '#f59e0b' }} />
                </div>
                <h3 style={st.clientName}>{client.name}</h3>
                <p style={st.clientIndustry}>{client.industry || 'Cloud Services'}</p>
                <div style={st.regionWrap}>
                  {(client.awsRegions || ['ap-south-1']).slice(0, 2).map(function(r, ri) {
                    return <span key={ri} style={st.regionTag}>{r}</span>;
                  })}
                  {(client.awsRegions || []).length > 2 && <span style={st.regionTag}>+{client.awsRegions.length - 2}</span>}
                </div>
                <div style={st.cardMeta}>
                  <span style={st.metaItem}>
                    Last audit: {client.lastAuditDate ? new Date(client.lastAuditDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'None'}
                  </span>
                  <span style={{ ...st.metaItem, color: color }}>View →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && <AddClientModal onClose={function() { setShowAdd(false); }} onSaved={handleAdd} />}
    </div>
  );
}

function AddClientModal(props) {
  var onClose = props.onClose; var onSaved = props.onSaved;
  var [form, setForm] = useState({ name: '', industry: '', contactName: '', contactEmail: '', contactPhone: '', awsRegions: ['ap-south-1'], domains: '', notes: '', awsAccountId: '' });
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');

  var update = function(key, val) { setForm(function(f) { return { ...f, [key]: val }; }); };

  var toggleRegion = function(r) {
    setForm(function(f) {
      var regions = f.awsRegions.includes(r) ? f.awsRegions.filter(function(x) { return x !== r; }) : [...f.awsRegions, r];
      return { ...f, awsRegions: regions };
    });
  };

  var handleSave = function() {
    if (!form.name.trim()) { setError('Client name is required'); return; }
    if (!form.awsRegions.length) { setError('Select at least one AWS region'); return; }
    setSaving(true); setError('');
    api.post('/clients', { ...form, domains: form.domains ? form.domains.split(',').map(function(d) { return d.trim(); }) : [] })
      .then(function(r) { onSaved(r.data); })
      .catch(function(err) { setError(err.response ? err.response.data.error : 'Failed to save'); setSaving(false); });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 0' }}>
          <div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>Add New Client</h3>
            <p style={{ color: '#4a5878', fontSize: 13, marginTop: 3 }}>Onboard a new AWS client to Team Cronos</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Client Name *', key: 'name', placeholder: 'e.g. ACME CORP', type: 'text' },
            { label: 'AWS Account ID', key: 'awsAccountId', placeholder: '123456789012', type: 'text' },
            { label: 'Contact Name', key: 'contactName', placeholder: 'Primary contact person', type: 'text' },
            { label: 'Contact Email', key: 'contactEmail', placeholder: 'contact@client.com', type: 'email' },
            { label: 'Contact Phone', key: 'contactPhone', placeholder: '9876543210', type: 'text' },
            { label: 'Domains (comma separated)', key: 'domains', placeholder: 'example.com, api.example.com', type: 'text' },
          ].map(function(f) {
            return (
              <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={function(e) { update(f.key, e.target.value); }}
                  placeholder={f.placeholder}
                  style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' }} />
              </div>
            );
          })}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Industry</label>
            <select value={form.industry} onChange={function(e) { update('industry', e.target.value); }}
              style={{ padding: '10px 14px', background: '#0d1424', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' }}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map(function(ind) { return <option key={ind} value={ind}>{ind}</option>; })}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AWS Regions * ({form.awsRegions.length} selected)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_REGIONS.map(function(r) {
                var isSelected = form.awsRegions.includes(r);
                return (
                  <button key={r} onClick={function() { toggleRegion(r); }}
                    style={{ padding: '5px 12px', background: isSelected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (isSelected ? 'rgba(59,130,246,0.4)' : '#1e2d47'), borderRadius: 8, color: isSelected ? '#60a5fa' : '#4a5878', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace', transition: 'all 0.15s' }}>
                    {isSelected && '✓ '}{r}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notes</label>
            <textarea value={form.notes} onChange={function(e) { update('notes', e.target.value); }}
              placeholder="Any additional information about this client..."
              rows={3}
              style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: "'Space Grotesk', sans-serif" }} />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #1a2540', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '✅ Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

var st = {
  page: { animation: 'fadeIn 0.4s ease', maxWidth: 1400 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 700, color: '#f0f4ff' },
  sub: { color: '#64748b', fontSize: 14, marginTop: 4 },
  searchInput: { padding: '9px 14px 9px 36px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', width: 220 },
  addBtn: { padding: '9px 18px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  countBadge: { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 14px', color: '#60a5fa', fontSize: 13, fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' },
  colorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  clientIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 9, height: 9, borderRadius: '50%' },
  clientName: { fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 },
  clientIndustry: { color: '#4a5878', fontSize: 12, marginBottom: 12 },
  regionWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  regionTag: { background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 6, padding: '2px 8px', color: '#22d3ee', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #1a2540' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 4, color: '#4a5878', fontSize: 11 },
};
