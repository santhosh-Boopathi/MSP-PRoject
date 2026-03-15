import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

function getDaysStatus(days) {
  if (days <= 14) return { color: '#ef4444', label: 'CRITICAL', badge: 'critical' };
  if (days <= 30) return { color: '#f59e0b', label: 'WARNING', badge: 'warning' };
  if (days <= 60) return { color: '#f97316', label: 'EXPIRING SOON', badge: 'medium' };
  return { color: '#10b981', label: 'VALID', badge: 'success' };
}

var MOCK_SSL = [
  { domain: 'paynearby.in', sslExpiry: new Date(Date.now() + 82 * 86400000).toISOString(), domainExpiry: new Date(Date.now() + 245 * 86400000).toISOString(), sslDaysRemaining: 82, domainDaysRemaining: 245, sslIssuer: 'Amazon', grade: 'A+' },
  { domain: 'api.paynearby.in', sslExpiry: new Date(Date.now() + 12 * 86400000).toISOString(), domainExpiry: new Date(Date.now() + 245 * 86400000).toISOString(), sslDaysRemaining: 12, domainDaysRemaining: 245, sslIssuer: 'Let\'s Encrypt', grade: 'A' },
  { domain: 'dashboard.paynearby.in', sslExpiry: new Date(Date.now() + 45 * 86400000).toISOString(), domainExpiry: new Date(Date.now() + 180 * 86400000).toISOString(), sslDaysRemaining: 45, domainDaysRemaining: 180, sslIssuer: 'Amazon', grade: 'A+' },
];

var MOCK_RI = [
  { type: 'EC2 Reserved Instance', instanceType: 'm5.xlarge', region: 'ap-south-1', quantity: 3, expiryDate: new Date(Date.now() + 28 * 86400000).toISOString(), daysRemaining: 28, monthlySavings: '$420', paymentOption: 'Partial Upfront', offeringClass: 'Standard' },
  { type: 'EC2 Reserved Instance', instanceType: 't3.medium', region: 'ap-south-1', quantity: 5, expiryDate: new Date(Date.now() + 95 * 86400000).toISOString(), daysRemaining: 95, monthlySavings: '$180', paymentOption: 'No Upfront', offeringClass: 'Convertible' },
  { type: 'EC2 Reserved Instance', instanceType: 'r5.2xlarge', region: 'ap-south-1', quantity: 2, expiryDate: new Date(Date.now() + 8 * 86400000).toISOString(), daysRemaining: 8, monthlySavings: '$680', paymentOption: 'All Upfront', offeringClass: 'Standard' },
];

var MOCK_SAVINGS_PLANS = [
  { type: 'Compute Savings Plan', commitment: '$2,500/hr', expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(), daysRemaining: 180, coverage: '72%', monthlySavings: '$3,200', term: '1 year' },
  { type: 'EC2 Instance Savings Plan', commitment: '$800/hr', expiryDate: new Date(Date.now() + 22 * 86400000).toISOString(), daysRemaining: 22, coverage: '85%', monthlySavings: '$1,100', term: '1 year' },
];

var MOCK_RDS_RI = [
  { dbInstanceClass: 'db.r5.2xlarge', engine: 'MySQL', region: 'ap-south-1', quantity: 1, expiryDate: new Date(Date.now() + 62 * 86400000).toISOString(), daysRemaining: 62, monthlySavings: '$280', multiAZ: true },
  { dbInstanceClass: 'db.t3.medium', engine: 'PostgreSQL', region: 'ap-south-1', quantity: 2, expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(), daysRemaining: 7, monthlySavings: '$95', multiAZ: false },
];

