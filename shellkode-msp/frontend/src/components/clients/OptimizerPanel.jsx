import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToHTML, exportToCSV } from '../../utils/exportUtils';

export default function OptimizerPanel({ clientId, clientName }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ec2');

  useEffect(() => {
    api.get(`/aws/optimizer/${clientId}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} /></div>;
  if (!data) return null;

  const tabs = [
    { id: 'ec2', label: '🖥️ EC2', count: data.ec2Recommendations.length },
    { id: 'ebs', label: '💾 EBS', count: data.ebsRecommendations.length },
    { id: 'lambda', label: 'λ Lambda', count: data.lambdaRecommendations.length },
    { id: 'rds', label: '🗄️ RDS', count: data.rdsRecommendations.length },
  ];

  const handleExportHTML = () => {
    const allRecs = [...data.ec2Recommendations, ...data.ebsRecommendations, ...data.lambdaRecommendations, ...data.rdsRecommendations];
    const content = `
      <div class="section">
        <div class="section-title">AWS Compute Optimizer Recommendations — ${clientName}</div>
        <div class="summary-grid">
          <div class="summary-card"><div class="value" style="color:#3b82f6">${data.ec2Recommendations.length}</div><div class="label">EC2 Recommendations</div></div>
          <div class="summary-card"><div class="value" style="color:#8b5cf6">${data.ebsRecommendations.length}</div><div class="label">EBS Recommendations</div></div>
          <div class="summary-card"><div class="value" style="color:#10b981">${data.lambdaRecommendations.length}</div><div class="label">Lambda Recommendations</div></div>
          <div class="summary-card"><div class="value" style="color:#f59e0b">${data.rdsRecommendations.length}</div><div class="label">RDS Recommendations</div></div>
          <div class="summary-card"><div class="value" style="color:#ef4444">${data.totalMonthlySavings}</div><div class="label">Total Monthly Savings</div></div>
        </div>
      </div>
    `;
    exportToHTML(`Compute Optimizer — ${clientName}`, content);
  };

  const renderTable = (recommendations, type) => {
    if (!recommendations.length) return (
      <div style={{ padding: 24, textAlign: 'center', color: '#10b981', fontSize: 14 }}>✅ No rightsizing recommendations — resources are optimally sized!</div>
    );

    const getColumns = () => {
      switch(type) {
        case 'ec2': return ['Instance ID', 'Current Type', 'Recommended', 'CPU Util', 'Current Cost', 'Projected Cost', 'Savings/Month', 'Reason'];
        case 'ebs': return ['Volume ID', 'Current Type', 'Recommended', 'Size', 'Current Cost', 'Projected Cost', 'Savings/Month', 'Reason'];
        case 'lambda': return ['Function', 'Current Memory', 'Recommended', 'Current Cost', 'Projected Cost', 'Savings/Month', 'Reason'];
        case 'rds': return ['DB Instance', 'Current Class', 'Recommended', 'Current Cost', 'Projected Cost', 'Savings/Month', 'Reason'];
        default: return [];
      }
    };

    const getRow = (r) => {
      switch(type) {
        case 'ec2': return [r.instanceId, r.instanceType, r.recommendedType, r.cpuUtilization, r.currentCost, r.projectedCost, r.savings, r.reason];
        case 'ebs': return [r.volumeId, r.volumeType, r.recommendedType, r.size, r.currentCost, r.projectedCost, r.savings, r.reason];
        case 'lambda': return [r.functionName, r.currentMemory, r.recommendedMemory, r.currentCost, r.projectedCost, r.savings, r.reason];
        case 'rds': return [r.dbInstanceId, r.instanceClass, r.recommendedClass, r.currentCost, r.projectedCost, r.savings, r.reason];
        default: return [];
      }
    };

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d1424' }}>
              {getColumns().map(c => <th key={c} style={{ padding: '10px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {recommendations.map((r, i) => {
              const row = getRow(r);
              return (
                <tr key={i} style={{ borderBottom: '1px solid #1a2540', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding: '11px 14px', fontSize: 12, whiteSpace: j < 3 ? 'nowrap' : 'normal',
                      color: j === 6 ? '#10b981' : j === 2 ? '#06b6d4' : j === 0 ? '#64748b' : '#94a3b8',
                      fontWeight: j === 6 ? 700 : 400,
                      fontFamily: j === 0 ? 'monospace' : 'inherit',
                    }}>{cell}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const currentRecs = {
    ec2: data.ec2Recommendations, ebs: data.ebsRecommendations,
    lambda: data.lambdaRecommendations, rds: data.rdsRecommendations
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>⚡ AWS Compute Optimizer</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Right-sizing recommendations · EC2, EBS, Lambda, RDS, Auto Scaling</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExportHTML} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif" }}>📄 Export Report</button>
        </div>
      </div>

      {/* Savings banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>💡 POTENTIAL SAVINGS IDENTIFIED</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 32, fontWeight: 800, color: '#34d399' }}>{data.totalMonthlySavings}/month</div>
          <div style={{ color: '#4a5878', fontSize: 12, marginTop: 2 }}>by rightsizing underutilized resources</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {tabs.map(t => (
            <div key={t.id} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 16px' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f4ff' }}>{t.count}</div>
              <div style={{ fontSize: 11, color: '#4a5878' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: '8px 16px', background: activeTab === t.id ? 'rgba(59,130,246,0.12)' : '#111827', border: activeTab === t.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid #1e2d47', borderRadius: 10, color: activeTab === t.id ? '#60a5fa' : '#8a9bc5', fontSize: 13, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
            {t.label}
            <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 8px', fontSize: 11 }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>
          {tabs.find(t => t.id === activeTab)?.label} Rightsizing Recommendations
        </div>
        {renderTable(currentRecs[activeTab], activeTab)}
      </div>
    </div>
  );
}
