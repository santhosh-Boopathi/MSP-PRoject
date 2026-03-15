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

const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'security', label: 'Security Audit', icon: '🛡️' },
  { id: 'cost', label: 'Cost Optimization', icon: '💰' },
  { id: 'inventory', label: 'Inventory', icon: '📦' },
  { id: 'optimizer', label: 'Compute Optimizer', icon: '⚡' },
  { id: 'patching', label: 'EC2 Patching', icon: '🔧' },
  { id: 'ssl', label: 'SSL & Domain', icon: '🔒' },
  { id: 'freshdesk', label: 'FreshDesk Tickets', icon: '🎫' },
  { id: 'reports', label: 'Monthly Reports', icon: '📄' },
];

export default function ClientDetailPage() {
  const { clientId, section } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(section || 'overview');
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    api.get(`/clients/${clientId}`)
      .then(r => setClient(r.data))
      .catch(() => navigate('/msp/cronos/clients'))
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => { if (section) setActiveSection(section); }, [section]);

  const setSection = (s) => {
    setActiveSection(s);
    navigate(`/msp/cronos/clients/${clientId}/${s}`, { replace: true });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
    </div>
  );

  if (!client) return null;

  const hasCredentials = client.awsCredentials?.accessKeyId;

  return (
    <div style={styles.container}>
      {/* Left sidebar */}
      <div style={styles.sidebar}>
        {/* Client header */}
        <div style={styles.clientHeader}>
          <button onClick={() => navigate('/msp/cronos/clients')} style={styles.backBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </button>
          <div style={styles.clientBadge}>
            <div style={styles.clientInitials}>{client.name.slice(0, 2)}</div>
            <div>
              <div style={styles.clientName}>{client.name}</div>
              <div style={styles.clientIndustry}>{client.industry || 'Cloud Services'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            {(client.awsRegions || ['ap-south-1']).map((r, i) => (
              <span key={i} style={styles.regionTag}>{r}</span>
            ))}
          </div>
        </div>

        {/* Credentials status */}
        <div style={{ ...styles.credStatus, ...(hasCredentials ? styles.credActive : styles.credMissing) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasCredentials ? '✅' : '⚠️'}
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {hasCredentials ? 'AWS Connected' : 'AWS Not Connected'}
            </span>
          </div>
          <button onClick={() => setShowCredentials(true)} style={styles.credBtn}>
            {hasCredentials ? 'Update Keys' : 'Add Keys'}
          </button>
        </div>

        {/* Nav sections */}
        <nav style={styles.nav}>
          {NAV_SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              style={{ ...styles.navItem, ...(activeSection === s.id ? styles.navActive : {}) }}
            >
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontSize: 13, fontWeight: activeSection === s.id ? 600 : 400 }}>{s.label}</span>
              {activeSection === s.id && <div style={styles.navIndicator} />}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div style={styles.main}>
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
        <CredentialsModal
          client={client}
          onClose={() => setShowCredentials(false)}
          onSaved={(updated) => { setClient({ ...client, ...updated }); setShowCredentials(false); }}
        />
      )}
    </div>
  );
}

function ClientOverview({ client, setSection }) {
  const quickActions = [
    { label: 'Run Security Audit', icon: '🛡️', section: 'security', color: '#ef4444' },
    { label: 'View Costs', icon: '💰', section: 'cost', color: '#f59e0b' },
    { label: 'Check Inventory', icon: '📦', section: 'inventory', color: '#3b82f6' },
    { label: 'Compute Optimizer', icon: '⚡', section: 'optimizer', color: '#8b5cf6' },
    { label: 'EC2 Patching', icon: '🔧', section: 'patching', color: '#10b981' },
    { label: 'SSL Monitor', icon: '🔒', section: 'ssl', color: '#06b6d4' },
    { label: 'Tickets', icon: '🎫', section: 'freshdesk', color: '#f97316' },
    { label: 'Monthly Report', icon: '📄', section: 'reports', color: '#ec4899' },
  ];
  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 }}>
          {client.name}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          {client.industry} · Onboarded {client.onboardedDate ? new Date(client.onboardedDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'} · Regions: {(client.awsRegions || ['ap-south-1']).join(', ')}
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        {quickActions.map((a, i) => (
          <div key={i} style={{ background: '#111827', border: `1px solid ${a.color}22`, borderRadius: 14, padding: '20px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => setSection(a.section)}
            onMouseEnter={e => { e.currentTarget.style.background = a.color + '10'; e.currentTarget.style.borderColor = a.color + '44'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#111827'; e.currentTarget.style.borderColor = a.color + '22'; }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{a.label}</div>
            <div style={{ fontSize: 11, color: a.color, marginTop: 4, fontWeight: 500 }}>Click to open →</div>
          </div>
        ))}
      </div>
      {client.notes && (
        <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8a9bc5', marginBottom: 8 }}>Client Notes</div>
          <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.6 }}>{client.notes}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { display: 'flex', gap: 0, height: 'calc(100vh - 100px)', margin: '-24px', animation: 'fadeIn 0.4s ease' },
  sidebar: { width: 260, background: '#090e1c', borderRight: '1px solid #1a2540', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' },
  clientHeader: { padding: '18px 16px 14px', borderBottom: '1px solid #1a2540' },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#4a5878', fontSize: 12, cursor: 'pointer', marginBottom: 14, padding: 0 },
  clientBadge: { display: 'flex', alignItems: 'center', gap: 12 },
  clientInitials: { width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 },
  clientName: { fontSize: 14, fontWeight: 700, color: '#f0f4ff' },
  clientIndustry: { fontSize: 11, color: '#4a5878', marginTop: 1 },
  regionTag: { background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 6, padding: '2px 8px', color: '#22d3ee', fontSize: 10, fontFamily: 'monospace' },
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
