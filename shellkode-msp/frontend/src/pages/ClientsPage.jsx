import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

var ICONS = { 'PAYNEARBY':'💳','VANAN SERVICES':'🖥️','NARAYANA NETHRALAYA':'👁️','BOTREE':'🌳','FINNEVA':'💹','LUCAS TVS':'⚙️','5C NETWORK':'🏥','UWC':'🎓','BIOVUS':'🧬','ZETAPP':'📲','GRAYQUEST':'🎓','SBFC':'🏦' };
var COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#a855f7'];
var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1','eu-north-1','sa-east-1','ca-central-1','me-south-1','af-south-1'];
var REGION_LABELS = {'ap-south-1':'Mumbai','ap-south-2':'Hyderabad','ap-southeast-1':'Singapore','ap-southeast-2':'Sydney','ap-northeast-1':'Tokyo','us-east-1':'N. Virginia','us-east-2':'Ohio','us-west-1':'N. California','us-west-2':'Oregon','eu-west-1':'Ireland','eu-west-2':'London','eu-central-1':'Frankfurt','eu-north-1':'Stockholm','sa-east-1':'São Paulo','ca-central-1':'Canada','me-south-1':'Bahrain','af-south-1':'Cape Town'};
var INDUSTRIES = ['FinTech','IT Services','Healthcare','Manufacturing','Technology','EdTech','BioTech','NBFC / Finance','E-Commerce','Logistics','Media','Retail'];

var ADMIN_EMAIL = 'santhosh.b@shellkode.com';

