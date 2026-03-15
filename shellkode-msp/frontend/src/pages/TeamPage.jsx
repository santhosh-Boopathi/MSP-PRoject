import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';

const TEAM_MEMBERS = [
  { name: 'Subha', fullName: 'Subhasubalakshmi S', email: 'subhasubalakshmi.s@shellkode.com', phone: '9043173878', role: 'Cloud Engineer', initials: 'SU', color: '#3b82f6' },
  { name: 'Raghul', fullName: 'Raghul Sasikumar', email: 'raghul.sasikumar@shellkode.com', phone: '7904350313', role: 'Cloud Engineer', initials: 'RA', color: '#8b5cf6' },
  { name: 'Santhosh', fullName: 'Santhosh B', email: 'santhosh.b@shellkode.com', phone: '8526407704', role: 'Cloud Engineer', initials: 'SA', color: '#10b981' },
  { name: 'Bhavesh', fullName: 'Bhavesh K', email: 'bhavesh.k@shellkode.com', phone: '8890569447', role: 'Cloud Engineer', initials: 'BH', color: '#f59e0b' },
  { name: 'Surya', fullName: 'Surya Krishna', email: 'surya.krishna@shellkode.com', phone: '7013195007', role: 'Cloud Engineer', initials: 'SK', color: '#06b6d4' },
  { name: 'Gokul', fullName: 'Gokul A', email: 'gokul.a@shellkode.com', phone: '8838390568', role: 'Cloud Engineer', initials: 'GO', color: '#ef4444' },
  { name: 'Arunachalam', fullName: 'Arunachalam G', email: 'arunachalam.g@shellkode.com', phone: '6381220655', role: 'Cloud Engineer', initials: 'AR', color: '#f97316' },
  { name: 'Hemanath', fullName: 'Hemanath U', email: 'hemanath.u@shellkode.com', phone: '7448787737', role: 'Cloud Engineer', initials: 'HE', color: '#ec4899' },
  { name: 'Lavanya', fullName: 'Lavanya K', email: 'lavanya.k@shellkode.com', phone: '9344933152', role: 'Cloud Engineer', initials: 'LA', color: '#14b8a6' },
  { name: 'Pradeep', fullName: 'Pradeep P', email: 'pradeep.p@shellkode.com', phone: '9186838466', role: 'Cloud Engineer', initials: 'PR', color: '#6366f1' },
  { name: 'Hari', fullName: 'Hari Prasath J', email: 'hariprasath.j@shellkode.com', phone: '7806808943', role: 'Cloud Engineer', initials: 'HP', color: '#84cc16' },
];

