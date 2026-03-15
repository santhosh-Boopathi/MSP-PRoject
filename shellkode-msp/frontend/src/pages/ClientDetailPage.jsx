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

var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1'];

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

  return (
    <div style={st.container}>
      {/* Sidebar */}
      <div style={st.sidebar}>
        <div style={st.clientHeader}>
          <button onClick={function() { navigate('/msp/cronos/clients'); }} style={st.backBtn}>
            ← Back
          </button>
          <div style={st.clientBadge}>
            <div style={st.clientInitials}>{client.name.slice(0, 2)}</div>
            <div>
              <div style={st.clientName}>{client.name}</div>
              <div style={st.clientIndustry}>{client.industry || 'Cloud Services'}</div>
            </div>
          </div>

          {/* Regions with edit button */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#4a5878', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>AWS Regions</span>
              <button onClick={function() { setShowRegionEdit(!showRegionEdit); setTempRegions(client.awsRegions || ['ap-south-1']); }}
                style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                {showRegionEdit ? 'Cancel' : '✏️ Edit'}
              </button>
            </div>

            {!showRegionEdit ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(client.awsRegions || ['ap-south-1']).map(function(r, i) {
                  return <span key={i} style={st.regionTag}>{r}</span>;
                })}
              </div>
            ) : (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: 10 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {ALL_REGIONS.map(function(r) {
                    var isSel = tempRegions.includes(r);
                    return (
                      <button key={r} onClick={function() { toggleRegion(r); }}
                        style={{ padding: '3px 8px', background: isSel ? 'rgba(59,130,246,0.2)' : 'transparent', border: '1px solid ' + (isSel ? 'rgba(59,130,246,0.5)' : '#2a3a58'), borderRadius: 5, color: isSel ? '#60a5fa' : '#4a5878', fontSize: 9, cursor: 'pointer', fontFamily: 'monospace' }}>
                        {r}
                      </button>
                    );
                  })}
                </div>
                <button onClick={saveRegions} disabled={savingRegions || !tempRegions.length}
                  style={{ width: '100%', padding: '6px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 7, color: 'white', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {savingRegions ? 'Saving...' : 'Save Regions'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Credentials status */}
        <div style={{ ...st.credStatus, ...(hasCredentials ? st.credActive : st.credMissing) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{hasCredentials ? '✅' : '⚠️'}</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{hasCredentials ? 'AWS Connected' : 'AWS Not Connected'}</span>
          </div>
          <button onClick={function() { setShowCredentials(true); }} style={st.credBtn}>
            {hasCredentials ? 'Update Keys' : 'Add Keys'}
          </button>
        </div>

        {/* Nav */}
        <nav style={st.nav}>
          {NAV_SECTIONS.map(function(s) {
            var isActive = activeSection === s.id;
            return (
              <button key={s.id} onClick={function() { setSection(s.id); }}
                style={{ ...st.navItem, ...(isActive ? st.navActive : {}) }}>
                <span style={{ fontSize: 15 }}>{s.icon}</span>
                <span style={{ fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{s.label}</span>
                {isActive && <div style={st.navIndicator} />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main */}
      <div style={st.main}>
        {activeSection === 'overview' && <ClientOverview client={client} setSection={setSection} />}
        {activeSection === 'security' && <SecurityPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'cost' && <CostPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'inventory' && <InventoryPanel clientId={clientId} clientName={client.name} regions={client.awsRegions} />}
        {activeSection === 'optimizer' && <OptimizerPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'patching' && <PatchingPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'ssl' && <SSLPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'freshdesk' && <FreshdeskPanel clientId={clientId} clientName={client.name} />}
        {activeSection === 'reports' && <MonthlyReportPanel clientId={clientId} clientName={client.name} />}
      </div>

      {showCredentials && (
        <CredentialsModal client={client}
          onClose={function() { setShowCredentials(false); }}
          onSaved={function(updated) { setClient(function(c) { return { ...c, ...updated }; }); setShowCredentials(false); }} />
      )}
    </div>
  );
}

function ClientOverview(props) {
  var client = props.client; var setSection = props.setSection;
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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>{client.name}</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          {client.industry} · Onboarded {client.onboardedDate ? new Date(client.onboardedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'} · {(client.awsRegions || ['ap-south-1']).join(', ')}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {quickActions.map(function(a, i) {
          return (
            <div key={i} style={{ background: '#111827', border: '1px solid ' + a.color + '22', borderRadius: 14, padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={function() { setSection(a.section); }}
              onMouseEnter={function(e) { e.currentTarget.style.background = a.color + '10'; e.currentTarget.style.borderColor = a.color + '44'; }}
              onMouseLeave={function(e) { e.currentTarget.style.background = '#111827'; e.currentTarget.style.borderColor = a.color + '22'; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{a.label}</div>
              <div style={{ fontSize: 11, color: a.color, fontWeight: 500 }}>{a.desc} →</div>
            </div>
          );
        })}
      </div>
      {client.notes && (
        <div style={{ marginTop: 24, background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8a9bc5', marginBottom: 8 }}>Client Notes</div>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{client.notes}</p>
        </div>
      )}
    </div>
  );
}

var st = {
  container: { display: 'flex', gap: 0, height: 'calc(100vh - 100px)', margin: '-24px', animation: 'fadeIn 0.4s ease' },
  sidebar: { width: 260, background: '#090e1c', borderRight: '1px solid #1a2540', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
  clientHeader: { padding: '18px 16px 14px', borderBottom: '1px solid #1a2540' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4a5878', fontSize: 12, cursor: 'pointer', marginBottom: 14, padding: 0 },
  clientBadge: { display: 'flex', alignItems: 'center', gap: 12 },
  clientInitials: { width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 },
  clientName: { fontSize: 14, fontWeight: 700, color: '#f0f4ff' },
  clientIndustry: { fontSize: 11, color: '#4a5878', marginTop: 1 },
  regionTag: { background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 6, padding: '2px 7px', color: '#22d3ee', fontSize: 9, fontFamily: 'monospace' },
  credStatus: { margin: '8px 12px', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  credActive: { background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' },
  credMissing: { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' },
  credBtn: { background: 'none', border: 'none', fontSize: 11, cursor: 'pointer', color: 'inherit', fontWeight: 600, padding: 0 },
  nav: { flex: 1, overflow: 'auto', padding: '8px' },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%', background: 'none', border: 'none', color: '#8a9bc5', cursor: 'pointer', borderRadius: 10, textAlign: 'left', position: 'relative', transition: 'all 0.15s' },
  navActive: { background: 'rgba(59,130,246,0.1)', color: '#f0f4ff' },
  navIndicator: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#3b82f6', borderRadius: '0 3px 3px 0' },
  main: { flex: 1, overflow: 'auto', padding: '24px 28px' },
};
