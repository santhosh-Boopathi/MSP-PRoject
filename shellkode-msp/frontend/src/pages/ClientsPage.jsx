import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CLIENT_ICONS = {
  'PAYNEARBY': '💳', 'VANAN SERVICES': '🖥️', 'NARAYANA NETHRALAYA': '👁️',
  'BOTREE': '🌳', 'FINNEVA': '💹', 'LUCAS TVS': '⚙️',
  '5C NETWORK': '🏥', 'UWC': '🎓', 'BIOVUS': '🧬',
  'ZETAPP': '📲', 'GRAYQUEST': '🎓', 'SBFC': '🏦',
};
const CLIENT_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#a855f7'];

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/clients?team=Cronos')
      .then(r => setClients(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Client Portfolio</h1>
          <p style={styles.subtitle}>Team Cronos · {clients.length} Managed AWS Accounts</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.searchWrap}>
            <svg style={styles.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." style={styles.searchInput} />
          </div>
          <div style={styles.countBadge}>{filtered.length} clients</div>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <span style={{ color: '#4a5878', fontSize: 14 }}>Loading clients...</span>
        </div>
      ) : (
        <div style={styles.grid}>
          {filtered.map((client, i) => {
            const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
            const icon = CLIENT_ICONS[client.name] || '☁️';
            return (
              <div
                key={client._id}
                style={styles.card}
                onClick={() => navigate(`/msp/cronos/clients/${client._id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e2d47'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Color bar */}
                <div style={{ ...styles.colorBar, background: color }} />

                {/* Header */}
                <div style={styles.cardHeader}>
                  <div style={{ ...styles.clientIcon, background: color + '18' }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                  </div>
                  <div style={{ ...styles.statusDot, background: client.status === 'active' ? '#10b981' : '#f59e0b' }} title={client.status} />
                </div>

                {/* Name */}
                <h3 style={styles.clientName}>{client.name}</h3>
                <p style={styles.clientIndustry}>{client.industry || 'Cloud Services'}</p>

                {/* Regions */}
                <div style={styles.regionWrap}>
                  {(client.awsRegions || ['ap-south-1']).map((r, ri) => (
                    <span key={ri} style={styles.regionTag}>{r}</span>
                  ))}
                </div>

                {/* Meta */}
                <div style={styles.cardMeta}>
                  <span style={styles.metaItem}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>
                    {client.lastAuditDate ? new Date(client.lastAuditDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No audit yet'}
                  </span>
                  <span style={{ ...styles.metaItem, color: color }}>
                    View Details →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { animation: 'fadeIn 0.4s ease', maxWidth: 1400 },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 },
  title: { fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 700, color: '#f0f4ff' },
  subtitle: { color: '#64748b', fontSize: 14, marginTop: 4 },
  headerRight: { display: 'flex', align: 'center', gap: 12, alignItems: 'center' },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4a5878' },
  searchInput: { padding: '9px 14px 9px 36px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', width: 220, fontFamily: "'Space Grotesk', sans-serif" },
  countBadge: { background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 14px', color: '#60a5fa', fontSize: 13, fontWeight: 600 },
  loading: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: 300 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 },
  card: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: '20px', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' },
  colorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderRadius: '16px 16px 0 0' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
  clientIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 9, height: 9, borderRadius: '50%' },
  clientName: { fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 },
  clientIndustry: { color: '#4a5878', fontSize: 12, marginBottom: 12 },
  regionWrap: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  regionTag: { background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 6, padding: '2px 8px', color: '#22d3ee', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #1a2540' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 4, color: '#4a5878', fontSize: 11 },
};
