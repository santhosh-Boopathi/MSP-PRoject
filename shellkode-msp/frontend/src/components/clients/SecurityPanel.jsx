import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToHTML, generateSecurityReportHTML, exportToCSV } from '../../utils/exportUtils';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFORMATIONAL: 4 };
const SEVERITY_COLORS = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#3b82f6', INFORMATIONAL: '#06b6d4' };

export default function SecurityPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('severity');

  const runScan = () => {
    setLoading(true);
    api.get(`/aws/security/${clientId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { runScan(); }, [clientId]);

  const filtered = data?.findings?.filter(f => filter === 'ALL' || f.severity === filter)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]) || [];

  const handleExportHTML = () => {
    const content = generateSecurityReportHTML(clientName, data);
    exportToHTML(`Security Audit — ${clientName}`, content);
  };

  const handleExportCSV = () => {
    exportToCSV(`Security_${clientName}`,
      ['ID', 'Severity', 'Finding', 'Service', 'Region', 'Resource', 'Remediation', 'Status'],
      data.findings.map(f => [f.id, f.severity, f.title, f.service, f.region, f.resource, f.remediation, f.status])
    );
  };

  return (
    <div style={styles.panel}>
      <div style={styles.panelHeader}>
        <div>
          <h2 style={styles.panelTitle}>🛡️ Security Audit</h2>
          <p style={styles.panelSub}>AWS Security Hub analysis · CIS Benchmarks · Best Practices</p>
        </div>
        <div style={styles.actionRow}>
          <button onClick={runScan} disabled={loading} style={styles.scanBtn}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Scanning...</> : '🔍 Run Scan'}
          </button>
          {data && <>
            <button onClick={handleExportHTML} style={styles.exportBtn}>📄 Export HTML</button>
            <button onClick={handleExportCSV} style={styles.exportBtn}>📊 Export CSV</button>
          </>}
        </div>
      </div>

      {loading && !data && (
        <div style={styles.loadingState}>
          <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p style={{ color: '#4a5878', marginTop: 12 }}>Scanning AWS account for {clientName}...</p>
          <p style={{ color: '#2a3a58', fontSize: 12, marginTop: 4 }}>Checking IAM, S3, EC2, RDS, CloudTrail, VPC...</p>
        </div>
      )}

      {data && (
        <>
          {/* Score + Summary */}
          <div style={styles.summaryRow}>
            {/* Score circle */}
            <div style={styles.scoreCard}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2d47" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={data.summary.score >= 80 ? '#10b981' : data.summary.score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 50 * data.summary.score / 100} ${2 * Math.PI * 50}`}
                  transform="rotate(-90 60 60)" />
                <text x="60" y="55" textAnchor="middle" fill="#f0f4ff" fontSize="24" fontWeight="800" fontFamily="Sora">{data.summary.score}</text>
                <text x="60" y="72" textAnchor="middle" fill="#4a5878" fontSize="10">/100</text>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#8a9bc5', fontSize: 12 }}>Security Score</div>
                <div style={{ color: data.summary.score >= 80 ? '#10b981' : data.summary.score >= 60 ? '#f59e0b' : '#ef4444', fontSize: 11, fontWeight: 600, marginTop: 2 }}>
                  {data.summary.score >= 80 ? 'GOOD' : data.summary.score >= 60 ? 'FAIR' : 'NEEDS ATTENTION'}
                </div>
              </div>
            </div>

            {/* Severity counts */}
            <div style={styles.severityCards}>
              {Object.entries(SEVERITY_COLORS).map(([sev, color]) => (
                <div key={sev} style={{ ...styles.sevCard, borderColor: color + '33', cursor: 'pointer', outline: filter === sev ? `2px solid ${color}` : 'none' }}
                  onClick={() => setFilter(filter === sev ? 'ALL' : sev)}>
                  <div style={{ ...styles.sevCount, color }}>{data.summary[sev.toLowerCase()] ?? 0}</div>
                  <div style={styles.sevLabel}>{sev}</div>
                </div>
              ))}
              <div style={{ ...styles.sevCard, borderColor: '#3b82f633', cursor: 'pointer', outline: filter === 'ALL' ? '2px solid #3b82f6' : 'none' }}
                onClick={() => setFilter('ALL')}>
                <div style={{ ...styles.sevCount, color: '#3b82f6' }}>{data.findings.length}</div>
                <div style={styles.sevLabel}>TOTAL</div>
              </div>
            </div>
          </div>

          {/* Findings table */}
          <div style={styles.tableWrap}>
            <div style={styles.tableHeader}>
              <span style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>
                Findings {filter !== 'ALL' ? `(${filter})` : ''} — {filtered.length} results
              </span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={styles.select}>
                <option value="severity">Sort by Severity</option>
                <option value="service">Sort by Service</option>
              </select>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  {['ID', 'Severity', 'Finding', 'Service', 'Region', 'Remediation'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => (
                  <tr key={i} style={{ ...styles.tr, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{f.id}</td>
                    <td style={styles.td}>
                      <span className={`badge badge-${f.severity.toLowerCase() === 'informational' ? 'info' : f.severity.toLowerCase()}`}>
                        {f.severity}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#e2e8f0', fontWeight: 500 }}>{f.title}</td>
                    <td style={{ ...styles.td, color: '#06b6d4', fontSize: 12 }}>{f.service}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{f.region}</td>
                    <td style={{ ...styles.td, color: '#94a3b8', fontSize: 12, maxWidth: 200 }}>{f.remediation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  panel: { animation: 'fadeIn 0.4s ease' },
  panelHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 },
  panelTitle: { fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 },
  panelSub: { color: '#64748b', fontSize: 13 },
  actionRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  scanBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  exportBtn: { padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" },
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, background: '#111827', borderRadius: 14, border: '1px solid #1e2d47' },
  summaryRow: { display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-start' },
  scoreCard: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, padding: '24px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  severityCards: { flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 },
  sevCard: { background: '#111827', border: '1px solid', borderRadius: 12, padding: '16px 12px', textAlign: 'center', transition: 'all 0.2s' },
  sevCount: { fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800 },
  sevLabel: { color: '#4a5878', fontSize: 10, marginTop: 4, letterSpacing: '0.5px', textTransform: 'uppercase' },
  tableWrap: { background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1a2540' },
  select: { padding: '6px 10px', background: '#0d1424', border: '1px solid #1e2d47', borderRadius: 8, color: '#8a9bc5', fontSize: 12, outline: 'none', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#0d1424' },
  th: { padding: '10px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #1a2540', transition: 'background 0.1s' },
  td: { padding: '11px 14px', fontSize: 13, color: '#94a3b8', verticalAlign: 'top' },
};
