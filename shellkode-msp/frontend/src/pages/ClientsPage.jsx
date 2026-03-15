import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

var CLIENT_ICONS = { 'PAYNEARBY': '💳', 'VANAN SERVICES': '🖥️', 'NARAYANA NETHRALAYA': '👁️', 'BOTREE': '🌳', 'FINNEVA': '💹', 'LUCAS TVS': '⚙️', '5C NETWORK': '🏥', 'UWC': '🎓', 'BIOVUS': '🧬', 'ZETAPP': '📲', 'GRAYQUEST': '🎓', 'SBFC': '🏦' };
var CLIENT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#a855f7'];
var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1','eu-north-1','sa-east-1','ca-central-1','me-south-1','af-south-1'];
var REGION_LABELS = { 'ap-south-1':'Mumbai','ap-south-2':'Hyderabad','ap-southeast-1':'Singapore','ap-southeast-2':'Sydney','ap-northeast-1':'Tokyo','ap-northeast-2':'Seoul','us-east-1':'N. Virginia','us-east-2':'Ohio','us-west-1':'N. California','us-west-2':'Oregon','eu-west-1':'Ireland','eu-west-2':'London','eu-central-1':'Frankfurt','eu-north-1':'Stockholm','sa-east-1':'São Paulo','ca-central-1':'Canada','me-south-1':'Bahrain','af-south-1':'Cape Town' };
var INDUSTRIES = ['FinTech','IT Services','Healthcare','Manufacturing','Technology','EdTech','BioTech','NBFC / Finance','E-Commerce','Logistics','Media','Retail'];

