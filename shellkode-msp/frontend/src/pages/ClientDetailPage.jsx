import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

var NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'security', label: 'Security Audit', icon: '🛡️' },
  { id: 'cost', label: 'Cost Optimization', icon: '💰' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'optimizer', label: 'Compute Optimizer', icon: '⚡' },
  { id: 'patching', label: 'EC2 Patching', icon: '🔧' },
  { id: 'ssl', label: 'SSL & Domain & RI', icon: '🔒' },
  { id: 'freshdesk', label: 'FreshDesk Tickets', icon: '🎫' },
  { id: 'reports', label: 'Monthly Reports', icon: '📄' },
];

var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1','eu-north-1','sa-east-1','ca-central-1','me-south-1','af-south-1'];

var REGION_LABELS = {
  'ap-south-1': 'Mumbai', 'ap-south-2': 'Hyderabad', 'ap-southeast-1': 'Singapore',
  'ap-southeast-2': 'Sydney', 'ap-northeast-1': 'Tokyo', 'ap-northeast-2': 'Seoul',
  'us-east-1': 'N. Virginia', 'us-east-2': 'Ohio', 'us-west-1': 'N. California',
  'us-west-2': 'Oregon', 'eu-west-1': 'Ireland', 'eu-west-2': 'London',
  'eu-central-1': 'Frankfurt', 'eu-north-1': 'Stockholm', 'sa-east-1': 'São Paulo',
  'ca-central-1': 'Canada', 'me-south-1': 'Bahrain', 'af-south-1': 'Cape Town',
};

