import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

var TEAM_MEMBERS = [
  { name: 'Subhasubalakshmi S', email: 'subhasubalakshmi.s@shellkode.com', phone: '9043173878', color: '#3b82f6', initials: 'SU' },
  { name: 'Raghul Sasikumar', email: 'raghul.sasikumar@shellkode.com', phone: '7904350313', color: '#8b5cf6', initials: 'RA' },
  { name: 'Santhosh B', email: 'santhosh.b@shellkode.com', phone: '8526407704', color: '#10b981', initials: 'SA' },
  { name: 'Bhavesh K', email: 'bhavesh.k@shellkode.com', phone: '8890569447', color: '#f59e0b', initials: 'BH' },
  { name: 'Surya Krishna', email: 'surya.krishna@shellkode.com', phone: '7013195007', color: '#06b6d4', initials: 'SK' },
  { name: 'Gokul A', email: 'gokul.a@shellkode.com', phone: '8838390568', color: '#ef4444', initials: 'GO' },
  { name: 'Arunachalam G', email: 'arunachalam.g@shellkode.com', phone: '6381220655', color: '#f97316', initials: 'AR' },
  { name: 'Hemanath U', email: 'hemanath.u@shellkode.com', phone: '7448787737', color: '#ec4899', initials: 'HE' },
  { name: 'Lavanya K', email: 'lavanya.k@shellkode.com', phone: '9344933152', color: '#14b8a6', initials: 'LA' },
  { name: 'Pradeep P', email: 'pradeep.p@shellkode.com', phone: '9186838466', color: '#6366f1', initials: 'PR' },
  { name: 'Hari Prasath J', email: 'hariprasath.j@shellkode.com', phone: '7806808943', color: '#84cc16', initials: 'HP' },
];

export default function TeamPage() {
  var navigate = useNavigate();
  var [selected, setSelected] = useState(null);

  return (
    <div style={{ animation: 'fadeIn 0.4s ease', maxWidth: 1400 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: '#f0f4ff', marginBottom: 4 }}>⚡ Team Cronos</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>AWS Managed Services · Team A · 11 Engineers · 12 Active Clients</p>
        </div>
        <button onClick={function() { navigate('/msp/cronos/clients'); }}
          style={{ padding: '10px 18px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: '#60a5fa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          View All Clients →
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, marginBottom: 24, overflow: 'hidden' }}>
        {[{ l: 'Engineers', v: 11, c: '#3b82f6' }, { l: 'Clients', v: 12, c: '#10b981' }, { l: 'Open Tickets', v: 23, c: '#f59e0b' }, { l: 'SLA Compliance', v: '97%', c: '#10b981' }, { l: 'Avg Response', v: '2.4h', c: '#8b5cf6' }].map(function(s, i) {
          return (
            <div key={i} style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: i < 4 ? '1px solid #1e2d47' : 'none' }}>
              <div style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
              <div style={{ color: '#4a5878', fontSize: 11, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.l}</div>
            </div>
          );
        })}
      </div>

      {/* Members grid */}
      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Team Members</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 24 }}>
        {TEAM_MEMBERS.map(function(m, i) {
          var isSel = selected && selected.email === m.email;
          return (
            <div key={i} onClick={function() { setSelected(isSel ? null : m); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#111827', border: '1px solid ' + (isSel ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s', background: isSel ? 'rgba(59,130,246,0.06)' : '#111827' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: m.color + '22', border: '2px solid ' + m.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: m.color, fontWeight: 700, fontSize: 15 }}>{m.initials}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ color: '#4a5878', fontSize: 11, marginTop: 1 }}>Cloud Engineer</div>
                <div style={{ color: '#2a3a58', fontSize: 10, marginTop: 1, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
              </div>
              <div style={{ color: '#4a5878', fontSize: 11, fontFamily: 'monospace', flexShrink: 0 }}>{m.phone}</div>
            </div>
          );
        })}
      </div>

      {/* Client list */}
      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Assigned Clients</h2>
      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, padding: 18 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {['PAYNEARBY', 'VANAN SERVICES', 'NARAYANA NETHRALAYA', 'BOTREE', 'FINNEVA', 'LUCAS TVS', '5C NETWORK', 'UWC', 'BIOVUS', 'ZETAPP', 'GRAYQUEST', 'SBFC'].map(function(c, i) {
            return (
              <div key={i} onClick={function() { navigate('/msp/cronos/clients'); }}
                style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '7px 14px', color: '#8a9bc5', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(59,130,246,0.12)'; e.currentTarget.style.color = '#60a5fa'; }}
                onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(59,130,246,0.06)'; e.currentTarget.style.color = '#8a9bc5'; }}>
                {c}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
