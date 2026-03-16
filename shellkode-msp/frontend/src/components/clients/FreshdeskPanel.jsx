import React, { useState } from 'react';
import api from '../../utils/api';

export default function FreshdeskPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);

  var fetchTickets = function() {
    setLoading(true);
    api.get('/freshdesk/tickets/' + clientId)
      .then(function(r) { setData(r.data); })
      .catch(function(e) { setData({ hasData: false, message: e.response ? e.response.data.error : 'Failed to fetch FreshDesk data' }); })
      .finally(function() { setLoading(false); });
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🎫 FreshDesk Tickets</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Live ticket data from FreshDesk — requires FRESHDESK_DOMAIN and FRESHDESK_API_KEY in backend environment</p>
        </div>
        <button onClick={fetchTickets} disabled={loading}
          style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #f97316, #ef4444)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}>
          {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading...</> : '🎫 Fetch Tickets'}
        </button>
      </div>

      {!data && !loading && (
        <div style={{ textAlign: 'center', padding: 60, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🎫</div>
          <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>FreshDesk Not Loaded</div>
          <div style={{ color: '#4a5878', fontSize: 13, maxWidth: 400, margin: '0 auto 20px' }}>
            Click "Fetch Tickets" to pull live support ticket data. Requires FreshDesk API credentials in the backend environment variables.
          </div>
          <button onClick={fetchTickets} style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #f97316, #ef4444)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            🎫 Fetch Tickets Now
          </button>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, marginBottom: 14 }} />
          <div style={{ color: '#8a9bc5' }}>Connecting to FreshDesk...</div>
        </div>
      )}

      {data && !data.hasData && (
        <div style={{ textAlign: 'center', padding: 50, background: '#111827', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: '#fbbf24', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No Data Available</div>
          <div style={{ color: '#4a5878', fontSize: 13, maxWidth: 450, margin: '0 auto' }}>{data.message || 'FreshDesk integration not configured. Add FRESHDESK_DOMAIN and FRESHDESK_API_KEY to backend environment variables.'}</div>
          <div style={{ marginTop: 16, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: '12px 14px', textAlign: 'left', maxWidth: 400, margin: '16px auto 0' }}>
            <div style={{ color: '#60a5fa', fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Setup Instructions:</div>
            <div style={{ color: '#4a5878', fontSize: 12, lineHeight: 1.7 }}>
              1. Add <code style={{ background: '#0d1424', padding: '1px 5px', borderRadius: 3, color: '#10b981' }}>FRESHDESK_DOMAIN=yourcompany.freshdesk.com</code><br />
              2. Add <code style={{ background: '#0d1424', padding: '1px 5px', borderRadius: 3, color: '#10b981' }}>FRESHDESK_API_KEY=your_api_key</code><br />
              3. Redeploy backend on Railway
            </div>
          </div>
        </div>
      )}

      {data && data.hasData && (
        <div>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[{ l: 'Open', v: data.stats?.open || 0, c: '#ef4444' }, { l: 'In Progress', v: data.stats?.inProgress || 0, c: '#f59e0b' }, { l: 'Resolved', v: data.stats?.resolved || 0, c: '#10b981' }, { l: 'Total', v: data.stats?.total || 0, c: '#3b82f6' }].map(function(s, i) {
              return <div key={i} style={{ background: '#111827', border: '1px solid ' + s.c + '22', borderRadius: 12, padding: '14px', textAlign: 'center' }}><div style={{ fontFamily: "'Sora',sans-serif", fontSize: 26, fontWeight: 800, color: s.c }}>{s.v}</div><div style={{ color: '#4a5878', fontSize: 12, marginTop: 3 }}>{s.l}</div></div>;
            })}
          </div>

          {/* Ticket list */}
          {data.tickets && data.tickets.length > 0 && (
            <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', color: '#e2e8f0', fontWeight: 600 }}>Recent Tickets</div>
              {data.tickets.map(function(t, i) {
                var statusColor = { open: '#ef4444', pending: '#f59e0b', resolved: '#10b981', closed: '#4a5878' }[t.status] || '#4a5878';
                var priorityColor = { urgent: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#4a5878' }[t.priority] || '#4a5878';
                return (
                  <div key={i} style={{ padding: '12px 18px', borderBottom: i < data.tickets.length - 1 ? '1px solid #1a2540' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>#{t.id} {t.subject}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: statusColor + '18', color: statusColor, borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 600 }}>{t.status}</span>
                        <span style={{ background: priorityColor + '18', color: priorityColor, borderRadius: 6, padding: '1px 7px', fontSize: 10 }}>{t.priority}</span>
                        <span style={{ color: '#4a5878', fontSize: 11 }}>{t.requesterEmail}</span>
                        <span style={{ color: '#2a3a58', fontSize: 10 }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