export default function TeamPage() {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [selected, setSelected] = useState(null);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.teamBadge}>Team A</div>
          <div>
            <h1 style={styles.title}>
              <span style={{ color: '#3b82f6' }}>⚡</span> Cronos
            </h1>
            <p style={styles.subtitle}>AWS Managed Services Team · 11 Engineers · 12 Active Clients</p>
          </div>
        </div>
        <button style={styles.viewClientsBtn} onClick={() => navigate('/msp/cronos/clients')}>
          View All Clients
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>

      {/* Team stats bar */}
      <div style={styles.statsBar}>
        {[
          { label: 'Total Engineers', value: 11, color: '#3b82f6' },
          { label: 'Managed Clients', value: 12, color: '#10b981' },
          { label: 'Open Tickets', value: 23, color: '#f59e0b' },
          { label: 'Avg Response Time', value: '2.4h', color: '#8b5cf6' },
          { label: 'SLA Compliance', value: '97%', color: '#10b981' },
        ].map((s, i) => (
          <div key={i} style={styles.statItem}>
            <div style={{ ...styles.statVal, color: s.color }}>{s.value}</div>
            <div style={styles.statLbl}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Members grid */}
      <h2 style={styles.sectionTitle}>Team Members</h2>
      <div style={styles.membersGrid}>
        {TEAM_MEMBERS.map((m, i) => (
          <div
            key={i}
            style={{ ...styles.memberCard, ...(selected?.email === m.email ? styles.memberCardSelected : {}) }}
            onClick={() => setSelected(selected?.email === m.email ? null : m)}
          >
            <div style={{ ...styles.memberAvatar, background: m.color + '22', border: `2px solid ${m.color}44` }}>
              <span style={{ color: m.color, fontWeight: 700, fontSize: 16 }}>{m.initials}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.memberName}>{m.fullName}</div>
              <div style={styles.memberRole}>{m.role}</div>
              <div style={styles.memberEmail}>{m.email}</div>
            </div>
            <div style={styles.memberPhone}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4a5878" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.67 3.41 2 2 0 0 1 3.67 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              {m.phone}
            </div>
          </div>
        ))}
      </div>

      {/* Selected member detail */}
      {selected && (
        <div style={styles.memberDetail}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{ ...styles.memberAvatarLg, background: selected.color + '22', border: `2px solid ${selected.color}44` }}>
              <span style={{ color: selected.color, fontWeight: 700, fontSize: 24 }}>{selected.initials}</span>
            </div>
            <div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: '#f0f4ff' }}>{selected.fullName}</h3>
              <p style={{ color: '#64748b', fontSize: 14 }}>{selected.role} · Team Cronos</p>
            </div>
          </div>
          <div style={styles.detailGrid}>
            {[
              { label: 'Email', value: selected.email, icon: '📧' },
              { label: 'Phone', value: selected.phone, icon: '📱' },
              { label: 'Team', value: 'Cronos (Team A)', icon: '⚡' },
              { label: 'Status', value: 'Active', icon: '✅' },
            ].map((d, i) => (
              <div key={i} style={styles.detailItem}>
                <span style={styles.detailIcon}>{d.icon}</span>
                <div>
                  <div style={{ color: '#4a5878', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{d.label}</div>
                  <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 2, fontFamily: d.label === 'Email' ? 'monospace' : 'inherit' }}>{d.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clients section preview */}
      <div style={styles.clientsPreview}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={styles.sectionTitle}>Assigned Clients</h2>
          <button style={styles.viewClientsBtn} onClick={() => navigate('/msp/cronos/clients')}>
            Manage All Clients →
          </button>
        </div>
        <div style={styles.clientTags}>
          {['PAYNEARBY', 'VANAN SERVICES', 'NARAYANA NETHRALAYA', 'BOTREE', 'FINNEVA', 'LUCAS TVS', '5C NETWORK', 'UWC', 'BIOVUS', 'ZETAPP', 'GRAYQUEST', 'SBFC'].map((c, i) => (
            <div key={i} style={styles.clientTag} onClick={() => navigate('/msp/cronos/clients')}>
              {c}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { animation: 'fadeIn 0.4s ease', maxWidth: 1400 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
  teamBadge: { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '1px', flexShrink: 0 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 },
  subtitle: { color: '#64748b', fontSize: 14 },
  viewClientsBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  statsBar: { display: 'flex', gap: 0, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, marginBottom: 28, overflow: 'hidden' },
  statItem: { flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid #1e2d47' },
  statVal: { fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800 },
  statLbl: { color: '#4a5878', fontSize: 11, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16 },
  membersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 24 },
  memberCard: { display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' },
  memberCardSelected: { border: '1px solid rgba(59,130,246,0.4)', background: 'rgba(59,130,246,0.06)' },
  memberAvatar: { width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberAvatarLg: { width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  memberName: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 },
  memberRole: { fontSize: 12, color: '#4a5878', marginBottom: 2 },
  memberEmail: { fontSize: 11, color: '#3b5280', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 },
  memberPhone: { display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12, fontFamily: 'monospace', flexShrink: 0 },
  memberDetail: { background: '#111827', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16, padding: 24, marginBottom: 28, animation: 'fadeIn 0.3s ease' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
  detailItem: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  detailIcon: { fontSize: 18, marginTop: 2 },
  clientsPreview: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: 24 },
  clientTags: { display: 'flex', flexWrap: 'wrap', gap: 10 },
  clientTag: { background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '7px 14px', color: '#8a9bc5', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' },
};