export default function ClientDetailPage() {
  var params = useParams();
  var clientId = params.clientId;
  var section = params.section;
  var navigate = useNavigate();
  var [client, setClient] = useState(null);
  var [loading, setLoading] = useState(true);
  var [activeSection, setActiveSection] = useState(section || 'overview');
  var [showCredentials, setShowCredentials] = useState(false);
  var [showRegionEdit, setShowRegionEdit] = useState(false);
  var [savingRegions, setSavingRegions] = useState(false);
  var [tempRegions, setTempRegions] = useState([]);
  var [showEditClient, setShowEditClient] = useState(false);

  useEffect(function() {
    api.get('/clients/' + clientId)
      .then(function(r) { setClient(r.data); setTempRegions(r.data.awsRegions || ['ap-south-1']); })
      .catch(function() { navigate('/msp/cronos/clients'); })
      .finally(function() { setLoading(false); });
  }, [clientId]);

  useEffect(function() { if (section) setActiveSection(section); }, [section]);

  var setSection = function(s) {
    setActiveSection(s);
    navigate('/msp/cronos/clients/' + clientId + '/' + s, { replace: true });
  };

  var toggleRegion = function(r) {
    setTempRegions(function(prev) {
      return prev.includes(r) ? prev.filter(function(x) { return x !== r; }) : [...prev, r];
    });
  };

  var saveRegions = function() {
    setSavingRegions(true);
    api.put('/clients/' + clientId, { awsRegions: tempRegions })
      .then(function() {
        setClient(function(c) { return { ...c, awsRegions: tempRegions }; });
        setShowRegionEdit(false);
      })
      .catch(function() {})
      .finally(function() { setSavingRegions(false); });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );
  if (!client) return null;

  var hasCredentials = client.awsCredentials && client.awsCredentials.accessKeyId;
  var accountCount = (client.awsAccounts && client.awsAccounts.length) || (hasCredentials ? 1 : 0);

  return (
    <div style={st.container}>
      {/* Sidebar */}
      <div style={st.sidebar}>
        <div style={st.clientHeader}>
          <button onClick={function() { navigate('/msp/cronos/clients'); }} style={st.backBtn}>
            ← Back to Clients
          </button>

          {/* Client info with edit */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={st.clientBadge}>
              <div style={st.clientInitials}>{client.name.slice(0, 2)}</div>
              <div style={{ minWidth: 0 }}>
                <div style={st.clientName}>{client.name}</div>
                <div style={st.clientIndustry}>{client.industry || 'Cloud Services'}</div>
              </div>
            </div>
            <button onClick={function() { setShowEditClient(true); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}>✏️</button>
          </div>

          {/* AWS Accounts indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: '#4a5878' }}>AWS Accounts:</span>
            <span style={{ background: accountCount > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: accountCount > 0 ? '#10b981' : '#f59e0b', borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 700 }}>
              {accountCount || 'None'}
            </span>
          </div>

          {/* Regions with edit dropdown */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ color: '#4a5878', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Regions</span>
              <button onClick={function() { setShowRegionEdit(!showRegionEdit); setTempRegions(client.awsRegions || ['ap-south-1']); }}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                {showRegionEdit ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {!showRegionEdit ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {(client.awsRegions || ['ap-south-1']).map(function(r, i) {
                  return (
                    <span key={i} style={st.regionTag} title={REGION_LABELS[r] || r}>
                      {r}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#0d1424', border: '1px solid #1e2d47', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ maxHeight: 200, overflowY: 'auto', padding: 8 }}>
                  {ALL_REGIONS.map(function(r) {
                    var isSel = tempRegions.includes(r);
                    return (
                      <button key={r} onClick={function() { toggleRegion(r); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: isSel ? 'rgba(59,130,246,0.1)' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', marginBottom: 2, textAlign: 'left' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: '2px solid ' + (isSel ? '#3b82f6' : '#2a3a58'), background: isSel ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {isSel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                        </div>
                        <div>
                          <div style={{ color: isSel ? '#60a5fa' : '#8a9bc5', fontSize: 11, fontFamily: 'monospace' }}>{r}</div>
                          <div style={{ color: '#4a5878', fontSize: 10 }}>{REGION_LABELS[r]}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: '8px', borderTop: '1px solid #1a2540', display: 'flex', gap: 6 }}>
                  <button onClick={function() { setTempRegions(ALL_REGIONS); }} style={{ flex: 1, padding: '5px', background: 'rgba(59,130,246,0.08)', border: 'none', borderRadius: 6, color: '#60a5fa', fontSize: 10, cursor: 'pointer' }}>All</button>
                  <button onClick={function() { setTempRegions([]); }} style={{ flex: 1, padding: '5px', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 6, color: '#f87171', fontSize: 10, cursor: 'pointer' }}>Clear</button>
                  <button onClick={saveRegions} disabled={savingRegions || !tempRegions.length}
                    style={{ flex: 2, padding: '5px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 6, color: 'white', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                    {savingRegions ? '...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Credentials status */}
        <div style={{ ...st.credStatus, ...(hasCredentials ? st.credActive : st.credMissing) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13 }}>{hasCredentials ? '✅' : '⚠️'}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{hasCredentials ? 'AWS Connected' : 'AWS Not Connected'}</div>
              {accountCount > 0 && <div style={{ fontSize: 10, color: '#4a5878', marginTop: 1 }}>{accountCount} account{accountCount > 1 ? 's' : ''}</div>}
            </div>
          </div>
          <button onClick={function() { setShowCredentials(true); }} style={st.credBtn}>
            {hasCredentials ? 'Manage' : 'Add Keys'}
          </button>
        </div>

        {/* Nav sections */}
        <nav style={st.nav}>
          {NAV_SECTIONS.map(function(s) {
            var isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={function() { setSection(s.id); }}
                style={{ ...st.navItem, ...(isActive ? st.navActive : {}) }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
                {isActive && <div style={st.navIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* Client meta at bottom */}
        <div style={st.clientMeta}>
          {client.contactEmail && (
            <div style={st.metaRow}><span>📧</span><span style={{ color: '#4a5878', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.contactEmail}</span></div>
          )}
          {client.contactPhone && (
            <div style={st.metaRow}><span>📱</span><span style={{ color: '#4a5878', fontSize: 11 }}>{client.contactPhone}</span></div>
          )}
          <div style={st.metaRow}><span>📅</span><span style={{ color: '#4a5878', fontSize: 11 }}>Since {client.onboardedDate ? new Date(client.onboardedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recent'}</span></div>
        </div>
      </div>

      {/* Main content */}
      <div style={st.main}>
        {activeSection === 'overview' && <ClientOverview client={client} setSection={setSection} setShowCredentials={setShowCredentials} />}
        {activeSection === 'security' && <SecurityPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'cost' && <CostPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'inventory' && <InventoryPanel clientId={clientId} clientName={client.name} regions={client.awsRegions} />}
        {activeSection === 'optimizer' && <OptimizerPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'patching' && <PatchingPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'ssl' && <SSLPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'freshdesk' && <FreshdeskPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'reports' && <MonthlyReportPanel clientId={clientId} clientName={client.name} />}
      </div>

      {/* Modals */}
      {showCredentials && (
        <CredentialsModal client={client}
          onClose={function() { setShowCredentials(false); }}
          onSaved={function(updated) { setClient(function(c) { return { ...c, ...updated }; }); setShowCredentials(false); }} />
      )}

      {showEditClient && (
        <EditClientModal client={client}
          onClose={function() { setShowEditClient(false); }}
          onSaved={function(updated) { setClient(function(c) { return { ...c, ...updated }; }); setShowEditClient(false); }} />
      )}
    </div>
  );
}

function EditClientModal(props) {
  var client = props.client; var onClose = props.onClose; var onSaved = props.onSaved;
  var [form, setForm] = useState({ name: client.name || '', industry: client.industry || '', contactName: client.contactName || '', contactEmail: client.contactEmail || '', contactPhone: client.contactPhone || '', awsAccountId: client.awsAccountId || '', domains: (client.domains || []).join(', '), notes: client.notes || '', status: client.status || 'active' });
  var [saving, setSaving] = useState(false);
  var [error, setError] = useState('');

  var update = function(k, v) { setForm(function(f) { return { ...f, [k]: v }; }); };

  var handleSave = function() {
    if (!form.name.trim()) { setError('Client name is required'); return; }
    setSaving(true);
    api.put('/clients/' + client._id, { ...form, domains: form.domains ? form.domains.split(',').map(function(d) { return d.trim(); }) : [] })
      .then(function(r) { onSaved(r.data); })
      .catch(function(err) { setError(err.response ? err.response.data.error : 'Failed to save'); setSaving(false); });
  };

  var INDUSTRIES = ['FinTech','IT Services','Healthcare','Manufacturing','Technology','EdTech','BioTech','NBFC / Finance','E-Commerce','Logistics','Media','Retail'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={function(e) { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 20, width: '100%', maxWidth: 540, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 22px 0' }}>
          <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>Edit Client — {client.name}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Client Name *', key: 'name', type: 'text', placeholder: 'Client name' },
            { label: 'AWS Account ID', key: 'awsAccountId', type: 'text', placeholder: '123456789012' },
            { label: 'Contact Name', key: 'contactName', type: 'text', placeholder: 'Primary contact' },
            { label: 'Contact Email', key: 'contactEmail', type: 'email', placeholder: 'contact@client.com' },
            { label: 'Contact Phone', key: 'contactPhone', type: 'text', placeholder: '9876543210' },
            { label: 'Domains (comma separated)', key: 'domains', type: 'text', placeholder: 'example.com, api.example.com' },
          ].map(function(f) {
            return (
              <div key={f.key}>
                <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={function(e) { update(f.key, e.target.value); }} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' }} />
              </div>
            );
          })}
          <div>
            <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Industry</label>
            <select value={form.industry} onChange={function(e) { update('industry', e.target.value); }}
              style={{ width: '100%', padding: '10px 14px', background: '#0d1424', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' }}>
              <option value="">Select industry...</option>
              {INDUSTRIES.map(function(ind) { return <option key={ind} value={ind}>{ind}</option>; })}
            </select>
          </div>
          <div>
            <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Status</label>
            <select value={form.status} onChange={function(e) { update('status', e.target.value); }}
              style={{ width: '100%', padding: '10px 14px', background: '#0d1424', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none' }}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="onboarding">Onboarding</option>
            </select>
          </div>
          <div>
            <label style={{ color: '#8a9bc5', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea value={form.notes} onChange={function(e) { update('notes', e.target.value); }} rows={3}
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: "'Space Grotesk', sans-serif" }} />
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>{error}</div>}
        </div>
        <div style={{ padding: '14px 22px 22px', borderTop: '1px solid #1a2540', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : '✅ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientOverview(props) {
  var client = props.client; var setSection = props.setSection; var setShowCredentials = props.setShowCredentials;
  var hasCredentials = client.awsCredentials && client.awsCredentials.accessKeyId;

  var quickActions = [
    { label: 'Security Audit', icon: '🛡️', section: 'security', color: '#ef4444', desc: 'Run security scan' },
    { label: 'Cost Optimization', icon: '💰', section: 'cost', color: '#f59e0b', desc: 'Analyse AWS costs' },
    { label: 'Inventory', icon: '📦', section: 'inventory', color: '#3b82f6', desc: 'View all resources' },
    { label: 'Compute Optimizer', icon: '⚡', section: 'optimizer', color: '#8b5cf6', desc: 'Right-sizing tips' },
    { label: 'EC2 Patching', icon: '🔧', section: 'patching', color: '#10b981', desc: 'Pre/Post scan' },
    { label: 'SSL & Domain & RI', icon: '🔒', section: 'ssl', color: '#06b6d4', desc: 'Expiry monitor' },
    { label: 'FreshDesk Tickets', icon: '🎫', section: 'freshdesk', color: '#f97316', desc: 'View all tickets' },
    { label: 'Monthly Report', icon: '📄', section: 'reports', color: '#ec4899', desc: 'Generate report' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>{client.name}</h1>
        <p style={{ color: '#64748b', fontSize: 13 }}>
          {client.industry || 'Cloud Services'} · {(client.awsRegions || ['ap-south-1']).length} region(s) · Onboarded {client.onboardedDate ? new Date(client.onboardedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'}
        </p>
      </div>

      {!hasCredentials && (
        <div onClick={function() { setShowCredentials(true); }} style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13 }}>AWS Credentials Not Configured</div>
              <div style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>Add IAM access keys to enable live data scanning</div>
            </div>
          </div>
          <span style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600 }}>Add Keys →</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
        {quickActions.map(function(a, i) {
          return (
            <div key={i} style={{ background: '#111827', border: '1px solid ' + a.color + '22', borderRadius: 14, padding: '18px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={function() { setSection(a.section); }}
              onMouseEnter={function(e) { e.currentTarget.style.background = a.color + '10'; e.currentTarget.style.borderColor = a.color + '44'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={function(e) { e.currentTarget.style.background = '#111827'; e.currentTarget.style.borderColor = a.color + '22'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: a.color, fontWeight: 500 }}>{a.desc} →</div>
            </div>
          );
        })}
      </div>

      {/* Client details card */}
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#8a9bc5', marginBottom: 14 }}>Client Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { label: 'AWS Account ID', value: client.awsAccountId || 'Not set', icon: '☁️' },
            { label: 'Contact', value: client.contactName || 'Not set', icon: '👤' },
            { label: 'Email', value: client.contactEmail || 'Not set', icon: '📧' },
            { label: 'Phone', value: client.contactPhone || 'Not set', icon: '📱' },
            { label: 'Status', value: client.status || 'active', icon: '🔵' },
            { label: 'Domains', value: (client.domains || []).join(', ') || 'Not set', icon: '🌐' },
          ].map(function(d, i) {
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>{d.icon}</span>
                <div>
                  <div style={{ color: '#4a5878', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.label}</div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 2 }}>{d.value}</div>
                </div>
              </div>
            );
          })}
        </div>
        {client.notes && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #1a2540' }}>
            <div style={{ color: '#4a5878', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Notes</div>
            <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.6 }}>{client.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

var st = {
  container: { display: 'flex', gap: 0, height: 'calc(100vh - 90px)', margin: '-20px -24px', animation: 'fadeIn 0.4s ease' },
  sidebar: { width: 256, background: '#090e1c', borderRight: '1px solid #1a2540', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
  clientHeader: { padding: '14px 14px 10px', borderBottom: '1px solid #1a2540' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4a5878', fontSize: 12, cursor: 'pointer', marginBottom: 12, padding: 0, transition: 'color 0.15s' },
  clientBadge: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  clientInitials: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 },
  clientName: { fontSize: 13, fontWeight: 700, color: '#f0f4ff', lineHeight: 1.2 },
  clientIndustry: { fontSize: 10, color: '#4a5878', marginTop: 2 },
  regionTag: { background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 5, padding: '1px 6px', color: '#22d3ee', fontSize: 9, fontFamily: 'monospace', cursor: 'default' },
  credStatus: { margin: '6px 10px', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  credActive: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' },
  credMissing: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' },
  credBtn: { background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'inherit', fontWeight: 700, padding: 0 },
  nav: { flex: 1, overflow: 'auto', padding: '6px 6px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', width: '100%', background: 'none', border: 'none', color: '#8a9bc5', cursor: 'pointer', borderRadius: 9, textAlign: 'left', position: 'relative', transition: 'all 0.15s', overflow: 'hidden' },
  navActive: { background: 'rgba(59,130,246,0.1)', color: '#f0f4ff' },
  navIndicator: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: '#3b82f6', borderRadius: '0 3px 3px 0' },
  clientMeta: { padding: '10px 14px', borderTop: '1px solid #1a2540' },
  metaRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '3px 0', fontSize: 13 },
  main: { flex: 1, overflow: 'auto', padding: '20px 24px' },
};
