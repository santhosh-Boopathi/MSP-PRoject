import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

var ALL_PAGES = [
  { path: '/msp', label: 'MSP Overview' },
  { path: '/msp/cronos', label: 'Team Cronos' },
  { path: '/msp/cronos/clients', label: 'All Clients' },
];

export default function AppLayout() {
  var { user, logout } = useAuth();
  var navigate = useNavigate();
  var location = useLocation();
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [showProfile, setShowProfile] = useState(false);
  var [showSearch, setShowSearch] = useState(false);
  var [searchQuery, setSearchQuery] = useState('');
  var profileRef = useRef(null);

  var initials = user && user.name ? user.name.split(' ').map(function(n) { return n[0]; }).join('').slice(0,2).toUpperCase() : 'SK';

  // Close profile panel on outside click
  useEffect(function() {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  var navItems = [
    { icon: GridIcon, label: 'MSP Overview', path: '/msp' },
    { icon: TeamIcon, label: 'Team Cronos', path: '/msp/cronos' },
    { icon: ClientsIcon, label: 'Clients', path: '/msp/cronos/clients' },
  ];

  var isActive = function(path) {
    if (path === '/msp' && location.pathname === '/msp') return true;
    if (path !== '/msp' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Build breadcrumbs from path
  var segments = location.pathname.split('/').filter(Boolean);
  var breadcrumbs = segments.map(function(seg, i) {
    var fullPath = '/' + segments.slice(0, i + 1).join('/');
    var label = seg === 'cronos' ? 'Team Cronos' : seg === 'msp' ? 'MSP' : seg === 'clients' ? 'Clients' : seg.length === 24 ? '...' : seg.charAt(0).toUpperCase() + seg.slice(1);
    return { label: label, path: fullPath };
  });

  // Get current section name for title
  var currentSection = segments[segments.length - 1];
  var sectionLabels = { security: 'Security Audit', cost: 'Cost Optimization', inventory: 'Inventory', optimizer: 'Compute Optimizer', patching: 'EC2 Patching', ssl: 'SSL & Domain & RI', freshdesk: 'FreshDesk Tickets', reports: 'Monthly Reports', overview: 'Overview' };
  var pageTitle = sectionLabels[currentSection] || '';

  var teamMembers = [
    { name: 'Subhasubalakshmi S', email: 'subhasubalakshmi.s@shellkode.com', phone: '9043173878', initials: 'SU', color: '#3b82f6' },
    { name: 'Raghul Sasikumar', email: 'raghul.sasikumar@shellkode.com', phone: '7904350313', initials: 'RA', color: '#8b5cf6' },
    { name: 'Santhosh B', email: 'santhosh.b@shellkode.com', phone: '8526407704', initials: 'SA', color: '#10b981' },
    { name: 'Bhavesh K', email: 'bhavesh.k@shellkode.com', phone: '8890569447', initials: 'BH', color: '#f59e0b' },
    { name: 'Surya Krishna', email: 'surya.krishna@shellkode.com', phone: '7013195007', initials: 'SK', color: '#06b6d4' },
    { name: 'Gokul A', email: 'gokul.a@shellkode.com', phone: '8838390568', initials: 'GO', color: '#ef4444' },
    { name: 'Arunachalam G', email: 'arunachalam.g@shellkode.com', phone: '6381220655', initials: 'AR', color: '#f97316' },
    { name: 'Hemanath U', email: 'hemanath.u@shellkode.com', phone: '7448787737', initials: 'HE', color: '#ec4899' },
    { name: 'Lavanya K', email: 'lavanya.k@shellkode.com', phone: '9344933152', initials: 'LA', color: '#14b8a6' },
    { name: 'Pradeep P', email: 'pradeep.p@shellkode.com', phone: '9186838466', initials: 'PR', color: '#6366f1' },
    { name: 'Hari Prasath J', email: 'hariprasath.j@shellkode.com', phone: '7806808943', initials: 'HP', color: '#84cc16' },
  ];

  var currentMember = teamMembers.find(function(m) { return user && m.email === user.email; }) || teamMembers[2];

  return (
    <div style={st.container}>
      {/* Sidebar */}
      <div style={{ ...st.sidebar, width: sidebarOpen ? 240 : 64 }}>
        {/* Logo */}
        <div style={st.logoArea}>
          <div style={st.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="url(#lg1)"/>
              <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 30L20 24L26 30L32 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="lg1" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
            </svg>
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={st.logoText}>ShellKode</div>
              <div style={st.logoSub}>MSP Portal</div>
            </div>
          )}
          <button onClick={function() { setSidebarOpen(!sidebarOpen); }} style={st.collapseBtn}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav style={st.nav}>
          {navItems.map(function(item) {
            var Icon = item.icon;
            var active = isActive(item.path);
            return (
              <button key={item.path} onClick={function() { navigate(item.path); }} title={!sidebarOpen ? item.label : ''}
                style={{ ...st.navItem, ...(active ? st.navItemActive : {}) }}>
                <Icon size={18} color={active ? '#3b82f6' : '#4a5878'} />
                {sidebarOpen && <span style={{ ...st.navLabel, color: active ? '#f0f4ff' : '#8a9bc5' }}>{item.label}</span>}
                {active && <div style={st.navIndicator} />}
              </button>
            );
          })}
        </nav>

        {/* Quick links at bottom of sidebar */}
        {sidebarOpen && (
          <div style={st.sidebarBottom}>
            <div style={st.sidebarBottomTitle}>QUICK LINKS</div>
            {[
              { label: 'Add Client', icon: '➕', action: function() { navigate('/msp/cronos/clients'); } },
              { label: 'FreshDesk', icon: '🎫', action: function() { window.open('https://shellkode.freshdesk.com', '_blank'); } },
              { label: 'AWS Console', icon: '☁️', action: function() { window.open('https://console.aws.amazon.com', '_blank'); } },
            ].map(function(l, i) {
              return (
                <button key={i} onClick={l.action} style={st.quickLink}>
                  <span style={{ fontSize: 14 }}>{l.icon}</span>
                  <span style={{ color: '#4a5878', fontSize: 12 }}>{l.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* User area */}
        <div style={st.userArea} ref={profileRef}>
          <button onClick={function() { setShowProfile(!showProfile); }} style={st.userBtn} title="View Profile">
            <div style={{ ...st.avatar, background: currentMember.color }}>
              {initials}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div style={st.userName}>{user ? user.name.split(' ')[0] : 'User'}</div>
                <div style={st.userEmail}>{user ? user.email.split('@')[0] : ''}</div>
              </div>
            )}
            {sidebarOpen && <span style={{ color: '#4a5878', fontSize: 10 }}>▲</span>}
          </button>

          {/* Profile popup */}
          {showProfile && (
            <div style={st.profilePopup}>
              {/* Header */}
              <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1a2540' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: currentMember.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>{currentMember.name}</div>
                    <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>● Cloud Engineer · Team Cronos</div>
                  </div>
                </div>
                {[
                  { icon: '📧', label: currentMember.email },
                  { icon: '📱', label: currentMember.phone },
                  { icon: '🏢', label: 'ShellKode Technologies' },
                  { icon: '⚡', label: 'Team Cronos (Team A)' },
                  { icon: '📅', label: 'Last login: ' + new Date().toLocaleDateString('en-IN') },
                ].map(function(d, i) {
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <span style={{ fontSize: 13, width: 20, flexShrink: 0 }}>{d.icon}</span>
                      <span style={{ color: '#8a9bc5', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Assigned clients count */}
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #1a2540' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {[{ label: 'Clients', value: 12, color: '#3b82f6' }, { label: 'Open Tickets', value: 23, color: '#f59e0b' }, { label: 'Resolved', value: 89, color: '#10b981' }].map(function(s, i) {
                    return (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: '#4a5878' }}>{s.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '8px' }}>
                <button onClick={function() { navigate('/msp/cronos'); setShowProfile(false); }} style={st.profileAction}>
                  👥 View Team Members
                </button>
                <button onClick={function() { navigate('/msp/cronos/clients'); setShowProfile(false); }} style={st.profileAction}>
                  🏢 Manage Clients
                </button>
                <button onClick={function() { logout(); }} style={{ ...st.profileAction, color: '#f87171', borderTop: '1px solid #1a2540', marginTop: 4 }}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={st.main}>
        {/* Top bar */}
        <div style={st.topBar}>
          {/* Breadcrumb with back button */}
          <div style={st.breadcrumbWrap}>
            {segments.length > 1 && (
              <button onClick={function() { navigate(-1); }} style={st.backBtn} title="Go back">
                ←
              </button>
            )}
            <div style={st.breadcrumb}>
              {breadcrumbs.map(function(b, i) {
                var isLast = i === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: '#2a3a58', margin: '0 5px', fontSize: 12 }}>/</span>}
                    <button onClick={function() { if (!isLast) navigate(b.path); }} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#f0f4ff' : '#4a5878', fontSize: 13, padding: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                      {b.label}
                    </button>
                  </React.Fragment>
                );
              })}
              {pageTitle && <span style={{ color: '#3b82f6', fontSize: 13, marginLeft: 5 }}>· {pageTitle}</span>}
            </div>
          </div>

          <div style={st.topBarRight}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <button onClick={function() { setShowSearch(!showSearch); }} style={st.iconBtn} title="Search">
                🔍
              </button>
              {showSearch && (
                <div style={st.searchDrop}>
                  <input autoFocus value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }}
                    placeholder="Search clients, sections..."
                    style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: '#f0f4ff', fontSize: 14, outline: 'none' }}
                    onKeyDown={function(e) {
                      if (e.key === 'Enter' && searchQuery) {
                        navigate('/msp/cronos/clients');
                        setShowSearch(false); setSearchQuery('');
                      }
                      if (e.key === 'Escape') setShowSearch(false);
                    }}
                  />
                  <div style={{ padding: '0 14px 10px', color: '#4a5878', fontSize: 11 }}>Press Enter to search clients · Esc to close</div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button style={{ ...st.iconBtn, position: 'relative' }} title="Alerts">
              🔔
              <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid #090e1c' }} />
            </button>

            {/* Status badge */}
            <div style={st.topBadge}>
              <div style={st.pulse} />
              <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>CRONOS ACTIVE</span>
            </div>

            {/* Time */}
            <div style={{ color: '#4a5878', fontSize: 12, fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Avatar */}
            <button onClick={function() { setShowProfile(!showProfile); }} style={{ ...st.topAvatar, background: currentMember.color }}>
              {initials}
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={st.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function GridIcon(p) { return <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function TeamIcon(p) { return <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ClientsIcon(p) { return <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>; }

var st = {
  container: { display: 'flex', height: '100vh', background: '#080c18', overflow: 'hidden' },
  sidebar: { display: 'flex', flexDirection: 'column', background: '#090e1c', borderRight: '1px solid #1a2540', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, position: 'relative', zIndex: 10 },
  logoArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '16px 14px', borderBottom: '1px solid #1a2540', minHeight: 60 },
  logoIcon: { width: 34, height: 34, flexShrink: 0 },
  logoText: { fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: '#f0f4ff', whiteSpace: 'nowrap' },
  logoSub: { fontSize: 9, color: '#4a5878', letterSpacing: '1px', textTransform: 'uppercase', marginTop: 1 },
  collapseBtn: { background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', padding: 4, fontSize: 10, flexShrink: 0 },
  nav: { flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 3 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative', transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' },
  navItemActive: { background: 'rgba(59,130,246,0.1)' },
  navLabel: { fontSize: 13, fontWeight: 500, fontFamily: "'Space Grotesk', sans-serif" },
  navIndicator: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, background: '#3b82f6', borderRadius: '0 3px 3px 0' },
  sidebarBottom: { padding: '10px 8px', borderTop: '1px solid #1a2540' },
  sidebarBottomTitle: { color: '#2a3a58', fontSize: 9, fontWeight: 700, letterSpacing: '1px', padding: '0 12px 6px' },
  quickLink: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8, transition: 'background 0.15s' },
  userArea: { borderTop: '1px solid #1a2540', position: 'relative' },
  userBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', background: 'none', border: 'none', cursor: 'pointer', width: '100%' },
  avatar: { width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 11, color: '#4a5878', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  profilePopup: { position: 'absolute', bottom: '100%', left: 8, right: 8, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, boxShadow: '0 -16px 48px rgba(0,0,0,0.5)', zIndex: 100, animation: 'fadeIn 0.2s ease' },
  profileAction: { display: 'block', width: '100%', padding: '9px 12px', background: 'none', border: 'none', color: '#8a9bc5', fontSize: 13, cursor: 'pointer', textAlign: 'left', borderRadius: 8, transition: 'background 0.15s', fontFamily: "'Space Grotesk', sans-serif" },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 50, borderBottom: '1px solid #1a2540', background: '#090e1c', flexShrink: 0 },
  breadcrumbWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  backBtn: { background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 7, color: '#8a9bc5', cursor: 'pointer', padding: '4px 10px', fontSize: 14, display: 'flex', alignItems: 'center' },
  breadcrumb: { display: 'flex', alignItems: 'center' },
  topBarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '4px 6px', borderRadius: 8, position: 'relative' },
  searchDrop: { position: 'absolute', top: '100%', right: 0, width: 300, background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 100, marginTop: 8 },
  topBadge: { display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 10px' },
  pulse: { width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' },
  topAvatar: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer' },
  content: { flex: 1, overflow: 'auto', padding: '20px 24px' },
};
