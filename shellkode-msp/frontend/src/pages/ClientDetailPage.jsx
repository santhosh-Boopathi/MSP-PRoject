import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import SecurityPanel from '../components/clients/SecurityPanel';
import CostPanel from '../components/clients/CostPanel';
import InventoryPanel from '../components/clients/InventoryPanel';
import PatchingPanel from '../components/clients/PatchingPanel';
import SSLPanel from '../components/clients/SSLPanel';
import OptimizerPanel from '../components/clients/OptimizerPanel';
import FreshdeskPanel from '../components/clients/FreshdeskPanel';
import MonthlyReportPanel from '../components/clients/MonthlyReportPanel';
import CredentialsModal from '../components/clients/CredentialsModal';

var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1','eu-north-1','sa-east-1','ca-central-1','me-south-1','af-south-1'];
var REGION_LABELS = {'ap-south-1':'Mumbai','ap-south-2':'Hyderabad','ap-southeast-1':'Singapore','ap-southeast-2':'Sydney','ap-northeast-1':'Tokyo','ap-northeast-2':'Seoul','us-east-1':'N. Virginia','us-east-2':'Ohio','us-west-1':'N. California','us-west-2':'Oregon','eu-west-1':'Ireland','eu-west-2':'London','eu-central-1':'Frankfurt','eu-north-1':'Stockholm','sa-east-1':'São Paulo','ca-central-1':'Canada','me-south-1':'Bahrain','af-south-1':'Cape Town'};

var ADMIN_EMAIL = 'santhosh.b@shellkode.com';

var NAV = [
  { id:'overview', label:'Overview', icon:'📊' },
  { id:'security', label:'Security Audit', icon:'🛡️' },
  { id:'cost', label:'Cost Optimization', icon:'💰' },
  { id:'inventory', label:'Inventory', icon:'📦' },
  { id:'optimizer', label:'Compute Optimizer', icon:'⚡' },
  { id:'patching', label:'EC2 Patching', icon:'🔧' },
  { id:'ssl', label:'SSL & Expiry', icon:'🔒' },
  { id:'freshdesk', label:'FreshDesk Tickets', icon:'🎫' },
  { id:'reports', label:'Monthly Reports', icon:'📄' },
  { id:'notes', label:'Notes', icon:'📝' },
  { id:'alerts', label:'Alert Config', icon:'🔔' },
];

