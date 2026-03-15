import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

var CAT_ICONS = { security: '🛡️', cost: '💰', patching: '🔧', ssl: '🔒', inventory: '📦', credentials: '🔑', client: '🏢', user: '👤', ticket: '🎫', report: '📄', note: '📝', alert: '🔔' };
var CAT_COLORS = { security: '#ef4444', cost: '#f59e0b', patching: '#10b981', ssl: '#06b6d4', inventory: '#3b82f6', credentials: '#8b5cf6', client: '#3b82f6', user: '#10b981', ticket: '#f97316', report: '#ec4899', note: '#f59e0b', alert: '#ef4444' };
var SEV_COLORS = { info: '#4a5878', warning: '#f59e0b', success: '#10b981', critical: '#ef4444' };

function timeAgo(date) {
  var diff = Date.now() - new Date(date).getTime();
  var m = Math.floor(diff / 60000);
  var h = Math.floor(m / 60);
  var d = Math.floor(h / 24);
  if (d > 0) return d + 'd ago';
  if (h > 0) return h + 'h ago';
  if (m > 0) return m + 'm ago';
  return 'just now';
}

export default function MSPDashboard() {
  var { user } = useAuth();
  var navigate = useNavigate();
  var [activities, setActivities] = useState([]);
  var [actLoading, setActLoading] = useState(true);
  var [catFilter, setCatFilter] = useState('ALL');

  useEffect(function() {
    api.get('/activity?limit=50')
      .then(function(r) { setActivities(r.data); })
      .catch(function() { setActivities([]); })
      .finally(function() { setActLoading(false); });
  }, []);

  var stats = [
    { label: 'Managed Clients', value: '12', icon: '🏢', color: '#3b82f6', delta: '+2 this quarter' },
    { label: 'Team Engineers', value: '11', icon: '👥', color: '#10b981', delta: 'Team Cronos' },
    { label: 'AWS Accounts', value: '12', icon: '☁️', color: '#06b6d4', delta: 'ap-south-1 primary' },
    { label: 'Active Tickets', value: '23', icon: '🎫', color: '#f59e0b', delta: '5 urgent' },
    { label: 'Avg Security Score', value: '74', icon: '🛡️', color: '#8b5cf6', delta: '↑ 8pts this month' },
    { label: 'Monthly Savings', value: '$18K', icon: '💰', color: '#10b981', delta: 'Identified savings' },
  ];

  var cats = ['ALL', 'security', 'cost', 'patching', 'credentials', 'client', 'note', 'alert', 'ticket'];
  var filteredActs = catFilter === 'ALL' ? activities : activities.filter(function(a) { return a.category === catFilter; });

  return (
    <div style={st.page}>
      <div style={st.header}>
        <div>
          <h1 style={st.title}>MSP Operations Hub</h1>
          <p style={st.sub}>Welcome back, {user ? user.name.split(' ')[0] : 'Engineer'} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div style={st.statsGrid}>
        {stats.map(function(s, i) {
          return (
            <div key={i} style={st.statCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#8a9bc5', marginTop: 4 }}>{s.label}</div>
                </div>
                <span style={{ fontSize: 28 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 11, color: '#4a5878', marginTop: 12, paddingTop: 10, borderTop: '1px solid #1e2d47' }}>{s.delta}</div>
            </div>
          );
        })}
      </div>

      {/* Two-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Activity Feed */}
        <div style={st.section}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={st.sectionTitle}>📋 Activity History</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {cats.map(function(c) {
                return (
                  <button key={c} onClick={function() { setCatFilter(c); }}
                    style={{ padding: '3px 10px', background: catFilter === c ? 'rgba(59,130,246,0.12)' : 'transparent', border: '1px solid ' + (catFilter === c ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 20, color: catFilter === c ? '#60a5fa' : '#4a5878', fontSize: 11, cursor: 'pointer' }}>
                    {c === 'ALL' ? 'All' : CAT_ICONS[c] + ' ' + c.charAt(0).toUpperCase() + c.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
            {actLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 10px' }} />
                <div style={{ color: '#4a5878', fontSize: 13 }}>Loading activity...</div>
              </div>
            ) : filteredActs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
                <div style={{ color: '#4a5878', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No activity yet</div>
                <div style={{ color: '#2a3a58', fontSize: 12 }}>Actions performed on clients will appear here</div>
              </div>
            ) : (
              <div style={{ maxHeight: 460, overflowY: 'auto' }}>
                {filteredActs.map(function(act, i) {
                  var color = CAT_COLORS[act.category] || '#4a5878';
                  var sevColor = SEV_COLORS[act.severity] || '#4a5878';
                  return (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1a2540', transition: 'background 0.15s' }}
                      onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', border: '1px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {CAT_ICONS[act.category] || '📌'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>{act.action}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sevColor, flexShrink: 0 }} />
                            <span style={{ color: '#4a5878', fontSize: 11, whiteSpace: 'nowrap' }}>{timeAgo(act.createdAt)}</span>
                          </div>
                        </div>
                        {act.details && <div style={{ color: '#64748b', fontSize: 11, marginTop: 3 }}>{act.details}</div>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 5 }}>
                          {act.clientName && <span style={{ background: color + '12', color: color, borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{act.clientName}</span>}
                          {act.performedByName && <span style={{ color: '#2a3a58', fontSize: 11 }}>by {act.performedByName}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Teams + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Team card */}
          <div style={st.section}>
            <h2 style={st.sectionTitle}>⚡ Team Cronos</h2>
            <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 18, cursor: 'pointer' }}
              onClick={function() { navigate('/msp/cronos'); }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {[{ l: 'Clients', v: 12, c: '#3b82f6' }, { l: 'Engineers', v: 11, c: '#10b981' }, { l: 'Tickets', v: 23, c: '#f59e0b' }].map(function(s, i) {
                  return (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 11, color: '#4a5878' }}>{s.l}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                View Team & Clients →
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div style={st.section}>
            <h2 style={st.sectionTitle}>⚡ Quick Actions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'View All Clients', icon: '🏢', path: '/msp/cronos/clients', color: '#3b82f6' },
                { label: 'Team Cronos Members', icon: '👥', path: '/msp/cronos', color: '#10b981' },
                { label: 'Open FreshDesk', icon: '🎫', url: 'https://shellkode.freshdesk.com', color: '#f97316' },
                { label: 'AWS Console', icon: '☁️', url: 'https://console.aws.amazon.com', color: '#f59e0b' },
              ].map(function(a, i) {
                return (
                  <button key={i} onClick={function() { if (a.path) navigate(a.path); else window.open(a.url, '_blank'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: '#111827', border: '1px solid ' + a.color + '22', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left' }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = a.color + '0d'; e.currentTarget.style.borderColor = a.color + '44'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = '#111827'; e.currentTarget.style.borderColor = a.color + '22'; }}>
                    <span style={{ fontSize: 18 }}>{a.icon}</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13 }}>{a.label}</span>
                    <span style={{ marginLeft: 'auto', color: a.color, fontSize: 14 }}>→</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming items */}
          <div style={st.section}>
            <h2 style={st.sectionTitle}>⏰ Upcoming Expirations</h2>
            <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
              {[
                { label: 'api.paynearby.in SSL', days: 12, type: 'SSL', severity: 'critical' },
                { label: 'r5.2xlarge RI x2', days: 8, type: 'RI', severity: 'critical' },
                { label: 'EC2 Savings Plan', days: 22, type: 'Savings', severity: 'warning' },
                { label: 'dashboard SSL', days: 45, type: 'SSL', severity: 'info' },
              ].map(function(item, i) {
                var sevColor = item.severity === 'critical' ? '#ef4444' : item.severity === 'warning' ? '#f59e0b' : '#4a5878';
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < 3 ? '1px solid #1a2540' : 'none' }}>
                    <div>
                      <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500 }}>{item.label}</div>
                      <div style={{ color: '#4a5878', fontSize: 10, marginTop: 1 }}>{item.type}</div>
                    </div>
                    <span style={{ background: sevColor + '18', color: sevColor, border: '1px solid ' + sevColor + '33', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                      {item.days}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

var st = {
  page: { animation: 'fadeIn 0.4s ease', maxWidth: 1400 },
  header: { marginBottom: 20 },
  title: { fontFamily: "'Sora',sans-serif", fontSize: 24, fontWeight: 700, color: '#f0f4ff' },
  sub: { color: '#64748b', fontSize: 13, marginTop: 3 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 },
  statCard: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: '18px 16px' },
  section: { marginBottom: 0 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 },
};