export default function ClientsPage() {
  var [clients, setClients] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');
  var [showAdd, setShowAdd] = useState(false);
  var [showAddUser, setShowAddUser] = useState(false);
  var [statusFilter, setStatusFilter] = useState('ALL');
  var navigate = useNavigate();

  useEffect(function() {
    api.get('/clients?team=Cronos')
      .then(function(r) { setClients(r.data); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }, []);

  var filtered = clients.filter(function(c) {
    var matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.industry || '').toLowerCase().includes(search.toLowerCase());
    var matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  var handleAdd = function(newClient) { setClients(function(prev) { return [...prev, newClient]; }); setShowAdd(false); };

  return (
    <div style={st.page}>
      {/* Header */}
      <div style={st.header}>
        <div>
          <h1 style={st.title}>Client Portfolio</h1>
          <p style={st.sub}>Team Cronos · {clients.length} Managed AWS Accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a5878' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search clients..." style={st.searchInput} />
          </div>
          {['ALL','active','inactive','onboarding'].map(function(s) {
            return (
              <button key={s} onClick={function() { setStatusFilter(s); }}
                style={{ padding: '7px 12px', background: statusFilter === s ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (statusFilter === s ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 8, color: statusFilter === s ? '#60a5fa' : '#4a5878', fontSize: 12, cursor: 'pointer' }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
          <button onClick={function() { setShowAddUser(true); }} style={st.addUserBtn}>👤 Add User</button>
          <button onClick={function() { setShowAdd(true); }} style={st.addBtn}>+ Add Client</button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Clients', value: clients.length, color: '#3b82f6' },
          { label: 'Active', value: clients.filter(function(c) { return c.status === 'active'; }).length, color: '#10b981' },
          { label: 'Onboarding', value: clients.filter(function(c) { return c.status === 'onboarding'; }).length, color: '#f59e0b' },
          { label: 'Inactive', value: clients.filter(function(c) { return c.status === 'inactive'; }).length, color: '#4a5878' },
        ].map(function(s, i) {
          return (
            <div key={i} style={{ background: '#111827', border: '1px solid ' + s.color + '22', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</span>
              <span style={{ color: '#4a5878', fontSize: 12 }}>{s.label}</span>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, height: 300 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        </div>
      ) : (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#4a5878' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>No clients found</div>
              <div style={{ fontSize: 13 }}>Try a different search term or filter</div>
            </div>
          )}
          <div style={st.grid}>
            {filtered.map(function(client, i) {
              var color = CLIENT_COLORS[i % CLIENT_COLORS.length];
              var icon = CLIENT_ICONS[client.name] || '☁️';
              var statusColor = client.status === 'active' ? '#10b981' : client.status === 'onboarding' ? '#f59e0b' : '#4a5878';
              return (
                <div key={client._id} style={st.card} onClick={function() { navigate('/msp/cronos/clients/' + client._id); }}
                  onMouseEnter={function(e) { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#1e2d47'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ ...st.colorBar, background: color }} />
                  <div style={st.cardHeader}>
                    <div style={{ ...st.clientIcon, background: color + '18' }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor }} />
                      <span style={{ color: statusColor, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{client.status || 'active'}</span>
                    </div>
                  </div>
                  <h3 style={st.clientName}>{client.name}</h3>
                  <p style={st.clientIndustry}>{client.industry || 'Cloud Services'}</p>
                  <div style={st.regionWrap}>
                    {(client.awsRegions || ['ap-south-1']).slice(0, 2).map(function(r, ri) {
                      return <span key={ri} style={st.regionTag} title={REGION_LABELS[r] || r}>{r}</span>;
                    })}
                    {(client.awsRegions || []).length > 2 && <span style={st.regionTag}>+{client.awsRegions.length - 2} more</span>}
                  </div>
                  <div style={st.cardMeta}>
                    <span style={st.metaItem}>
                      {client.contactEmail ? '📧 ' + client.contactEmail.split('@')[0] : '📅 ' + (client.onboardedDate ? new Date(client.onboardedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent')}
                    </span>
                    <span style={{ color: color, fontSize: 12, fontWeight: 600 }}>View →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {showAdd && <AddClientModal onClose={function() { setShowAdd(false); }} onSaved={handleAdd} />}
      {showAddUser && <AddUserModal onClose={function() { setShowAddUser(false); }} />}
    </div>
  );
}

function AddClientModal(props) {
  var onClose = props.onClose; var onSaved = props.onSaved;
  var [form, setForm] = useState({ name: '', industry: '', contactName: '', contactEmail: '', contactPhone: '', awsRegions: ['ap-south-1'], domains: '', notes: '', awsAccountId: '', status: 'active' });
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');

  var update = function(key, val) { setForm(function(f) { return { ...f, [key]: val }; }); };
  var toggleRegion = function(r) { setForm(function(f) { var rgs = f.awsRegions.includes(r) ? f.awsRegions.filter(function(x) { return x !== r; }) : [...f.awsRegions, r]; return { ...f, awsRegions: rgs }; }); };

  var handleSave = function() {
    if (!form.name.trim()) { setError('Client name is required'); return; }
    if (!form.awsRegions.length) { setError('Select at least one AWS region'); return; }
    setSaving(true); setError('');
    api.post('/clients', { ...form, domains: form.domains ? form.domains.split(',').map(function(d) { return d.trim(); }) : [] })
      .then(function(r) { onSaved(r.data); })
      .catch(function(err) { setError(err.response ? err.response.data.error : 'Failed to save'); setSaving(false); });
  };

  return (
    <ModalWrapper title="Add New Client" subtitle="Onboard a new AWS client to Team Cronos" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Client Name *"><input type="text" value={form.name} onChange={function(e) { update('name', e.target.value); }} placeholder="e.g. ACME CORP" style={inputStyle} /></FormField>
          <FormField label="AWS Account ID"><input type="text" value={form.awsAccountId} onChange={function(e) { update('awsAccountId', e.target.value); }} placeholder="123456789012" style={inputStyle} /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Industry">
            <select value={form.industry} onChange={function(e) { update('industry', e.target.value); }} style={selectStyle}>
              <option value="">Select...</option>
              {INDUSTRIES.map(function(ind) { return <option key={ind} value={ind}>{ind}</option>; })}
            </select>
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={function(e) { update('status', e.target.value); }} style={selectStyle}>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Contact Name"><input type="text" value={form.contactName} onChange={function(e) { update('contactName', e.target.value); }} placeholder="Primary contact" style={inputStyle} /></FormField>
          <FormField label="Contact Email"><input type="email" value={form.contactEmail} onChange={function(e) { update('contactEmail', e.target.value); }} placeholder="contact@client.com" style={inputStyle} /></FormField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField label="Contact Phone"><input type="text" value={form.contactPhone} onChange={function(e) { update('contactPhone', e.target.value); }} placeholder="9876543210" style={inputStyle} /></FormField>
          <FormField label="Domains (comma separated)"><input type="text" value={form.domains} onChange={function(e) { update('domains', e.target.value); }} placeholder="example.com, api.example.com" style={inputStyle} /></FormField>
        </div>

        <FormField label={'AWS Regions (' + form.awsRegions.length + ' selected)'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 5, maxHeight: 180, overflowY: 'auto', padding: '4px 0' }}>
            {ALL_REGIONS.map(function(r) {
              var isSel = form.awsRegions.includes(r);
              return (
                <button key={r} onClick={function() { toggleRegion(r); }}
                  style={{ padding: '5px 10px', background: isSel ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isSel ? 'rgba(59,130,246,0.4)' : '#1e2d47'), borderRadius: 7, color: isSel ? '#60a5fa' : '#4a5878', fontSize: 11, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 10, width: 12 }}>{isSel ? '✓' : ''}</span>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10 }}>{r}</div>
                    <div style={{ fontSize: 9, color: isSel ? '#60a5fa' : '#2a3a58' }}>{REGION_LABELS[r]}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label="Notes">
          <textarea value={form.notes} onChange={function(e) { update('notes', e.target.value); }} placeholder="Any additional notes..." rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: "'Space Grotesk', sans-serif" }} />
        </FormField>

        {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{error}</div>}
      </div>
      <div style={{ padding: '14px 0 0', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>{saving ? 'Saving...' : '✅ Add Client'}</button>
      </div>
    </ModalWrapper>
  );
}

function AddUserModal(props) {
  var onClose = props.onClose;
  var [form, setForm] = useState({ name: '', email: '', phone: '', role: 'engineer' });
  var [saving, setSaving] = useState(false);
  var [success, setSuccess] = useState(false);
  var [error, setError] = useState('');

  var update = function(k, v) { setForm(function(f) { return { ...f, [k]: v }; }); };

  var handleSave = function() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.email.endsWith('@shellkode.com')) { setError('Email must be @shellkode.com'); return; }
    setSaving(true); setError('');
    // In production: call /api/auth/invite or /api/team/add
    setTimeout(function() {
      setSuccess(true); setSaving(false);
    }, 1200);
  };

  return (
    <ModalWrapper title="Add Team Member" subtitle="Add a new engineer to Team Cronos" onClose={onClose}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#34d399', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>User Added Successfully!</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>{form.name} ({form.email}) has been added to Team Cronos.</div>
          <div style={{ color: '#4a5878', fontSize: 12, marginTop: 8 }}>They can now log in with their @shellkode.com email.</div>
          <button onClick={onClose} style={{ ...saveBtnStyle, marginTop: 20 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Full Name *"><input type="text" value={form.name} onChange={function(e) { update('name', e.target.value); }} placeholder="e.g. Arjun Kumar" style={inputStyle} /></FormField>
            <FormField label="Email * (@shellkode.com)"><input type="email" value={form.email} onChange={function(e) { update('email', e.target.value); }} placeholder="arjun.kumar@shellkode.com" style={inputStyle} /></FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <FormField label="Phone Number"><input type="text" value={form.phone} onChange={function(e) { update('phone', e.target.value); }} placeholder="9876543210" style={inputStyle} /></FormField>
            <FormField label="Role">
              <select value={form.role} onChange={function(e) { update('role', e.target.value); }} style={selectStyle}>
                <option value="engineer">Cloud Engineer</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </FormField>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ color: '#60a5fa', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>ℹ️ Access Information</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>The user will be able to log in using their @shellkode.com Google account or email address. They will be assigned to Team Cronos automatically.</div>
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>{saving ? 'Adding...' : '👤 Add User'}</button>
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}

function ModalWrapper(props) {
  var title = props.title; var subtitle = props.subtitle; var onClose = props.onClose; var children = props.children;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 20, width: '100%', maxWidth: 600, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 22px 0' }}>
          <div>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>{title}</h3>
            <p style={{ color: '#4a5878', fontSize: 13, marginTop: 3 }}>{subtitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', fontSize: 18, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px 22px' }}>{children}</div>
      </div>
    </div>
  );
}

function FormField(props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ color: '#8a9bc5', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{props.label}</label>
      {props.children}
    </div>
  );
}

var inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' };
var selectStyle = { ...inputStyle, background: '#0d1424', cursor: 'pointer' };
var cancelBtnStyle = { padding: '10px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' };
var saveBtnStyle = { padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' };

var st = {
  page: { animation: 'fadeIn 0.4s ease', maxWidth: 1400 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: '#f0f4ff' },
  sub: { color: '#64748b', fontSize: 13, marginTop: 3 },
  searchInput: { padding: '8px 14px 8px 36px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', width: 200 },
  addUserBtn: { padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  addBtn: { padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 },
  card: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: '18px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' },
  colorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  clientIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  clientName: { fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 3 },
  clientIndustry: { color: '#4a5878', fontSize: 11, marginBottom: 10 },
  regionWrap: { display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  regionTag: { background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 5, padding: '1px 7px', color: '#22d3ee', fontSize: 9, fontFamily: 'monospace', fontWeight: 600 },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1a2540' },
  metaItem: { color: '#4a5878', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 },
};