export default function ClientDetailPage() {
  var { clientId, section } = useParams();
  var navigate = useNavigate();
  var { user } = useAuth();
  var isAdmin = user && user.email === ADMIN_EMAIL;

  var [client, setClient] = useState(null);
  var [loading, setLoading] = useState(true);
  var [activeSection, setActiveSection] = useState(section || 'overview');
  var [showCredentials, setShowCredentials] = useState(false);
  var [showRegionEdit, setShowRegionEdit] = useState(false);
  var [tempRegions, setTempRegions] = useState([]);
  var [savingRegions, setSavingRegions] = useState(false);

  useEffect(function() {
    api.get('/clients/' + clientId)
      .then(function(r) { setClient(r.data); setTempRegions(r.data.awsRegions || ['ap-south-1']); })
      .catch(function() { navigate('/msp/cronos/clients'); })
      .finally(function() { setLoading(false); });
  }, [clientId]);

  useEffect(function() { if (section) setActiveSection(section); }, [section]);

  var goSection = function(s) {
    setActiveSection(s);
    navigate('/msp/cronos/clients/' + clientId + '/' + s, { replace: true });
  };

  var saveRegions = function() {
    if (!tempRegions.length) return;
    setSavingRegions(true);
    api.put('/clients/' + clientId, { awsRegions: tempRegions })
      .then(function() { setClient(function(c) { return { ...c, awsRegions: tempRegions }; }); setShowRegionEdit(false); })
      .catch(function() {})
      .finally(function() { setSavingRegions(false); });
  };

  var onCredentialsSaved = function(updated) {
    setClient(function(c) { return { ...c, ...updated }; });
    setShowCredentials(false);
  };

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:400 }}><div className="spinner" style={{ width:36, height:36, borderWidth:3 }}/></div>;
  if (!client) return null;

  var hasAWS = !!(client.awsCredentials && client.awsCredentials.accessKeyId) || !!(client.awsAccounts && client.awsAccounts.length > 0 && client.awsAccounts[0].accessKeyId);
  var accountCount = client.awsAccounts && client.awsAccounts.length > 0 ? client.awsAccounts.length : (hasAWS ? 1 : 0);

  return (
    <div style={{ display:'flex', gap:0, height:'calc(100vh - 82px)', margin:'-16px -20px', animation:'fadeIn 0.3s ease' }}>
      {/* Left sidebar */}
      <div style={{ width:244, background:'#090e1c', borderRight:'1px solid #1a2540', display:'flex', flexDirection:'column', flexShrink:0, overflow:'hidden' }}>
        {/* Client header */}
        <div style={{ padding:'14px 13px 10px', borderBottom:'1px solid #1a2540' }}>
          <button onClick={function(){navigate('/msp/cronos/clients');}} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'none', color:'#4a5878', fontSize:11, cursor:'pointer', marginBottom:10, padding:0 }}>← Back</button>

          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg, #3b82f6, #06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'white', flexShrink:0 }}>
              {client.name.slice(0,2)}
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#f0f4ff', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{client.name}</div>
              <div style={{ fontSize:10, color:'#4a5878' }}>{client.industry || 'Cloud Services'}</div>
            </div>
          </div>

          {/* AWS Status */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background: hasAWS ? '#10b981' : '#f59e0b' }} />
              <span style={{ fontSize:11, color: hasAWS ? '#10b981' : '#f59e0b', fontWeight:600 }}>
                {hasAWS ? 'AWS Connected' : 'AWS Not Connected'}
              </span>
            </div>
            <button onClick={function(){setShowCredentials(true);}}
              style={{ background:'none', border:'1px solid rgba(59,130,246,0.3)', borderRadius:6, color:'#60a5fa', fontSize:10, cursor:'pointer', padding:'2px 8px', fontWeight:600 }}>
              {hasAWS ? 'Manage' : 'Add Keys'}
            </button>
          </div>

          {/* Account count */}
          {accountCount > 0 && (
            <div style={{ fontSize:10, color:'#4a5878', marginBottom:8 }}>
              {accountCount} AWS account{accountCount > 1 ? 's' : ''} configured
            </div>
          )}

          {/* Regions */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ color:'#4a5878', fontSize:9, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>Regions</span>
              {isAdmin && (
                <button onClick={function(){setShowRegionEdit(!showRegionEdit); setTempRegions(client.awsRegions||['ap-south-1']);}}
                  style={{ background:'none', border:'none', color:'#3b82f6', fontSize:10, cursor:'pointer', fontWeight:600 }}>
                  {showRegionEdit ? 'Cancel' : '✏️ Edit'}
                </button>
              )}
            </div>
            {!showRegionEdit ? (
              <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
                {(client.awsRegions || ['ap-south-1']).map(function(r, i) {
                  return <span key={i} title={REGION_LABELS[r]||r} style={{ background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', borderRadius:4, padding:'1px 6px', color:'#22d3ee', fontSize:9, fontFamily:'monospace' }}>{r}</span>;
                })}
              </div>
            ) : (
              <div style={{ background:'#0d1424', border:'1px solid #1e2d47', borderRadius:9, overflow:'hidden' }}>
                <div style={{ maxHeight:180, overflowY:'auto', padding:6 }}>
                  {ALL_REGIONS.map(function(r) {
                    var isSel = tempRegions.includes(r);
                    return (
                      <button key={r} onClick={function(){setTempRegions(function(p){return isSel?p.filter(function(x){return x!==r;}): [...p,r];});}}
                        style={{ display:'flex', alignItems:'center', gap:7, width:'100%', padding:'5px 7px', background:isSel?'rgba(59,130,246,0.1)':'transparent', border:'none', borderRadius:6, cursor:'pointer', marginBottom:2 }}>
                        <div style={{ width:14, height:14, borderRadius:3, border:'2px solid '+(isSel?'#3b82f6':'#2a3a58'), background:isSel?'#3b82f6':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {isSel && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                        </div>
                        <div style={{ textAlign:'left' }}>
                          <div style={{ color:isSel?'#60a5fa':'#8a9bc5', fontSize:10, fontFamily:'monospace' }}>{r}</div>
                          <div style={{ color:'#4a5878', fontSize:9 }}>{REGION_LABELS[r]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding:'6px', borderTop:'1px solid #1a2540', display:'flex', gap:5 }}>
                  <button onClick={function(){setTempRegions(ALL_REGIONS);}} style={{ flex:1, padding:'4px', background:'rgba(59,130,246,0.08)', border:'none', borderRadius:5, color:'#60a5fa', fontSize:9, cursor:'pointer' }}>All</button>
                  <button onClick={function(){setTempRegions([]);}} style={{ flex:1, padding:'4px', background:'rgba(239,68,68,0.08)', border:'none', borderRadius:5, color:'#f87171', fontSize:9, cursor:'pointer' }}>Clear</button>
                  <button onClick={saveRegions} disabled={savingRegions||!tempRegions.length} style={{ flex:2, padding:'4px', background:'linear-gradient(135deg,#3b82f6,#06b6d4)', border:'none', borderRadius:5, color:'white', fontSize:9, fontWeight:600, cursor:'pointer' }}>
                    {savingRegions?'...':'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, overflow:'auto', padding:'6px 5px' }}>
          {NAV.map(function(s) {
            var isAct = activeSection === s.id;
            return (
              <button key={s.id} onClick={function(){goSection(s.id);}}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 9px', width:'100%', background: isAct?'rgba(59,130,246,0.1)':'none', border:'none', color: isAct?'#f0f4ff':'#8a9bc5', cursor:'pointer', borderRadius:9, textAlign:'left', position:'relative', transition:'all 0.15s', marginBottom:2, fontSize:13, fontWeight:isAct?600:400, overflow:'hidden' }}>
                <span style={{ fontSize:15, flexShrink:0 }}>{s.icon}</span>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.label}</span>
                {isAct && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:18, background:'#3b82f6', borderRadius:'0 3px 3px 0' }} />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div style={{ flex:1, overflow:'auto', padding:'18px 22px' }}>
        {activeSection === 'overview' && <ClientOverview client={client} setSection={goSection} setShowCredentials={setShowCredentials} hasAWS={hasAWS} />}
        {activeSection === 'security' && <SecurityPanel clientId={clientId} clientName={client.name} onAddCredentials={function(){setShowCredentials(true);}} />}
        {activeSection === 'cost' && <CostPanel clientId={clientId} clientName={client.name} accounts={client.awsAccounts} onAddCredentials={function(){setShowCredentials(true);}} />}
        {activeSection === 'inventory' && <InventoryPanel clientId={clientId} clientName={client.name} regions={client.awsRegions} onAddCredentials={function(){setShowCredentials(true);}} />}
        {activeSection === 'optimizer' && <OptimizerPanel clientId={clientId} clientName={client.name} onAddCredentials={function(){setShowCredentials(true);}} />}
        {activeSection === 'patching' && <PatchingPanel clientId={clientId} clientName={client.name} onAddCredentials={function(){setShowCredentials(true);}} />}
        {activeSection === 'ssl' && <SSLPanel clientId={clientId} clientName={client.name} domains={client.domains} onAddCredentials={function(){setShowCredentials(true);}} />}
        {activeSection === 'freshdesk' && <FreshdeskPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'reports' && <MonthlyReportPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'notes' && <NotesPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'alerts' && <AlertsPanel clientId={clientId} clientName={client.name} clientDomains={client.domains} />}
      </div>

      {showCredentials && (
        <CredentialsModal client={client} onClose={function(){setShowCredentials(false);}} onSaved={onCredentialsSaved} />
      )}
    </div>
  );
}

// ── Overview panel ────────────────────────────────────────────────────────────
function ClientOverview(props) {
  var client = props.client; var setSection = props.setSection; var setShowCredentials = props.setShowCredentials; var hasAWS = props.hasAWS;
  var quickActions = [
    { label:'Security Audit', icon:'🛡️', section:'security', color:'#ef4444', desc:'Scan AWS account' },
    { label:'Cost Optimization', icon:'💰', section:'cost', color:'#f59e0b', desc:'AWS Cost Explorer' },
    { label:'Inventory', icon:'📦', section:'inventory', color:'#3b82f6', desc:'All AWS resources' },
    { label:'Compute Optimizer', icon:'⚡', section:'optimizer', color:'#8b5cf6', desc:'Right-sizing tips' },
    { label:'EC2 Patching', icon:'🔧', section:'patching', color:'#10b981', desc:'Pre/Post scan' },
    { label:'SSL & Expiry', icon:'🔒', section:'ssl', color:'#06b6d4', desc:'Cert monitoring' },
    { label:'FreshDesk', icon:'🎫', section:'freshdesk', color:'#f97316', desc:'Support tickets' },
    { label:'Monthly Report', icon:'📄', section:'reports', color:'#ec4899', desc:'Download report' },
    { label:'Notes', icon:'📝', section:'notes', color:'#f59e0b', desc:'Internal notes' },
    { label:'Alert Config', icon:'🔔', section:'alerts', color:'#ef4444', desc:'Email alerts' },
  ];
  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#f0f4ff', marginBottom:4 }}>{client.name}</h1>
      <p style={{ color:'#64748b', fontSize:13, marginBottom:18 }}>{client.industry || 'Cloud Services'} · {(client.awsRegions||['ap-south-1']).length} region(s)</p>

      {!hasAWS && (
        <div onClick={function(){setShowCredentials(true);}} style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:12, padding:'13px 16px', marginBottom:18, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>⚠️</span>
            <div>
              <div style={{ color:'#fbbf24', fontWeight:600, fontSize:13 }}>AWS Credentials Not Configured</div>
              <div style={{ color:'#4a5878', fontSize:11, marginTop:1 }}>Add IAM access key to enable live AWS data scanning</div>
            </div>
          </div>
          <span style={{ color:'#3b82f6', fontSize:13, fontWeight:600 }}>Add Keys →</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:12, marginBottom:22 }}>
        {quickActions.map(function(a, i) {
          return (
            <div key={i} onClick={function(){setSection(a.section);}}
              style={{ background:'#111827', border:'1px solid '+a.color+'22', borderRadius:14, padding:'16px 14px', cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={function(e){e.currentTarget.style.background=a.color+'10';e.currentTarget.style.borderColor=a.color+'44';e.currentTarget.style.transform='translateY(-2px)';}}
              onMouseLeave={function(e){e.currentTarget.style.background='#111827';e.currentTarget.style.borderColor=a.color+'22';e.currentTarget.style.transform='translateY(0)';}}>
              <div style={{ fontSize:24, marginBottom:7 }}>{a.icon}</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#e2e8f0', marginBottom:2 }}>{a.label}</div>
              <div style={{ fontSize:11, color:a.color }}>{a.desc} →</div>
            </div>
          );
        })}
      </div>

      <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, padding:18 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#8a9bc5', marginBottom:14 }}>Client Information</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:14 }}>
          {[
            { l:'AWS Account ID', v:client.awsAccountId||'Not set', i:'☁️' },
            { l:'Contact', v:client.contactName||'Not set', i:'👤' },
            { l:'Email', v:client.contactEmail||'Not set', i:'📧' },
            { l:'Phone', v:client.contactPhone||'Not set', i:'📱' },
            { l:'Status', v:client.status||'active', i:'🔵' },
            { l:'Domains', v:(client.domains||[]).join(', ')||'None', i:'🌐' },
          ].map(function(d, i) {
            return (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
                <span style={{ fontSize:15, marginTop:1 }}>{d.i}</span>
                <div>
                  <div style={{ color:'#4a5878', fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>{d.l}</div>
                  <div style={{ color:'#e2e8f0', fontSize:13, marginTop:2 }}>{d.v}</div>
                </div>
              </div>
            );
          })}
        </div>
        {client.notes && (
          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #1a2540' }}>
            <div style={{ color:'#4a5878', fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Notes</div>
            <p style={{ color:'#94a3b8', fontSize:13, lineHeight:1.6 }}>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notes Panel ───────────────────────────────────────────────────────────────
function NotesPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var [notes, setNotes] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showAdd, setShowAdd] = useState(false);
  var [form, setForm] = useState({ title:'', content:'', priority:'medium', pinned:false });
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    api.get('/clients/' + clientId + '/notes')
      .then(function(r) { setNotes(r.data); })
      .catch(function(){})
      .finally(function(){setLoading(false);});
  }, [clientId]);

  var addNote = function() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    api.post('/clients/' + clientId + '/notes', { ...form, clientName: clientName })
      .then(function(r) { setNotes(function(p) { return [r.data, ...p]; }); setShowAdd(false); setForm({ title:'', content:'', priority:'medium', pinned:false }); })
      .catch(function(){})
      .finally(function(){setSaving(false);});
  };

  var deleteNote = function(id) {
    api.delete('/clients/' + clientId + '/notes/' + id)
      .then(function() { setNotes(function(p) { return p.filter(function(n) { return n._id !== id; }); }); });
  };

  var togglePin = function(note) {
    api.put('/clients/' + clientId + '/notes/' + note._id, { pinned: !note.pinned })
      .then(function(r) { setNotes(function(p) { return p.map(function(n) { return n._id === r.data._id ? r.data : n; }); }); });
  };

  var PRIORITY_COLORS = { low:'#4a5878', medium:'#f59e0b', high:'#f97316', critical:'#ef4444' };

  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#f0f4ff', marginBottom:4 }}>📝 Notes</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>Internal notes and important reminders for {clientName}</p>
        </div>
        <button onClick={function(){setShowAdd(!showAdd);}}
          style={{ padding:'9px 16px', background:'linear-gradient(135deg,#3b82f6,#06b6d4)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Add Note
        </button>
      </div>

      {showAdd && (
        <div style={{ background:'#111827', border:'1px solid rgba(59,130,246,0.25)', borderRadius:14, padding:20, marginBottom:18 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={function(e){setForm(function(f){return{...f,title:e.target.value};});}} placeholder="Note title" style={inp} />
              </div>
              <div>
                <label style={lbl}>Priority</label>
                <select value={form.priority} onChange={function(e){setForm(function(f){return{...f,priority:e.target.value};});}} style={{ ...inp, background:'#0d1424' }}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>Content *</label>
              <textarea value={form.content} onChange={function(e){setForm(function(f){return{...f,content:e.target.value};});}} rows={3} placeholder="Write your note here..." style={{ ...inp, resize:'vertical', fontFamily:"'Space Grotesk',sans-serif" }} />
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={function(){setShowAdd(false);}} style={cancelBtn}>Cancel</button>
              <button onClick={addNote} disabled={saving||!form.title.trim()||!form.content.trim()} style={saveBtn}>{saving?'Saving...':'💾 Save Note'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}><div className="spinner" style={{ width:28, height:28, borderWidth:3 }}/></div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign:'center', padding:50, background:'#111827', border:'1px solid #1e2d47', borderRadius:14 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>📝</div>
          <div style={{ color:'#8a9bc5', fontSize:14, fontWeight:600, marginBottom:4 }}>No notes yet</div>
          <div style={{ color:'#4a5878', fontSize:12 }}>Add notes for important reminders, client-specific info, or action items</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {notes.map(function(note) {
            var pc = PRIORITY_COLORS[note.priority] || '#4a5878';
            return (
              <div key={note._id} style={{ background:'#111827', border:'1px solid '+(note.pinned?'rgba(59,130,246,0.3)':'#1e2d47'), borderRadius:14, padding:18, position:'relative' }}>
                {note.pinned && <div style={{ position:'absolute', top:14, right:14, fontSize:16 }}>📌</div>}
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ color:'#f0f4ff', fontSize:14, fontWeight:600 }}>{note.title}</span>
                      <span style={{ background:pc+'18', color:pc, borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:600 }}>{note.priority}</span>
                    </div>
                    <p style={{ color:'#94a3b8', fontSize:13, lineHeight:1.6 }}>{note.content}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingTop:10, borderTop:'1px solid #1a2540' }}>
                  <div style={{ color:'#4a5878', fontSize:11 }}>
                    By {note.createdByName || 'Team'} · {new Date(note.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={function(){togglePin(note);}} style={{ background:'none', border:'1px solid #1e2d47', borderRadius:7, color:'#4a5878', fontSize:11, cursor:'pointer', padding:'3px 10px' }}>
                      {note.pinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                    <button onClick={function(){deleteNote(note._id);}} style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#f87171', fontSize:11, cursor:'pointer', padding:'3px 10px' }}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Alerts Panel ──────────────────────────────────────────────────────────────
function AlertsPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName; var clientDomains = props.clientDomains || [];
  var [alerts, setAlerts] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showAdd, setShowAdd] = useState(false);
  var [form, setForm] = useState({ email:'', type:'ssl_expiry', thresholdDays:30, enabled:true });
  var [saving, setSaving] = useState(false);

  useEffect(function() {
    api.get('/clients/' + clientId + '/alerts')
      .then(function(r) { setAlerts(r.data); })
      .catch(function(){})
      .finally(function(){setLoading(false);});
  }, [clientId]);

  var addAlert = function() {
    if (!form.email.trim()) return;
    setSaving(true);
    api.post('/clients/' + clientId + '/alerts', { ...form, clientName: clientName })
      .then(function(r) { setAlerts(function(p) { return [...p, r.data]; }); setShowAdd(false); setForm({ email:'', type:'ssl_expiry', thresholdDays:30, enabled:true }); })
      .catch(function(){})
      .finally(function(){setSaving(false);});
  };

  var deleteAlert = function(id) {
    api.delete('/clients/' + clientId + '/alerts/' + id)
      .then(function() { setAlerts(function(p) { return p.filter(function(a) { return a._id !== id; }); }); });
  };

  var toggleAlert = function(alert) {
    api.put('/clients/' + clientId + '/alerts/' + alert._id, { enabled: !alert.enabled })
      .then(function(r) { setAlerts(function(p) { return p.map(function(a) { return a._id === r.data._id ? r.data : a; }); }); });
  };

  var ALERT_TYPES = [
    { v:'ssl_expiry', l:'🔒 SSL Certificate Expiry' },
    { v:'domain_expiry', l:'🌐 Domain Name Expiry' },
    { v:'ri_expiry', l:'💻 Reserved Instance Expiry' },
    { v:'savings_plan_expiry', l:'💰 Savings Plan Expiry' },
    { v:'cost_anomaly', l:'📈 Cost Anomaly Detected' },
    { v:'security_critical', l:'🛡️ Critical Security Finding' },
    { v:'patch_due', l:'🔧 Patching Due' },
  ];

  return (
    <div style={{ animation:'fadeIn 0.3s ease' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#f0f4ff', marginBottom:4 }}>🔔 Alert Configuration</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>Configure email alerts for critical events — SSL expiry, cost anomalies, RI renewals</p>
        </div>
        <button onClick={function(){setShowAdd(!showAdd);}}
          style={{ padding:'9px 16px', background:'linear-gradient(135deg,#ef4444,#f97316)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + Add Alert
        </button>
      </div>

      {showAdd && (
        <div style={{ background:'#111827', border:'1px solid rgba(239,68,68,0.2)', borderRadius:14, padding:20, marginBottom:18 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <label style={lbl}>Alert Email *</label>
                <input type="email" value={form.email} onChange={function(e){setForm(function(f){return{...f,email:e.target.value};});}} placeholder="alerts@shellkode.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Alert Type</label>
                <select value={form.type} onChange={function(e){setForm(function(f){return{...f,type:e.target.value};});}} style={{ ...inp, background:'#0d1424' }}>
                  {ALERT_TYPES.map(function(t){return <option key={t.v} value={t.v}>{t.l}</option>;})}
                </select>
              </div>
            </div>
            <div>
              <label style={lbl}>Alert Threshold (days before expiry): <strong style={{ color:'#60a5fa' }}>{form.thresholdDays} days</strong></label>
              <input type="range" min={7} max={90} value={form.thresholdDays} onChange={function(e){setForm(function(f){return{...f,thresholdDays:parseInt(e.target.value)};});}}
                style={{ width:'100%', accentColor:'#3b82f6' }} />
              <div style={{ display:'flex', justifyContent:'space-between', color:'#4a5878', fontSize:11, marginTop:2 }}><span>7 days</span><span>30 days</span><span>90 days</span></div>
            </div>
            <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:9, padding:'11px 13px', color:'#8a9bc5', fontSize:12 }}>
              ℹ️ Alert emails are sent automatically when the configured threshold is reached. Ensure the backend has SMTP/SES configured for delivery.
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={function(){setShowAdd(false);}} style={cancelBtn}>Cancel</button>
              <button onClick={addAlert} disabled={saving||!form.email.trim()} style={saveBtn}>{saving?'Saving...':'🔔 Save Alert'}</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200 }}><div className="spinner" style={{ width:28, height:28, borderWidth:3 }}/></div>
      ) : alerts.length === 0 ? (
        <div style={{ textAlign:'center', padding:50, background:'#111827', border:'1px solid #1e2d47', borderRadius:14 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🔔</div>
          <div style={{ color:'#8a9bc5', fontSize:14, fontWeight:600, marginBottom:4 }}>No alerts configured</div>
          <div style={{ color:'#4a5878', fontSize:12, maxWidth:360, margin:'0 auto' }}>Add alert rules to receive email notifications for SSL expiry, cost anomalies, and other critical events</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {alerts.map(function(alert) {
            var typeLabel = ALERT_TYPES.find(function(t){return t.v===alert.type;})?.l || alert.type;
            return (
              <div key={alert._id} style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:22 }}>{alert.enabled ? '🔔' : '🔕'}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'#e2e8f0', fontSize:13, fontWeight:600, marginBottom:2 }}>{typeLabel}</div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    <span style={{ color:'#4a5878', fontSize:11 }}>📧 {alert.email}</span>
                    <span style={{ color:'#4a5878', fontSize:11 }}>⏰ {alert.thresholdDays} days before</span>
                    <span style={{ background:alert.enabled?'rgba(16,185,129,0.1)':'rgba(100,116,139,0.1)', color:alert.enabled?'#10b981':'#64748b', borderRadius:6, padding:'1px 7px', fontSize:10, fontWeight:600 }}>
                      {alert.enabled ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <button onClick={function(){toggleAlert(alert);}} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #1e2d47', borderRadius:7, color:'#8a9bc5', fontSize:11, cursor:'pointer', padding:'4px 10px' }}>
                    {alert.enabled ? 'Pause' : 'Enable'}
                  </button>
                  <button onClick={function(){deleteAlert(alert._id);}} style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, color:'#f87171', fontSize:11, cursor:'pointer', padding:'4px 10px' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

var lbl = { display:'block', color:'#8a9bc5', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 };
var inp = { width:'100%', padding:'9px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid #1e2d47', borderRadius:9, color:'#f0f4ff', fontSize:13, outline:'none' };
var cancelBtn = { padding:'9px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid #1e2d47', borderRadius:9, color:'#8a9bc5', fontSize:13, cursor:'pointer' };
var saveBtn = { padding:'9px 22px', background:'linear-gradient(135deg,#3b82f6,#06b6d4)', border:'none', borderRadius:9, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' };
