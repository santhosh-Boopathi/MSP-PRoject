import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MSPDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const stats = [
    { label: 'Managed Clients', value: '12', icon: '🏢', color: '#3b82f6', delta: '+2 this quarter' },
    { label: 'Team Engineers', value: '11', icon: '👥', color: '#10b981', delta: 'Team Cronos' },
    { label: 'AWS Accounts', value: '12', icon: '☁️', color: '#06b6d4', delta: 'ap-south-1 primary' },
    { label: 'Active Tickets', value: '23', icon: '🎫', color: '#f59e0b', delta: '5 urgent' },
    { label: 'Avg Security Score', value: '74', icon: '🛡️', color: '#8b5cf6', delta: '↑ 8pts this month' },
    { label: 'Monthly Savings', value: '$18K', icon: '💰', color: '#10b981', delta: 'Identified savings' },
  ];

  const recentActivity = [
    { time: '2h ago', icon: '🔍', text: 'Security audit completed for PAYNEARBY', type: 'audit' },
    { time: '4h ago', icon: '💰', text: 'Cost anomaly detected in 5C NETWORK — $450 spike on EC2', type: 'cost' },
    { time: '6h ago', icon: '🔒', text: 'SSL certificate renewed for FINNEVA (finneva.in)', type: 'ssl' },
    { time: '1d ago', icon: '🔧', text: 'Patching cycle completed — 14 EC2 instances updated', type: 'patch' },
    { time: '1d ago', icon: '📊', text: 'Monthly report generated for NARAYANA NETHRALAYA', type: 'report' },
    { time: '2d ago', icon: '⚡', text: 'AWS Compute Optimizer: $611/month savings identified for BOTREE', type: 'optimizer' },
  ];

  const typeColor = { audit: '#3b82f6', cost: '#f59e0b', ssl: '#10b981', patch: '#8b5cf6', report: '#06b6d4', optimizer: '#f97316' };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>MSP Operations Hub</h1>
          <p style={styles.subtitle}>Welcome back, {user?.name?.split(' ')[0]} — here's your operations overview</p>
        </div>
        <div style={styles.dateTag}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats grid */}
      <div style={styles.statsGrid}>
        {stats.map((s, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
                <div style={styles.statLabel}>{s.label}</div>
              </div>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
            </div>
            <div style={styles.statDelta}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* MSP Teams */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>MSP Teams</h2>
        <div style={styles.teamGrid}>
          <div style={styles.teamCard} onClick={() => navigate('/msp/cronos')}>
            <div style={styles.teamCardHeader}>
              <div style={styles.teamIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>
              <div style={styles.teamABadge}>Team A</div>
            </div>
            <h3 style={styles.teamName}>Cronos</h3>
            <p style={styles.teamDesc}>AWS Managed Services — 11 Engineers, 12 Active Clients</p>
            <div style={styles.teamStats}>
              <div style={styles.teamStat}><span style={{ color: '#3b82f6', fontWeight: 700 }}>12</span><span style={{ color: '#4a5878', fontSize: 11 }}>Clients</span></div>
              <div style={styles.teamStat}><span style={{ color: '#10b981', fontWeight: 700 }}>11</span><span style={{ color: '#4a5878', fontSize: 11 }}>Engineers</span></div>
              <div style={styles.teamStat}><span style={{ color: '#f59e0b', fontWeight: 700 }}>23</span><span style={{ color: '#4a5878', fontSize: 11 }}>Tickets</span></div>
            </div>
            <div style={styles.teamCta}>
              <span>View Team</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </div>

          {/* Placeholder for future teams */}
          {['Atlas', 'Helios'].map((name, i) => (
            <div key={i} style={{ ...styles.teamCard, opacity: 0.4, cursor: 'not-allowed' }}>
              <div style={styles.teamCardHeader}>
                <div style={{ ...styles.teamIcon, background: 'rgba(74,88,120,0.15)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4a5878" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                </div>
                <div style={{ ...styles.teamABadge, background: 'rgba(74,88,120,0.15)', color: '#4a5878', border: '1px solid #2a3a58' }}>Team {String.fromCharCode(66 + i)}</div>
              </div>
              <h3 style={{ ...styles.teamName, color: '#4a5878' }}>{name}</h3>
              <p style={{ ...styles.teamDesc, color: '#2a3a58' }}>Coming soon</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.activityList}>
          {recentActivity.map((a, i) => (
            <div key={i} style={styles.activityItem}>
              <div style={{ ...styles.activityDot, background: typeColor[a.type] || '#3b82f6' }} />
              <span style={styles.activityIcon}>{a.icon}</span>
              <span style={styles.activityText}>{a.text}</span>
              <span style={styles.activityTime}>{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { animation: 'fadeIn 0.4s ease', maxWidth: 1400 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 700, color: '#f0f4ff', letterSpacing: '-0.3px' },
  subtitle: { color: '#64748b', fontSize: 14, marginTop: 4 },
  dateTag: { background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, padding: '6px 14px', color: '#60a5fa', fontSize: 13 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 },
  statCard: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: '20px 20px 16px', transition: 'border-color 0.2s', cursor: 'default' },
  statValue: { fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 13, color: '#8a9bc5', marginTop: 6, fontWeight: 500 },
  statDelta: { fontSize: 11, color: '#4a5878', marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e2d47' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  teamGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  teamCard: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: 24, cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' },
  teamCardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  teamIcon: { width: 44, height: 44, background: 'rgba(59,130,246,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  teamABadge: { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600 },
  teamName: { fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 6 },
  teamDesc: { color: '#64748b', fontSize: 13, lineHeight: 1.5, marginBottom: 16 },
  teamStats: { display: 'flex', gap: 20, marginBottom: 18 },
  teamStat: { display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' },
  teamCta: { display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontSize: 13, fontWeight: 600 },
  activityList: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' },
  activityItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '1px solid #1a2540', transition: 'background 0.15s' },
  activityDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  activityIcon: { fontSize: 16, flexShrink: 0 },
  activityText: { flex: 1, color: '#94a3b8', fontSize: 13 },
  activityTime: { color: '#4a5878', fontSize: 11, whiteSpace: 'nowrap' },
};
