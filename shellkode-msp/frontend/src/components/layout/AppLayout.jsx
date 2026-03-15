import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SK';

  const navItems = [
    { icon: GridIcon, label: 'MSP Overview', path: '/msp' },
    { icon: TeamIcon, label: 'Team Cronos', path: '/msp/cronos' },
    { icon: ClientsIcon, label: 'Clients', path: '/msp/cronos/clients' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 64 }}>
        {/* Logo */}
        <div style={styles.logoArea}>
          <div style={styles.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="url(#sblg)"/>
              <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 30L20 24L26 30L32 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="sblg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
            </svg>
          </div>
          {sidebarOpen && (
            <div>
              <div style={styles.logoText}>ShellKode</div>
              <div style={styles.logoSub}>MSP Portal</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.collapseBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarOpen ? <path d="M15 18l-6-6 6-6"/> : <path d="M9 18l6-6-6-6"/>}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={!sidebarOpen ? item.label : ''}
                style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}
              >
                <Icon size={18} color={active ? '#3b82f6' : '#4a5878'} />
                {sidebarOpen && <span style={{ ...styles.navLabel, color: active ? '#f0f4ff' : '#8a9bc5' }}>{item.label}</span>}
                {active && <div style={styles.navIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* User area */}
        <div style={styles.userArea}>
          <div style={styles.avatar}>{initials}</div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userName}>{user?.name?.split(' ')[0]}</div>
              <div style={styles.userEmail}>{user?.email?.split('@')[0]}</div>
            </div>
          )}
          {sidebarOpen && (
            <button onClick={logout} style={styles.logoutBtn} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5878" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={styles.main}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.breadcrumb}>
            {location.pathname.split('/').filter(Boolean).map((seg, i, arr) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ color: '#2a3a58', margin: '0 6px' }}>/</span>}
                <span style={{ color: i === arr.length - 1 ? '#f0f4ff' : '#4a5878', fontSize: 13, textTransform: 'capitalize' }}>
                  {seg === 'cronos' ? 'Team Cronos' : seg}
                </span>
              </React.Fragment>
            ))}
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.topBadge}>
              <div style={styles.pulse} />
              <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>CRONOS ACTIVE</span>
            </div>
            <div style={styles.topAvatar}>{initials}</div>
          </div>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

const GridIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const TeamIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const ClientsIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9,22 9,12 15,12 15,22"/>
  </svg>
);

const styles = {
  container: { display: 'flex', height: '100vh', background: '#080c18', overflow: 'hidden' },
  sidebar: { display: 'flex', flexDirection: 'column', background: '#090e1c', borderRight: '1px solid #1a2540', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 10 },
  logoArea: { display: 'flex', alignItems: 'center', gap: 12, padding: '20px 16px 18px', borderBottom: '1px solid #1a2540', minHeight: 64 },
  logoIcon: { width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: '#f0f4ff', whiteSpace: 'nowrap' },
  logoSub: { fontSize: 10, color: '#4a5878', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 1 },
  collapseBtn: { marginLeft: 'auto', background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', padding: 6, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative', transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' },
  navItemActive: { background: 'rgba(59,130,246,0.1)' },
  navLabel: { fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif" },
  navIndicator: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#3b82f6', borderRadius: '0 3px 3px 0' },
  userArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', borderTop: '1px solid #1a2540', minHeight: 64 },
  avatar: { width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 11, color: '#4a5878', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0 },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 52, borderBottom: '1px solid #1a2540', background: '#090e1c', flexShrink: 0 },
  breadcrumb: { display: 'flex', alignItems: 'center' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 16 },
  topBadge: { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 12px' },
  pulse: { width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' },
  topAvatar: { width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' },
  content: { flex: 1, overflow: 'auto', padding: '24px' },
};
