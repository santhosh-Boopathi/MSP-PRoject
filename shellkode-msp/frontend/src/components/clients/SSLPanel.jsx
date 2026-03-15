import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

function getDaysClass(days) {
  if (days <= 14) return { color: '#ef4444', label: 'CRITICAL', badge: 'critical' };
  if (days <= 30) return { color: '#f59e0b', label: 'WARNING', badge: 'warning' };
  if (days <= 60) return { color: '#f97316', label: 'EXPIRING SOON', badge: 'medium' };
  return { color: '#10b981', label: 'VALID', badge: 'success' };
}

export default function SSLPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/aws/ssl/${clientId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!data?.length) return <div style={{ padding: 24, color: '#4a5878' }}>No domains configured for this client.</div>;

  const criticalCount = data.filter(d => d.sslDaysRemaining <= 14 || d.domainDaysRemaining <= 14).length;
  const warningCount = data.filter(d => (d.sslDaysRemaining > 14 && d.sslDaysRemaining <= 30) || (d.domainDaysRemaining > 14 && d.domainDaysRemaining <= 30)).length;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔒 SSL & Domain Monitoring</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Certificate expiry · Domain renewal · Grade monitoring</p>
        </div>
        <button onClick={() => exportToCSV(`SSL_${clientName}`,
          ['Domain', 'SSL Expiry', 'SSL Days Left', 'SSL Status', 'Domain Expiry', 'Domain Days Left', 'Grade'],
          data.map(d => [d.domain, d.sslExpiry, d.sslDaysRemaining, d.sslStatus, d.domainExpiry, d.domainDaysRemaining, d.grade])
        )} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>
          📊 Export CSV
        </button>
      </div>

      {/* Alert bar */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {criticalCount > 0 && (
            <div style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>🚨</span>
              <div>
                <div style={{ color: '#f87171', fontWeight: 700, fontSize: 14 }}>{criticalCount} Domain(s) Expiring in &lt;14 days!</div>
                <div style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>Immediate action required — renew certificates</div>
              </div>
            </div>
          )}
          {warningCount > 0 && (
            <div style={{ flex: 1, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 24 }}>⚠️</span>
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14 }}>{warningCount} Domain(s) Expiring in 30 days</div>
                <div style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>Plan renewal before expiry</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Domain cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {data.map((d, i) => {
          const sslStatus = getDaysClass(d.sslDaysRemaining);
          const domainStatus = getDaysClass(d.domainDaysRemaining);
          return (
            <div key={i} style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, overflow: 'hidden', transition: 'border-color 0.2s' }}>
              {/* Domain header */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌐</div>
                  <div>
                    <div style={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14 }}>{d.domain}</div>
                    <div style={{ color: '#4a5878', fontSize: 11, marginTop: 2 }}>Issuer: {d.sslIssuer}</div>
                  </div>
                </div>
                <span style={{
                  background: d.grade === 'A+' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  color: d.grade === 'A+' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${d.grade === 'A+' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 14
                }}>{d.grade}</span>
              </div>

              {/* SSL & Domain expiry */}
              <div style={{ padding: '16px 18px' }}>
                {/* SSL */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#8a9bc5', fontSize: 12, fontWeight: 600 }}>SSL Certificate</span>
                    <span className={`badge badge-${sslStatus.badge}`} style={{ fontSize: 10 }}>{sslStatus.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Expires: {new Date(d.sslExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span style={{ color: sslStatus.color, fontWeight: 700, fontSize: 14 }}>{d.sslDaysRemaining} days</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 5, background: '#1e2d47', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((d.sslDaysRemaining / 365) * 100, 100)}%`, background: sslStatus.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>

                {/* Domain */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#8a9bc5', fontSize: 12, fontWeight: 600 }}>Domain Registration</span>
                    <span className={`badge badge-${domainStatus.badge}`} style={{ fontSize: 10 }}>{domainStatus.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>Expires: {new Date(d.domainExpiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span style={{ color: domainStatus.color, fontWeight: 700, fontSize: 14 }}>{d.domainDaysRemaining} days</span>
                  </div>
                  <div style={{ height: 5, background: '#1e2d47', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min((d.domainDaysRemaining / 365) * 100, 100)}%`, background: domainStatus.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
