import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

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

function timeAgo(date) {
  var d = Math.floor((Date.now() - new Date(date)) / 60000);
  if (d < 1) return 'just now';
  if (d < 60) return d + 'm ago';
  if (d < 1440) return Math.floor(d / 60) + 'h ago';
  return Math.floor(d / 1440) + 'd ago';
}

export default function AppLayout() {
  var { user, logout } = useAuth();
  var navigate = useNavigate();
  var location = useLocation();
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [showProfile, setShowProfile] = useState(false);
  var [showNotifications, setShowNotifications] = useState(false);
  var [notifications, setNotifications] = useState([]);
  var profileRef = useRef(null);
  var notifRef = useRef(null);

  var initials = user && user.name ? user.name.split(' ').map(function(n) { return n[0]; }).join('').slice(0, 2).toUpperCase() : 'SK';
  var currentMember = TEAM_MEMBERS.find(function(m) { return user && m.email === user.email; }) || TEAM_MEMBERS[2];

  // Fetch notifications (recent critical activities)
  useEffect(function() {
    api.get('/activity?limit=20')
      .then(function(r) {
        var notifs = (r.data || []).filter(function(a) { return a.severity === 'critical' || a.severity === 'warning'; }).slice(0, 8);
        setNotifications(notifs);
      }).catch(function() {});
  }, []);

  useEffect(function() {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handler);
    return function() { document.removeEventListener('mousedown', handler); };
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

  // Breadcrumbs
  var segs = location.pathname.split('/').filter(Boolean);
  var crumbs = [{ label: 'MSP', path: '/msp' }];
  if (segs.includes('cronos')) crumbs.push({ label: 'Team Cronos', path: '/msp/cronos' });
  if (segs.includes('clients') && !segs.find(function(s) { return s.length > 20; })) crumbs.push({ label: 'Clients', path: '/msp/cronos/clients' });
  if (segs.find(function(s) { return s.length > 20; })) crumbs.push({ label: 'Client', path: '#' });
  var sectionMap = { security: '🛡️ Security', cost: '💰 Cost', inventory: '📦 Inventory', optimizer: '⚡ Optimizer', patching: '🔧 Patching', ssl: '🔒 SSL & Expiry', freshdesk: '🎫 Tickets', reports: '📄 Reports', overview: '📊 Overview' };
  var lastSeg = segs[segs.length - 1];

  var unreadCount = notifications.length;

  return (
    <div style={st.container}>
      {/* Sidebar */}
      <div style={{ ...st.sidebar, width: sidebarOpen ? 228 : 56 }}>
        <div style={st.logoArea}>
          <div style={st.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="url(#lgg2)"/>
              <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 30L20 24L26 30L32 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <defs><linearGradient id="lgg2" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
            </svg>
          </div>
          {sidebarOpen && <div style={{ flex: 1 }}><div style={st.logoText}>ShellKode</div><div style={st.logoSub}>MSP Portal</div></div>}
          <button onClick={function() { setSidebarOpen(!sidebarOpen); }} style={st.collapseBtn}>{sidebarOpen ? '◀' : '▶'}</button>
        </div>

        <nav style={st.nav}>
          {navItems.map(function(item) {
            var Icon = item.icon; var active = isActive(item.path);
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
          <div style={{ padding: '8px 6px', borderTop: '1px solid #1a2540' }}>
            <div style={{ color: '#2a3a58', fontSize: 9, fontWeight: 700, letterSpacing: '1px', padding: '0 8px 5px' }}>QUICK LINKS</div>
            {[{ l: 'FreshDesk', i: '🎫', u: 'https://shellkode.freshdesk.com' }, { l: 'AWS Console', i: '☁️', u: 'https://console.aws.amazon.com' }].map(function(l, i) {
              return <button key={i} onClick={function() { window.open(l.u, '_blank'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 7 }}><span style={{ fontSize: 13 }}>{l.i}</span><span style={{ color: '#4a5878', fontSize: 12 }}>{l.l}</span></button>;
            })}
          </div>
        )}

        {/* User area at bottom */}
        <div style={{ borderTop: '1px solid #1a2540', padding: sidebarOpen ? '10px 10px' : '10px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ ...st.avatar, background: currentMember.color, flexShrink: 0 }}>{initials}</div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user ? user.name.split(' ')[0] : 'User'}</div>
                <div style={{ fontSize: 10, color: '#4a5878' }}>Cronos Engineer</div>
              </div>
            )}
            {sidebarOpen && <button onClick={logout} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5878', fontSize: 14, padding: 3 }}>→</button>}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={st.main}>
        {/* Top bar */}
        <div style={st.topBar}>
          {/* Left: back + breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {segs.length > 1 && (
              <button onClick={function() { navigate(-1); }} style={st.backBtn}>← Back</button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              {crumbs.map(function(b, i) {
                var isLast = i === crumbs.length - 1;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: '#2a3a58' }}>/</span>}
                    <button onClick={function() { if (!isLast && b.path !== '#') navigate(b.path); }}
                      style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#94a3b8' : '#4a5878', padding: '0 2px', fontFamily: "'Space Grotesk',sans-serif", fontSize: 12 }}>
                      {b.label}
                    </button>
                  </React.Fragment>
                );
              })}
              {sectionMap[lastSeg] && <><span style={{ color: '#2a3a58' }}>/</span><span style={{ color: '#3b82f6', fontSize: 12 }}>{sectionMap[lastSeg]}</span></>}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notifications bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={function() { setShowNotifications(!showNotifications); setShowProfile(false); }}
                style={{ ...st.iconBtn, position: 'relative' }} title="Alerts & Notifications">
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, background: '#ef4444', borderRadius: '50%', border: '2px solid #090e1c', fontSize: 9, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 340, background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', zIndex: 500, overflow: 'hidden', animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 14 }}>🔔 Alerts & Activity</span>
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{unreadCount} new</span>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#4a5878' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                        <div style={{ fontSize: 13 }}>No alerts — everything looks good!</div>
                      </div>
                    ) : notifications.map(function(n, i) {
                      var sevColor = n.severity === 'critical' ? '#ef4444' : '#f59e0b';
                      return (
                        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #1a2540', display: 'flex', gap: 10 }}>
                          <span style={{ fontSize: 16, flexShrink: 0 }}>{ n.severity === 'critical' ? '🚨' : '⚠️' }</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, marginBottom: 2 }}>{n.action}</div>
                            {n.clientName && <div style={{ color: sevColor, fontSize: 10, fontWeight: 600 }}>{n.clientName}</div>}
                            <div style={{ color: '#4a5878', fontSize: 10, marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid #1a2540' }}>
                    <button onClick={function() { navigate('/msp'); setShowNotifications(false); }} style={{ width: '100%', padding: '8px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, color: '#60a5fa', fontSize: 12, cursor: 'pointer' }}>
                      View All Activity →
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={st.badge}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>CRONOS</span>
            </div>

            <div style={{ color: '#4a5878', fontSize: 11, fontFamily: 'monospace' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Profile avatar - TOP RIGHT */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={function() { setShowProfile(!showProfile); setShowNotifications(false); }}
                style={{ ...st.topAvatar, background: currentMember.color, border: showProfile ? '2px solid ' + currentMember.color : '2px solid transparent', outline: 'none' }}>
                {initials}
              </button>

              {showProfile && (
                <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 290, background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, boxShadow: '0 16px 56px rgba(0,0,0,0.6)', zIndex: 500, animation: 'fadeIn 0.2s ease', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 16px 12px', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.04))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: currentMember.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>{initials}</div>
                      <div>
                        <div style={{ color: '#f0f4ff', fontWeight: 700, fontSize: 14 }}>{currentMember.name}</div>
                        <div style={{ color: '#10b981', fontSize: 10, fontWeight: 600, marginTop: 2 }}>● Cloud Engineer · Cronos</div>
                      </div>
                    </div>
                    {[{ i: '📧', v: currentMember.email }, { i: '📱', v: currentMember.phone }, { i: '🏢', v: 'ShellKode Technologies' }, { i: '📅', v: 'Today: ' + new Date().toLocaleDateString('en-IN') }].map(function(d, i) {
                      return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}><span style={{ fontSize: 11, width: 16 }}>{d.i}</span><span style={{ color: '#8a9bc5', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.v}</span></div>;
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid #1a2540' }}>
                    {[{ l: 'Clients', v: 12, c: '#3b82f6' }, { l: 'Open', v: 23, c: '#f59e0b' }, { l: 'Resolved', v: 89, c: '#10b981' }].map(function(s, i) {
                      return <div key={i} style={{ padding: '10px', textAlign: 'center', borderRight: i < 2 ? '1px solid #1a2540' : 'none' }}><div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ fontSize: 10, color: '#4a5878' }}>{s.l}</div></div>;
                    })}
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button onClick={function() { navigate('/msp/cronos'); setShowProfile(false); }} style={st.profAction}>👥 Team Members</button>
                    <button onClick={function() { navigate('/msp/cronos/clients'); setShowProfile(false); }} style={st.profAction}>🏢 Manage Clients</button>
                    <button onClick={logout} style={{ ...st.profAction, color: '#f87171', marginTop: 4, borderTop: '1px solid #1a2540', paddingTop: 10 }}>🚪 Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

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
  logoArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '13px 11px', borderBottom: '1px solid #1a2540', minHeight: 54 },
  logoIcon: { width: 28, height: 28, flexShrink: 0 },
  logoText: { fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: '#f0f4ff', whiteSpace: 'nowrap' },
  logoSub: { fontSize: 9, color: '#4a5878', letterSpacing: '1px', textTransform: 'uppercase' },
  collapseBtn: { background: 'none', border: 'none', color: '#4a5878', cursor: 'pointer', padding: 3, fontSize: 10, flexShrink: 0 },
  nav: { flex: 1, padding: '8px 5px', display: 'flex', flexDirection: 'column', gap: 3 },
  navItem: { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 9px', borderRadius: 9, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', position: 'relative', transition: 'background 0.15s', overflow: 'hidden' },
  navActive: { background: 'rgba(59,130,246,0.1)' },
  navDot: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 16, background: '#3b82f6', borderRadius: '0 3px 3px 0' },
  avatar: { width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 46, borderBottom: '1px solid #1a2540', background: '#090e1c', flexShrink: 0 },
  backBtn: { padding: '3px 9px', background: 'rgba(255,255,255,0.04)', border: '1px solid #1e2d47', borderRadius: 7, color: '#8a9bc5', cursor: 'pointer', fontSize: 12, fontFamily: "'Space Grotesk',sans-serif" },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: '3px 5px', borderRadius: 7 },
  badge: { display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '3px 9px' },
  topAvatar: { width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', border: 'none', cursor: 'pointer', transition: 'border 0.2s' },
  profAction: { display: 'block', width: '100%', padding: '8px 10px', background: 'none', border: 'none', color: '#8a9bc5', fontSize: 12, cursor: 'pointer', textAlign: 'left', borderRadius: 7, fontFamily: "'Space Grotesk',sans-serif" },
  content: { flex: 1, overflow: 'auto', padding: '16px 20px' },
};
