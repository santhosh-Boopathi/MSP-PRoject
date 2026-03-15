import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

var TEAM_MEMBERS = [
  { name: 'Subhasubalakshmi S', email: 'subhasubalakshmi.s@shellkode.com', phone: '9043173878', color: '#3b82f6' },
  { name: 'Raghul Sasikumar', email: 'raghul.sasikumar@shellkode.com', phone: '7904350313', color: '#8b5cf6' },
  { name: 'Santhosh B', email: 'santhosh.b@shellkode.com', phone: '8526407704', color: '#10b981' },
  { name: 'Bhavesh K', email: 'bhavesh.k@shellkode.com', phone: '8890569447', color: '#f59e0b' },
  { name: 'Surya Krishna', email: 'surya.krishna@shellkode.com', phone: '7013195007', color: '#06b6d4' },
  { name: 'Gokul A', email: 'gokul.a@shellkode.com', phone: '8838390568', color: '#ef4444' },
  { name: 'Arunachalam G', email: 'arunachalam.g@shellkode.com', phone: '6381220655', color: '#f97316' },
  { name: 'Hemanath U', email: 'hemanath.u@shellkode.com', phone: '7448787737', color: '#ec4899' },
  { name: 'Lavanya K', email: 'lavanya.k@shellkode.com', phone: '9344933152', color: '#14b8a6' },
  { name: 'Pradeep P', email: 'pradeep.p@shellkode.com', phone: '9186838466', color: '#6366f1' },
  { name: 'Hari Prasath J', email: 'hariprasath.j@shellkode.com', phone: '7806808943', color: '#84cc16' },
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

  var initials = user && user.name ? user.name.split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase() : 'SK';
  var currentMember = TEAM_MEMBERS.find(function(m) { return user && m.email === user.email; }) || TEAM_MEMBERS[2];

  useEffect(function() {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
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
    if (path === '/msp' && (location.pathname === '/msp' || location.pathname === '/')) return true;
    if (path !== '/msp' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Build breadcrumbs
  var segments = location.pathname.split('/').filter(Boolean);
  var breadcrumbs = [{ label: 'MSP', path: '/msp' }];
  if (segments.includes('cronos')) breadcrumbs.push({ label: 'Team Cronos', path: '/msp/cronos' });
  if (segments.includes('clients') && !segments.find(function(s) { return s.length === 24; })) breadcrumbs.push({ label: 'Clients', path: '/msp/cronos/clients' });
  if (segments.find(function(s) { return s.length === 24; })) breadcrumbs.push({ label: 'Client', path: '#' });

  var sectionMap = { security: '🛡️ Security Audit', cost: '💰 Cost Optimization', inventory: '📦 Inventory', optimizer: '⚡ Compute Optimizer', patching: '🔧 EC2 Patching', ssl: '🔒 SSL & Domain & RI', freshdesk: '🎫 FreshDesk Tickets', reports: '📄 Monthly Reports', overview: '📊 Overview' };
  var lastSeg = segments[segments.length - 1];
  var sectionTitle = sectionMap[lastSeg] || '';

  return (
    <div style={st.container}>
      {/* Sidebar */}
      <div style={{ ...st.sidebar, width: sidebarOpen ? 230 : 58 }}>
        <div style={st.logoArea}>
          <div style={st.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="url(#lgg)"/>
              <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 30L20 24L26 30L32 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="lgg" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
            </svg>
          </div>
          {sidebarOpen && (
            <div style={{ flex: 1 }}>
              <div style={st.logoText}>ShellKode</div>
              <div style={st.logoSub}>MSP Portal</div>
            </div>
          )}
          <button onClick={function() { setSidebarOpen(!sidebarOpen); }} style={st.collapseBtn}>{sidebarOpen ? '◀' : '▶'}</button>
        </div>

        <nav style={st.nav}>
          {navItems.map(function(item) {
            var Icon = item.icon;
            var active = isActive(item.path);
            return (
              <button key={item.path} onClick={function() { navigate(item.path); }} title={!sidebarOpen ? item.label : ''}
                style={{ ...st.navItem, ...(active ? st.navActive : {}) }}>
                <Icon size={17} color={active ? '#3b82f6' : '#4a5878'} />
                {sidebarOpen && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#f0f4ff' : '#8a9bc5' }}>{item.label}</span>}
                {active && <div style={st.navDot} />}
              </button>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div style={{ padding: '8px', borderTop: '1px solid #1a2540' }}>
            <div style={{ color: '#2a3a58', fontSize: 9, fontWeight: 700, letterSpacing: '1px', padding: '0 10px 6px' }}>QUICK ACCESS</div>
            {[
              { label: 'FreshDesk', icon: '🎫', fn: function() { window.open('https://shellkode.freshdesk.com', '_blank'); } },
              { label: 'AWS Console', icon: '☁️', fn: function() { window.open('https://console.aws.amazon.com', '_blank'); } },
            ].map(function(l, i) {
              return (
                <button key={i} onClick={l.fn} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 8 }}>
                  <span style={{ fontSize: 13 }}>{l.icon}</span>
                  <span style={{ color: '#4a5878', fontSize: 12 }}>{l.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom user area - just shows avatar, profile popup goes to top-right */}
        <div style={{ ...st.userArea, padding: sidebarOpen ? '10px 12px' : '10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...st.avatar, background: currentMember.color, flexShrink: 0 }}>{initials}</div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? user.name.split(' ')[0] : 'User'}</div>
                <div style={{ fontSize: 10, color: '#4a5878', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Cloud Engineer · Cronos</div>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5878', fontSize: 14, padding: 4, flexShrink: 0 }}>→</button>
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={st.main}>
        {/* Top bar */}
        <div style={st.topBar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {segments.length > 1 && (
              <button onClick={function() { navigate(-1); }} style={st.backBtn} title="Go back">← Back</button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              {breadcrumbs.map(function(b, i) {
                var isLast = i === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: '#2a3a58' }}>/</span>}
                    <button onClick={function() { if (!isLast && b.path !== '#') navigate(b.path); }}
                      style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#94a3b8' : '#4a5878', padding: '0 2px', fontFamily: "'Space Grotesk',sans-serif", fontSize: 13 }}>
                      {b.label}
                    </button>
                  </React.Fragment>
                );
              })}
              {sectionTitle && <><span style={{ color: '#2a3a58' }}>/</span><span style={{ color: '#3b82f6', fontSize: 13 }}>{sectionTitle}</span></>}
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <button onClick={function() { setShowSearch(!showSearch); setSearchQuery(''); }} style={st.iconBtn} title="Search">🔍</button>
              {showSearch && (
                <div style={{ position: 'absolute', top: '130%', right: 0, width: 280, background: '#111827', border: '1px solid #1e2d47', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 200 }}>
                  <input autoFocus value={searchQuery} onChange={function(e) { setSearchQuery(e.target.value); }}
                    placeholder="Search clients..."
                    style={{ width: '100%', padding: '11px 14px', background: 'transparent', border: 'none', color: '#f0f4ff', fontSize: 13, outline: 'none' }}
                    onKeyDown={function(e) { if (e.key === 'Enter') { navigate('/msp/cronos/clients'); setShowSearch(false); } if (e.key === 'Escape') setShowSearch(false); }} />
                  <div style={{ padding: '0 14px 10px', color: '#4a5878', fontSize: 11 }}>Enter to search · Esc to close</div>
                </div>
              )}
            </div>

            <button style={{ ...st.iconBtn, position: 'relative' }} title="Alerts">
              🔔<span style={{ position: 'absolute', top: 1, right: 1, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid #090e1c' }} />
            </button>

            <div style={st.badge}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>CRONOS</span>
            </div>

            <div style={{ color: '#4a5878', fontSize: 12, fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Profile avatar - TOP RIGHT, popup appears below */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={function() { setShowProfile(!showProfile); }}
                style={{ ...st.topAvatar, background: currentMember.color, border: showProfile ? '2px solid ' + currentMember.color : '2px solid transparent' }}>
                {initials}
              </button>

              {/* Profile popup - anchored to TOP-RIGHT avatar */}
              {showProfile && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 300, background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', zIndex: 500, animation: 'fadeIn 0.2s ease', overflow: 'hidden' }}>
                  {/* Profile header */}
                  <div style={{ padding: '18px 18px 14px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.05))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: currentMember.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 15 }}>{currentMember.name}</div>
                        <div style={{ color: '#10b981', fontSize: 11, fontWeight: 600, marginTop: 2 }}>● Cloud Engineer · Team Cronos</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {[{ icon: '📧', val: currentMember.email }, { icon: '📱', val: currentMember.phone }, { icon: '🏢', val: 'ShellKode Technologies' }, { icon: '📅', val: 'Last login: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }].map(function(d, i) {
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, width: 18 }}>{d.icon}</span>
                            <span style={{ color: '#8a9bc5', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #1a2540' }}>
                    {[{ l: 'Clients', v: 12, c: '#3b82f6' }, { l: 'Open', v: 23, c: '#f59e0b' }, { l: 'Resolved', v: 89, c: '#10b981' }].map(function(s, i) {
                      return (
                        <div key={i} style={{ padding: '12px', textAlign: 'center', borderRight: i < 2 ? '1px solid #1a2540' : 'none' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                          <div style={{ fontSize: 10, color: '#4a5878', marginTop: 2 }}>{s.l}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div style={{ padding: '8px' }}>
                    {[
                      { label: '👥 View Team Members', fn: function() { navigate('/msp/cronos'); setShowProfile(false); } },
                      { label: '🏢 Manage Clients', fn: function() { navigate('/msp/cronos/clients'); setShowProfile(false); } },
                      { label: '⚙️ Settings', fn: function() { setShowProfile(false); } },
                    ].map(function(a, i) {
                      return <button key={i} onClick={a.fn} style={{ display: 'block', width: '100%', padding: '9px 12px', background: 'none', border: 'none', color: '#8a9bc5', fontSize: 13, cursor: 'pointer', textAlign: 'left', borderRadius: 8, fontFamily: "'Space Grotesk',sans-serif" }}>{a.label}</button>;
                    })}
                    <button onClick={logout} style={{ display: 'block', width: '100%', padding: '9px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, color: '#f87171', fontSize: 13, cursor: 'pointer', textAlign: 'left', fontFamily: "'Space Grotesk',sans-serif", marginTop: 4 }}>
                      🚪 Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={st.content}><Outlet /></div>
      </div>
    </div>
  );
}

function GridIcon(p) { return <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function TeamIcon(p) { return <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function ClientsIcon(p) { return <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>; }

var st = {
  container: { display: 'flex', height: '100vh', background: '#080c18', overflow: 'hidden' },
  sidebar: { display: 'flex', flexDirection: 'column', background: '#090e1c', borderRight: '1px solid #1a2540', transition: 'width 0.25s ease', overflow: 'hidden', flexShrink: 0, zIndex: 10 },
  logoArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 12px', borderBottom: '1px solid #1a2540', minHeight: 56 },
  logoIcon: { width: 30, height: 30, flexShrink: 0 },
  logoText: { fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: '#f0f4ff', whiteSpace: 'nowrap' },
  logoSub: { fontSize: 9, color: '#4a5878', letterSpacing: '1px', textTransform: 'uppercase' },
  collapseBtn: { background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', padding: 4, fontSize: 10, flexShrink: 0 },
  nav: { flex: 1, padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: 3 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative', transition: 'background 0.15s', whiteSpace: 'nowrap', overflow: 'hidden' },
  navActive: { background: 'rgba(59,130,246,0.1)' },
  navDot: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 18, background: '#3b82f6', borderRadius: '0 3px 3px 0' },
  userArea: { borderTop: '1px solid #1a2540' },
  avatar: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 48, borderBottom: '1px solid #1a2540', background: '#090e1c', flexShrink: 0 },
  backBtn: { padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 7, color: '#8a9bc5', cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif" },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '3px 5px', borderRadius: 7, position: 'relative' },
  badge: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '3px 10px' },
  topAvatar: { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', transition: 'border 0.2s' },
  content: { flex: 1, overflow: 'auto', padding: '18px 22px' },
};
