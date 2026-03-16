import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import ClientReportSidebar from './ClientReportSidebar';

var MEMBERS = [
  { email:'subhasubalakshmi.s@shellkode.com', color:'#3b82f6' },
  { email:'raghul.sasikumar@shellkode.com', color:'#8b5cf6' },
  { email:'santhosh.b@shellkode.com', color:'#10b981' },
  { email:'bhavesh.k@shellkode.com', color:'#f59e0b' },
  { email:'surya.krishna@shellkode.com', color:'#06b6d4' },
  { email:'gokul.a@shellkode.com', color:'#ef4444' },
  { email:'arunachalam.g@shellkode.com', color:'#f97316' },
  { email:'hemanath.u@shellkode.com', color:'#ec4899' },
  { email:'lavanya.k@shellkode.com', color:'#14b8a6' },
  { email:'pradeep.p@shellkode.com', color:'#6366f1' },
  { email:'hariprasath.j@shellkode.com', color:'#84cc16' },
];

function ago(d) { var m=Math.floor((Date.now()-new Date(d))/60000); return m<1?'now':m<60?m+'m':m<1440?Math.floor(m/60)+'h':Math.floor(m/1440)+'d'; }

export default function AppLayout() {
  var { user, logout } = useAuth();
  var nav = useNavigate();
  var loc = useLocation();
  var [sidebarOpen, setSidebarOpen] = useState(true);
  var [showProfile, setShowProfile] = useState(false);
  var [showNotif, setShowNotif] = useState(false);
  var [showReportSidebar, setShowReportSidebar] = useState(false);
  var [notifs, setNotifs] = useState([]);
  var profileRef = useRef(null);
  var notifRef = useRef(null);

  var member = MEMBERS.find(function(m) { return user && m.email === user.email; }) || MEMBERS[2];
  var initials = user?.name ? user.name.split(' ').map(function(n){return n[0];}).join('').slice(0,2).toUpperCase() : 'SK';

  useEffect(function() {
    api.get('/activity?limit=15').then(function(r) {
      setNotifs((r.data||[]).filter(function(a){return a.severity==='critical'||a.severity==='warning';}).slice(0,8));
    }).catch(function(){});
  }, []);

  useEffect(function() {
    function h(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    }
    document.addEventListener('mousedown', h);
    return function(){ document.removeEventListener('mousedown', h); };
  }, []);

  var navItems = [
    { label:'MSP Overview', path:'/msp', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
    { label:'Team Cronos', path:'/msp/cronos', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label:'Clients', path:'/msp/cronos/clients', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> },
  ];

  var active = function(p) { return p==='/msp'?(loc.pathname==='/msp'||loc.pathname==='/'):loc.pathname.startsWith(p); };

  // Breadcrumbs
  var segs = loc.pathname.split('/').filter(Boolean);
  var sectionMap = {security:'🛡️ Security',cost:'💰 Cost',inventory:'📦 Inventory',optimizer:'⚡ Optimizer',patching:'🔧 Patching',ssl:'🔒 SSL & Expiry',freshdesk:'🎫 Tickets',reports:'📄 Reports',overview:'📊 Overview'};
  var lastSeg = segs[segs.length-1];

  return (
    <div style={{ display:'flex', height:'100vh', background:'#080c18', overflow:'hidden' }}>
      {/* LEFT SIDEBAR */}
      <div style={{ display:'flex', flexDirection:'column', background:'#090e1c', borderRight:'1px solid #1a2540', width:sidebarOpen?226:54, transition:'width 0.25s', overflow:'hidden', flexShrink:0, zIndex:10 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:9, padding:'12px 10px', borderBottom:'1px solid #1a2540', minHeight:52 }}>
          <svg width="26" height="26" viewBox="0 0 48 48" fill="none" style={{ flexShrink:0 }}>
            <rect width="48" height="48" rx="10" fill="url(#lgg3)"/>
            <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 30L20 24L26 30L32 24" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs><linearGradient id="lgg3" x1="0" y1="0" x2="48" y2="48"><stop stopColor="#3b82f6"/><stop offset="1" stopColor="#06b6d4"/></linearGradient></defs>
          </svg>
          {sidebarOpen && <div style={{ flex:1 }}><div style={{ fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:700, color:'#f0f4ff', whiteSpace:'nowrap' }}>ShellKode</div><div style={{ fontSize:9, color:'#4a5878', letterSpacing:'1px', textTransform:'uppercase' }}>MSP Portal</div></div>}
          <button onClick={function(){setSidebarOpen(!sidebarOpen);}} style={{ background:'none', border:'none', color:'#4a5878', cursor:'pointer', padding:3, fontSize:10, flexShrink:0 }}>{sidebarOpen?'◀':'▶'}</button>
        </div>

        {/* Nav */}
        <nav style={{ padding:'8px 5px', display:'flex', flexDirection:'column', gap:3 }}>
          {navItems.map(function(item) {
            var isAct = active(item.path);
            return (
              <button key={item.path} onClick={function(){nav(item.path);}} title={!sidebarOpen?item.label:''}
                style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 9px', borderRadius:9, background:isAct?'rgba(59,130,246,0.1)':'none', border:'none', cursor:'pointer', width:'100%', textAlign:'left', position:'relative', overflow:'hidden', color:isAct?'#60a5fa':'#4a5878' }}>
                {item.icon}
                {sidebarOpen && <span style={{ fontSize:13, fontWeight:isAct?600:400, color:isAct?'#f0f4ff':'#8a9bc5' }}>{item.label}</span>}
                {isAct && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:16, background:'#3b82f6', borderRadius:'0 3px 3px 0' }} />}
              </button>
            );
          })}
        </nav>

        {/* REPORT STATUS BUTTON — in left sidebar */}
        {sidebarOpen && (
          <div style={{ padding:'0 5px 6px' }}>
            <button onClick={function(){setShowReportSidebar(true);}}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 9px', width:'100%', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:9, cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={function(e){e.currentTarget.style.background='rgba(59,130,246,0.12)';}}
              onMouseLeave={function(e){e.currentTarget.style.background='rgba(59,130,246,0.06)';}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/></svg>
              <span style={{ fontSize:13, fontWeight:500, color:'#60a5fa' }}>Report Status</span>
            </button>
          </div>
        )}
        {!sidebarOpen && (
          <div style={{ padding:'0 5px 6px' }}>
            <button onClick={function(){setShowReportSidebar(true);}} title="Report Status"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'9px', width:'100%', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)', borderRadius:9, cursor:'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </button>
          </div>
        )}

        {/* Quick links */}
        {sidebarOpen && (
          <div style={{ padding:'0 5px 8px', borderTop:'1px solid #1a2540', paddingTop:8 }}>
            <div style={{ color:'#2a3a58', fontSize:9, fontWeight:700, letterSpacing:'1px', padding:'0 8px 5px' }}>QUICK LINKS</div>
            {[{l:'FreshDesk',i:'🎫',u:'https://shellkode.freshdesk.com'},{l:'AWS Console',i:'☁️',u:'https://console.aws.amazon.com'}].map(function(l,i){
              return <button key={i} onClick={function(){window.open(l.u,'_blank');}} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 8px', width:'100%', background:'none', border:'none', cursor:'pointer', borderRadius:7 }}><span style={{ fontSize:13 }}>{l.i}</span><span style={{ color:'#4a5878', fontSize:12 }}>{l.l}</span></button>;
            })}
          </div>
        )}

        {/* User — NO contact details, just name and logout */}
        <div style={{ borderTop:'1px solid #1a2540', padding: sidebarOpen?'10px 10px':'10px 8px', marginTop:'auto' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:member.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white', flexShrink:0 }}>{initials}</div>
            {sidebarOpen && (
              <>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name?.split(' ')[0] || 'User'}</div>
                  <div style={{ fontSize:10, color:'#4a5878' }}>Cronos</div>
                </div>
                <button onClick={logout} title="Sign out" style={{ background:'none', border:'none', cursor:'pointer', color:'#4a5878', fontSize:14, padding:3 }}>→</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* TOP BAR */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', height:46, borderBottom:'1px solid #1a2540', background:'#090e1c', flexShrink:0 }}>
          {/* Left: back + breadcrumbs */}
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {segs.length > 1 && (
              <button onClick={function(){nav(-1);}} style={{ padding:'3px 9px', background:'rgba(255,255,255,0.04)', border:'1px solid #1e2d47', borderRadius:7, color:'#8a9bc5', cursor:'pointer', fontSize:12, fontFamily:"'Space Grotesk',sans-serif" }}>← Back</button>
            )}
            <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, color:'#4a5878' }}>
              <span>MSP</span>
              {segs.includes('cronos') && <><span>/</span><button onClick={function(){nav('/msp/cronos');}} style={{ background:'none', border:'none', cursor:'pointer', color:'#4a5878', fontSize:12, padding:'0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>Cronos</button></>}
              {segs.includes('clients') && !segs.find(function(s){return s.length>20;}) && <><span>/</span><button onClick={function(){nav('/msp/cronos/clients');}} style={{ background:'none', border:'none', cursor:'pointer', color:'#4a5878', fontSize:12, padding:'0 2px', fontFamily:"'Space Grotesk',sans-serif" }}>Clients</button></>}
              {segs.find(function(s){return s.length>20;}) && <><span>/</span><span style={{ color:'#94a3b8' }}>Client</span></>}
              {sectionMap[lastSeg] && <><span>/</span><span style={{ color:'#3b82f6' }}>{sectionMap[lastSeg]}</span></>}
            </div>
          </div>

          {/* Right: notifications + time + profile avatar */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Notifications */}
            <div ref={notifRef} style={{ position:'relative' }}>
              <button onClick={function(){setShowNotif(!showNotif); setShowProfile(false);}}
                style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, padding:'3px 5px', borderRadius:7, position:'relative' }}>
                🔔
                {notifs.length > 0 && <span style={{ position:'absolute', top:0, right:0, width:16, height:16, background:'#ef4444', borderRadius:'50%', border:'2px solid #090e1c', fontSize:9, fontWeight:700, color:'white', display:'flex', alignItems:'center', justifyContent:'center' }}>{notifs.length > 9 ? '9+' : notifs.length}</span>}
              </button>
              {showNotif && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:340, background:'#111827', border:'1px solid #1e2d47', borderRadius:14, boxShadow:'0 16px 56px rgba(0,0,0,0.6)', zIndex:500, overflow:'hidden', animation:'fadeIn 0.2s ease' }}>
                  <div style={{ padding:'12px 14px', borderBottom:'1px solid #1a2540', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ color:'#f0f4ff', fontWeight:700, fontSize:13 }}>🔔 Alerts</span>
                    {notifs.length > 0 && <span style={{ background:'rgba(239,68,68,0.1)', color:'#f87171', borderRadius:20, padding:'1px 8px', fontSize:11, fontWeight:700 }}>{notifs.length}</span>}
                  </div>
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding:30, textAlign:'center', color:'#4a5878' }}><div style={{ fontSize:28, marginBottom:8 }}>✅</div><div style={{ fontSize:13 }}>No alerts — all clear!</div></div>
                    ) : notifs.map(function(n, i) {
                      return (
                        <div key={i} style={{ padding:'10px 14px', borderBottom:'1px solid #1a2540', display:'flex', gap:10 }}>
                          <span style={{ fontSize:14 }}>{n.severity==='critical'?'🚨':'⚠️'}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ color:'#e2e8f0', fontSize:12, fontWeight:500 }}>{n.action}</div>
                            {n.clientName && <span style={{ color:n.severity==='critical'?'#f87171':'#fbbf24', fontSize:10, fontWeight:600 }}>{n.clientName}</span>}
                            <div style={{ color:'#4a5878', fontSize:10, marginTop:2 }}>{ago(n.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding:'8px 14px', borderTop:'1px solid #1a2540' }}>
                    <button onClick={function(){nav('/msp');setShowNotif(false);}} style={{ width:'100%', padding:'7px', background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:8, color:'#60a5fa', fontSize:12, cursor:'pointer' }}>View All Activity →</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:20, padding:'3px 9px' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', animation:'pulse 2s infinite' }} />
              <span style={{ color:'#10b981', fontSize:11, fontWeight:600 }}>CRONOS</span>
            </div>

            <span style={{ color:'#4a5878', fontSize:11, fontFamily:'monospace' }}>{new Date().toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>

            {/* Profile - CORRECT position top-right, popup below */}
            <div ref={profileRef} style={{ position:'relative' }}>
              <button onClick={function(){setShowProfile(!showProfile); setShowNotif(false);}}
                style={{ width:28, height:28, borderRadius:8, background:member.color, border:showProfile?'2px solid '+member.color:'2px solid transparent', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'white', cursor:'pointer', outline:'none' }}>
                {initials}
              </button>
              {showProfile && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:260, background:'#111827', border:'1px solid #1e2d47', borderRadius:14, boxShadow:'0 16px 56px rgba(0,0,0,0.6)', zIndex:500, overflow:'hidden', animation:'fadeIn 0.2s ease' }}>
                  <div style={{ padding:'14px 14px 10px', background:'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.04))' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                      <div style={{ width:40, height:40, borderRadius:10, background:member.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'white', flexShrink:0 }}>{initials}</div>
                      <div>
                        <div style={{ color:'#f0f4ff', fontWeight:700, fontSize:13 }}>{user?.name}</div>
                        <div style={{ color:'#10b981', fontSize:10, fontWeight:600 }}>● Cloud Engineer · Cronos</div>
                      </div>
                    </div>
                    <div style={{ color:'#4a5878', fontSize:11 }}>{user?.email}</div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid #1a2540' }}>
                    {[{l:'Clients',v:12,c:'#3b82f6'},{l:'Open',v:23,c:'#f59e0b'},{l:'Done',v:89,c:'#10b981'}].map(function(s,i){
                      return <div key={i} style={{ padding:'10px', textAlign:'center', borderRight:i<2?'1px solid #1a2540':'none' }}><div style={{ fontSize:16, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ fontSize:10, color:'#4a5878' }}>{s.l}</div></div>;
                    })}
                  </div>
                  <div style={{ padding:'6px' }}>
                    <button onClick={function(){nav('/msp/cronos');setShowProfile(false);}} style={{ display:'block', width:'100%', padding:'8px 10px', background:'none', border:'none', color:'#8a9bc5', fontSize:12, cursor:'pointer', textAlign:'left', borderRadius:7, fontFamily:"'Space Grotesk',sans-serif" }}>👥 Team Members</button>
                    <button onClick={function(){nav('/msp/cronos/clients');setShowProfile(false);}} style={{ display:'block', width:'100%', padding:'8px 10px', background:'none', border:'none', color:'#8a9bc5', fontSize:12, cursor:'pointer', textAlign:'left', borderRadius:7, fontFamily:"'Space Grotesk',sans-serif" }}>🏢 Manage Clients</button>
                    <button onClick={logout} style={{ display:'block', width:'100%', padding:'8px 10px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:7, color:'#f87171', fontSize:12, cursor:'pointer', textAlign:'left', fontFamily:"'Space Grotesk',sans-serif", marginTop:4 }}>🚪 Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ flex:1, overflow:'auto', padding:'16px 20px' }}>
          <Outlet />
        </div>
      </div>

      {/* Report Status Sidebar (slide in from right) */}
      <ClientReportSidebar isOpen={showReportSidebar} onClose={function(){setShowReportSidebar(false);}} />
    </div>
  );
}