export default function SSLPanel({ clientId, clientName }) {
  var [sslData, setSslData] = useState(null);
  var [loading, setLoading] = useState(true);
  var [activeTab, setActiveTab] = useState('ssl');

  useEffect(function() {
    api.get('/aws/ssl/' + clientId).then(function() {}).catch(function() {});
    setTimeout(function() {
      setSslData({ ssl: MOCK_SSL, ri: MOCK_RI, savingsPlans: MOCK_SAVINGS_PLANS, rdsRi: MOCK_RDS_RI });
      setLoading(false);
    }, 600);
  }, [clientId]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!sslData) return null;

  var criticalAlerts = [
    ...sslData.ssl.filter(function(d) { return d.sslDaysRemaining <= 14 || d.domainDaysRemaining <= 14; }).map(function(d) { return { type: 'SSL/Domain', item: d.domain, days: Math.min(d.sslDaysRemaining, d.domainDaysRemaining), severity: 'CRITICAL' }; }),
    ...sslData.ri.filter(function(r) { return r.daysRemaining <= 30; }).map(function(r) { return { type: 'EC2 RI', item: r.instanceType + ' x' + r.quantity, days: r.daysRemaining, severity: r.daysRemaining <= 14 ? 'CRITICAL' : 'WARNING' }; }),
    ...sslData.savingsPlans.filter(function(s) { return s.daysRemaining <= 30; }).map(function(s) { return { type: 'Savings Plan', item: s.type, days: s.daysRemaining, severity: s.daysRemaining <= 14 ? 'CRITICAL' : 'WARNING' }; }),
    ...sslData.rdsRi.filter(function(r) { return r.daysRemaining <= 30; }).map(function(r) { return { type: 'RDS RI', item: r.dbInstanceClass + ' (' + r.engine + ')', days: r.daysRemaining, severity: r.daysRemaining <= 14 ? 'CRITICAL' : 'WARNING' }; }),
  ];

  var tabs = [
    { id: 'ssl', label: '🔒 SSL & Domain', count: sslData.ssl.length },
    { id: 'ri', label: '💻 EC2 Reserved Instances', count: sslData.ri.length },
    { id: 'savings', label: '💰 Savings Plans', count: sslData.savingsPlans.length },
    { id: 'rdsri', label: '🗄️ RDS Reserved Instances', count: sslData.rdsRi.length },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>🔒 SSL, Domain & Expiry Monitor</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>SSL certs · Domain renewal · EC2 RIs · Compute Savings Plans · RDS RIs</p>
        </div>
        <button onClick={function() {
          exportToCSV('Expiry_' + clientName,
            ['Type','Item','Days Remaining','Expiry Date','Status'],
            [
              ...sslData.ssl.map(function(d) { return ['SSL', d.domain, d.sslDaysRemaining, new Date(d.sslExpiry).toLocaleDateString(), getDaysStatus(d.sslDaysRemaining).label]; }),
              ...sslData.ri.map(function(r) { return ['EC2 RI', r.instanceType + ' x' + r.quantity, r.daysRemaining, new Date(r.expiryDate).toLocaleDateString(), getDaysStatus(r.daysRemaining).label]; }),
              ...sslData.savingsPlans.map(function(s) { return ['Savings Plan', s.type, s.daysRemaining, new Date(s.expiryDate).toLocaleDateString(), getDaysStatus(s.daysRemaining).label]; }),
              ...sslData.rdsRi.map(function(r) { return ['RDS RI', r.dbInstanceClass, r.daysRemaining, new Date(r.expiryDate).toLocaleDateString(), getDaysStatus(r.daysRemaining).label]; }),
            ]
          );
        }} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📊 Export All</button>
      </div>

      {/* Alert banner */}
      {criticalAlerts.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ color: '#f87171', fontWeight: 700, marginBottom: 10 }}>🚨 {criticalAlerts.length} Expiry Alert(s) Requiring Attention</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {criticalAlerts.map(function(a, i) {
              return (
                <div key={i} style={{ background: a.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: '1px solid ' + (a.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'), borderRadius: 8, padding: '6px 12px', fontSize: 12 }}>
                  <span style={{ color: '#94a3b8' }}>{a.type}:</span> <strong style={{ color: a.severity === 'CRITICAL' ? '#f87171' : '#fbbf24' }}>{a.item}</strong> <span style={{ color: '#4a5878' }}>— {a.days} days</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(function(t) {
          return (
            <button key={t.id} onClick={function() { setActiveTab(t.id); }}
              style={{ padding: '8px 16px', background: activeTab === t.id ? 'rgba(59,130,246,0.12)' : '#111827', border: activeTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2d47', borderRadius: 10, color: activeTab === t.id ? '#60a5fa' : '#8a9bc5', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              {t.label} <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 7px', fontSize: 11 }}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* SSL & Domain */}
      {activeTab === 'ssl' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {sslData.ssl.map(function(d, i) {
            var ss = getDaysStatus(d.sslDaysRemaining);
            var ds = getDaysStatus(d.domainDaysRemaining);
            return (
              <div key={i} style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🌐</div>
                    <div>
                      <div style={{ color: '#f0f4ff', fontWeight: 600, fontSize: 14 }}>{d.domain}</div>
                      <div style={{ color: '#4a5878', fontSize: 11, marginTop: 1 }}>Issuer: {d.sslIssuer}</div>
                    </div>
                  </div>
                  <span style={{ background: d.grade === 'A+' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: d.grade === 'A+' ? '#10b981' : '#f59e0b', border: '1px solid transparent', borderRadius: 8, padding: '4px 12px', fontWeight: 800, fontSize: 14 }}>{d.grade}</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  {[{ label: 'SSL Certificate', days: d.sslDaysRemaining, expiry: d.sslExpiry, status: ss },
                    { label: 'Domain Registration', days: d.domainDaysRemaining, expiry: d.domainExpiry, status: ds }].map(function(item, j) {
                    return (
                      <div key={j} style={{ marginBottom: j === 0 ? 16 : 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#8a9bc5', fontSize: 12, fontWeight: 600 }}>{item.label}</span>
                          <span className={'badge badge-' + item.status.badge} style={{ fontSize: 10 }}>{item.status.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#64748b', fontSize: 12 }}>Expires: {new Date(item.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span style={{ color: item.status.color, fontWeight: 700, fontSize: 14 }}>{item.days} days</span>
                        </div>
                        <div style={{ height: 4, background: '#1e2d47', borderRadius: 3 }}>
                          <div style={{ height: '100%', width: Math.min((item.days / 365) * 100, 100) + '%', background: item.status.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EC2 Reserved Instances */}
      {activeTab === 'ri' && (
        <ExpiryTable title="💻 EC2 Reserved Instances"
          cols={['Instance Type','Region','Qty','Offering Class','Payment','Monthly Savings','Expires','Days Left','Status']}
          rows={sslData.ri.map(function(r) {
            var s = getDaysStatus(r.daysRemaining);
            return [r.instanceType, r.region, r.quantity, r.offeringClass, r.paymentOption, r.monthlySavings,
              new Date(r.expiryDate).toLocaleDateString('en-IN'), r.daysRemaining, s];
          })} />
      )}

      {/* Savings Plans */}
      {activeTab === 'savings' && (
        <ExpiryTable title="💰 Compute Savings Plans"
          cols={['Plan Type','Commitment','Term','Coverage','Monthly Savings','Expires','Days Left','Status']}
          rows={sslData.savingsPlans.map(function(s) {
            var st = getDaysStatus(s.daysRemaining);
            return [s.type, s.commitment, s.term, s.coverage, s.monthlySavings,
              new Date(s.expiryDate).toLocaleDateString('en-IN'), s.daysRemaining, st];
          })} />
      )}

      {/* RDS Reserved Instances */}
      {activeTab === 'rdsri' && (
        <ExpiryTable title="🗄️ RDS Reserved Instances"
          cols={['DB Instance Class','Engine','Region','Qty','Multi-AZ','Monthly Savings','Expires','Days Left','Status']}
          rows={sslData.rdsRi.map(function(r) {
            var s = getDaysStatus(r.daysRemaining);
            return [r.dbInstanceClass, r.engine, r.region, r.quantity, r.multiAZ ? 'Yes' : 'No', r.monthlySavings,
              new Date(r.expiryDate).toLocaleDateString('en-IN'), r.daysRemaining, s];
          })} />
      )}
    </div>
  );
}

function ExpiryTable(props) {
  var title = props.title; var cols = props.cols; var rows = props.rows;
  return (
    <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d1424' }}>
              {cols.map(function(c) { return <th key={c} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c}</th>; })}
            </tr>
          </thead>
          <tbody>
            {rows.map(function(row, i) {
              return (
                <tr key={i} style={{ borderBottom: '1px solid #1a2540' }}>
                  {row.map(function(cell, j) {
                    if (cell && typeof cell === 'object' && cell.badge) {
                      return <td key={j} style={{ padding: '11px 14px' }}><span className={'badge badge-' + cell.badge} style={{ fontSize: 10 }}>{cell.label}</span></td>;
                    }
                    var isLast = j === row.length - 2;
                    return <td key={j} style={{ padding: '11px 14px', fontSize: 12, color: isLast ? '#fbbf24' : j === 0 ? '#e2e8f0' : '#94a3b8', fontWeight: isLast ? 700 : 400, whiteSpace: 'nowrap' }}>{cell}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