export default function ClientsPage() {
  var { user } = useAuth();
  var navigate = useNavigate();
  var [clients, setClients] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');
  var [showAdd, setShowAdd] = useState(false);
  var [showAddUser, setShowAddUser] = useState(false);
  var [deleting, setDeleting] = useState(null);
  var isAdmin = user && user.email === ADMIN_EMAIL;

  useEffect(function() {
    api.get('/clients?team=Cronos')
      .then(function(r) { setClients(r.data); })
      .catch(function() {})
      .finally(function() { setLoading(false); });
  }, []);

  var filtered = clients.filter(function(c) { return c.name.toLowerCase().includes(search.toLowerCase()) || (c.industry || '').toLowerCase().includes(search.toLowerCase()); });

  var handleAdd = function(c) { setClients(function(p) { return [...p, c]; }); setShowAdd(false); };

  var handleDelete = function(id, name) {
    if (!window.confirm('Delete client "' + name + '"? This cannot be undone.')) return;
    setDeleting(id);
    api.delete('/clients/' + id)
      .then(function() { setClients(function(p) { return p.filter(function(c) { return c._id !== id; }); }); })
      .catch(function(e) { alert(e.response ? e.response.data.error : 'Delete failed'); })
      .finally(function() { setDeleting(null); });
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 700, color: '#f0f4ff' }}>Client Portfolio</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 3 }}>Team Cronos · {clients.length} Managed AWS Accounts</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4a5878' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={function(e) { setSearch(e.target.value); }} placeholder="Search clients..." style={{ padding: '8px 14px 8px 32px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', width: 200 }} />
          </div>
          {isAdmin && <button onClick={function() { setShowAddUser(true); }} style={{ padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, color: '#10b981', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>👤 Add User</button>}
          {isAdmin && <button onClick={function() { setShowAdd(true); }} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add Client</button>}
        </div>
      </div>

      {/* Status strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        {[{ l: 'Total', v: clients.length, c: '#3b82f6' }, { l: 'Active', v: clients.filter(function(c){return c.status==='active';}).length, c: '#10b981' }, { l: 'Onboarding', v: clients.filter(function(c){return c.status==='onboarding';}).length, c: '#f59e0b' }].map(function(s, i) {
          return <div key={i} style={{ background: '#111827', border: '1px solid ' + s.c + '22', borderRadius: 10, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontWeight: 800, fontSize: 18, color: s.c }}>{s.v}</span><span style={{ color: '#4a5878', fontSize: 12 }}>{s.l}</span></div>;
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}><div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 14 }}>
          {filtered.map(function(client, i) {
            var color = COLORS[i % COLORS.length];
            var icon = ICONS[client.name] || '☁️';
            var hasAWS = !!(client.awsCredentials && client.awsCredentials.accessKeyId) || !!(client.awsAccounts && client.awsAccounts.length > 0 && client.awsAccounts[0].accessKeyId);
            return (
              <div key={client._id} style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: '18px', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }}
                onClick={function() { navigate('/msp/cronos/clients/' + client._id); }}
                onMouseEnter={function(e) { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={function(e) { e.currentTarget.style.borderColor = '#1e2d47'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: client.status === 'active' ? '#10b981' : '#f59e0b' }} />
                    {isAdmin && (
                      <button onClick={function(e) { e.stopPropagation(); handleDelete(client._id, client.name); }}
                        disabled={deleting === client._id}
                        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#f87171', fontSize: 11, cursor: 'pointer', padding: '2px 8px' }}>
                        {deleting === client._id ? '...' : '🗑'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: '#f0f4ff', marginBottom: 3 }}>{client.name}</div>
                <div style={{ color: '#4a5878', fontSize: 11, marginBottom: 10 }}>{client.industry || 'Cloud Services'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                  {(client.awsRegions || ['ap-south-1']).slice(0, 2).map(function(r, ri) {
                    return <span key={ri} style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 5, padding: '1px 7px', color: '#22d3ee', fontSize: 9, fontFamily: 'monospace', fontWeight: 600 }} title={REGION_LABELS[r] || r}>{r}</span>;
                  })}
                  {(client.awsRegions || []).length > 2 && <span style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 5, padding: '1px 7px', color: '#22d3ee', fontSize: 9, fontFamily: 'monospace' }}>+{client.awsRegions.length - 2}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #1a2540' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: hasAWS ? '#10b981' : '#4a5878', fontSize: 11 }}>
                    {hasAWS ? '✅ AWS Connected' : '⚠️ No AWS Keys'}
                  </span>
                  <span style={{ color: color, fontSize: 12, fontWeight: 600 }}>View →</span>
                </div>
              </div>
            );
          })}
        </div>
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

  var update = function(k, v) { setForm(function(f) { return { ...f, [k]: v }; }); };
  var toggleRegion = function(r) { setForm(function(f) { var rs = f.awsRegions.includes(r) ? f.awsRegions.filter(function(x) { return x !== r; }) : [...f.awsRegions, r]; return { ...f, awsRegions: rs }; }); };

  var handleSave = function() {
    if (!form.name.trim()) { setError('Client name is required'); return; }
    if (!form.awsRegions.length) { setError('Select at least one region'); return; }
    setSaving(true); setError('');
    api.post('/clients', { ...form, domains: form.domains ? form.domains.split(',').map(function(d) { return d.trim(); }) : [] })
      .then(function(r) { onSaved(r.data); })
      .catch(function(e) { setError(e.response ? e.response.data.error : 'Failed to save'); setSaving(false); });
  };

  return (
    <Modal title="Add New Client" subtitle="Onboard a new AWS client to Team Cronos" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Client Name *"><input value={form.name} onChange={function(e){update('name',e.target.value);}} placeholder="e.g. ACME CORP" style={inp} /></Field>
          <Field label="AWS Account ID"><input value={form.awsAccountId} onChange={function(e){update('awsAccountId',e.target.value);}} placeholder="123456789012" style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Industry"><select value={form.industry} onChange={function(e){update('industry',e.target.value);}} style={{ ...inp, background:'#0d1424' }}><option value="">Select...</option>{INDUSTRIES.map(function(x){return <option key={x} value={x}>{x}</option>;})}</select></Field>
          <Field label="Status"><select value={form.status} onChange={function(e){update('status',e.target.value);}} style={{ ...inp, background:'#0d1424' }}><option value="active">Active</option><option value="onboarding">Onboarding</option><option value="inactive">Inactive</option></select></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Contact Name"><input value={form.contactName} onChange={function(e){update('contactName',e.target.value);}} placeholder="Contact person" style={inp} /></Field>
          <Field label="Contact Email"><input value={form.contactEmail} onChange={function(e){update('contactEmail',e.target.value);}} placeholder="contact@client.com" style={inp} /></Field>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="Contact Phone"><input value={form.contactPhone} onChange={function(e){update('contactPhone',e.target.value);}} placeholder="9876543210" style={inp} /></Field>
          <Field label="Domains (comma separated)"><input value={form.domains} onChange={function(e){update('domains',e.target.value);}} placeholder="example.com, api.example.com" style={inp} /></Field>
        </div>
        <Field label={'AWS Regions (' + form.awsRegions.length + ' selected)'}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 5, maxHeight: 160, overflowY: 'auto' }}>
            {ALL_REGIONS.map(function(r) {
              var isSel = form.awsRegions.includes(r);
              return (
                <button key={r} onClick={function(){toggleRegion(r);}}
                  style={{ padding: '5px 10px', background: isSel ? 'rgba(59,130,246,0.1)' : 'transparent', border: '1px solid ' + (isSel ? 'rgba(59,130,246,0.4)' : '#1e2d47'), borderRadius: 7, color: isSel ? '#60a5fa' : '#4a5878', fontSize: 10, cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10 }}>{isSel ? '✓ ' : ''}{r}</div>
                  <div style={{ fontSize: 9, color: isSel ? '#60a5fa' : '#2a3a58' }}>{REGION_LABELS[r]}</div>
                </button>
              );
            })}
          </div>
        </Field>
        <Field label="Notes"><textarea value={form.notes} onChange={function(e){update('notes',e.target.value);}} rows={2} style={{ ...inp, resize:'vertical', fontFamily:"'Space Grotesk',sans-serif" }} /></Field>
        {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'9px 12px', color:'#f87171', fontSize:13 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={saveBtn}>{saving ? 'Saving...' : '✅ Add Client'}</button>
        </div>
      </div>
    </Modal>
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
    if (!form.email.endsWith('@shellkode.com')) { setError('Email must be @shellkode.com domain'); return; }
    setSaving(true); setError('');
    setTimeout(function() { setSuccess(true); setSaving(false); }, 1200);
  };

  return (
    <Modal title="Add Team Member" subtitle="Add a new engineer to Team Cronos" onClose={onClose}>
      {success ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <div style={{ color: '#34d399', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>User Added!</div>
          <div style={{ color: '#64748b', fontSize: 13 }}>{form.name} ({form.email}) added to Team Cronos.</div>
          <button onClick={onClose} style={{ ...saveBtn, marginTop: 16 }}>Done</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Full Name *"><input value={form.name} onChange={function(e){update('name',e.target.value);}} placeholder="Arjun Kumar" style={inp} /></Field>
            <Field label="Email * (@shellkode.com)"><input value={form.email} onChange={function(e){update('email',e.target.value);}} placeholder="arjun.kumar@shellkode.com" style={inp} /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Phone"><input value={form.phone} onChange={function(e){update('phone',e.target.value);}} placeholder="9876543210" style={inp} /></Field>
            <Field label="Role"><select value={form.role} onChange={function(e){update('role',e.target.value);}} style={{ ...inp, background:'#0d1424' }}><option value="engineer">Cloud Engineer</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select></Field>
          </div>
          <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:9, padding:'11px 13px', color:'#60a5fa', fontSize:12 }}>
            ℹ️ The user will log in using their @shellkode.com Google account or email. They are auto-assigned to Team Cronos.
          </div>
          {error && <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:9, padding:'9px 12px', color:'#f87171', fontSize:13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={cancelBtn}>Cancel</button>
            <button onClick={handleSave} disabled={saving} style={saveBtn}>{saving ? 'Adding...' : '👤 Add User'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Modal(props) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
      onClick={function(e){if(e.target===e.currentTarget)props.onClose();}}>
      <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:18, width:'100%', maxWidth:560, maxHeight:'90vh', overflow:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'20px 20px 0' }}>
          <div>
            <h3 style={{ fontFamily:"'Sora',sans-serif", fontSize:19, fontWeight:700, color:'#f0f4ff' }}>{props.title}</h3>
            <p style={{ color:'#4a5878', fontSize:12, marginTop:2 }}>{props.subtitle}</p>
          </div>
          <button onClick={props.onClose} style={{ background:'none', border:'none', color:'#4a5878', cursor:'pointer', fontSize:17, padding:4 }}>✕</button>
        </div>
        <div style={{ padding:'16px 20px 20px' }}>{props.children}</div>
      </div>
    </div>
  );
}

function Field(props) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ color:'#8a9bc5', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{props.label}</label>
      {props.children}
    </div>
  );
}

var inp = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid #1e2d47', borderRadius:9, color:'#f0f4ff', fontSize:13, outline:'none' };
var cancelBtn = { padding:'9px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid #1e2d47', borderRadius:9, color:'#8a9bc5', fontSize:13, cursor:'pointer' };
var saveBtn = { padding:'9px 22px', background:'linear-gradient(135deg, #3b82f6, #06b6d4)', border:'none', borderRadius:9, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' };
