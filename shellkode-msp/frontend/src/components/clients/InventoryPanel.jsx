import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const REGIONS = ['ap-south-1', 'ap-south-2', 'us-east-1', 'us-west-2', 'ap-southeast-1', 'eu-west-1'];

export default function InventoryPanel({ clientId, clientName, regions }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState((regions || [])[0] || 'ap-south-1');

  const fetchInventory = (region) => {
    setLoading(true);
    api.get(`/aws/inventory/${clientId}?region=${region}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInventory(selectedRegion); }, [clientId, selectedRegion]);

  const serviceCards = data ? [
    { label: 'EC2 Instances', value: data.ec2.total, sub: `${data.ec2.running} running · ${data.ec2.stopped} stopped`, icon: '🖥️', color: '#3b82f6' },
    { label: 'RDS Instances', value: data.rds.total, sub: `${data.rds.available} available · ${data.rds.stopped} stopped`, icon: '🗄️', color: '#8b5cf6' },
    { label: 'S3 Buckets', value: data.s3Buckets, sub: 'All regions', icon: '🪣', color: '#f59e0b' },
    { label: 'Lambda Functions', value: data.lambdaFunctions, sub: selectedRegion, icon: 'λ', color: '#10b981' },
    { label: 'ECS Services', value: data.ecsServices, sub: selectedRegion, icon: '📦', color: '#06b6d4' },
    { label: 'EKS Clusters', value: data.eksCluster, sub: selectedRegion, icon: '☸️', color: '#f97316' },
    { label: 'Elastic IPs', value: data.elasticIPs, sub: `${selectedRegion}`, icon: '⚡', color: '#ef4444' },
    { label: 'Security Groups', value: data.securityGroups, sub: selectedRegion, icon: '🔒', color: '#ec4899' },
    { label: 'VPCs', value: data.vpcs, sub: selectedRegion, icon: '🌐', color: '#14b8a6' },
  ] : [];

  const clientRegions = regions?.length ? regions : ['ap-south-1'];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>📦 Account Inventory</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Resource inventory across AWS regions</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
            style={{ padding: '9px 14px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {clientRegions.map(r => <option key={r} value={r}>{r}</option>)}
            {REGIONS.filter(r => !clientRegions.includes(r)).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {data && (
            <button onClick={() => exportToCSV(`Inventory_${clientName}_${selectedRegion}`,
              ['Instance ID', 'Name', 'Type', 'State', 'Region', 'AZ', 'Private IP', 'Launch Time'],
              data.instances.map(i => [i.id, i.name, i.type, i.state, i.region, i.az, i.privateIp, i.launchTime])
            )} style={{ padding: '9px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>
              📊 Export
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
        </div>
      ) : data && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 24 }}>
            {serviceCards.map((s, i) => (
              <div key={i} style={{ background: '#111827', border: `1px solid ${s.color}22`, borderRadius: 12, padding: '16px 14px' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#8a9bc5', marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#4a5878', marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* EC2 instances table */}
          <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#8a9bc5', fontSize: 13, fontWeight: 600 }}>EC2 Instances · {selectedRegion}</span>
              <span style={{ color: '#4a5878', fontSize: 12 }}>{data.instances.length} instances</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d1424' }}>
                  {['Instance ID', 'Name', 'Type', 'State', 'AZ', 'Private IP', 'Launch Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#4a5878', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.instances.map((inst, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1a2540', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{inst.id}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{inst.name}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#06b6d4', fontFamily: 'monospace' }}>{inst.type}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: inst.state === 'running' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        border: `1px solid ${inst.state === 'running' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        color: inst.state === 'running' ? '#10b981' : '#f59e0b',
                        borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                        {inst.state}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#4a5878', fontFamily: 'monospace' }}>{inst.az}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#4a5878', fontFamily: 'monospace' }}>{inst.privateIp}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#4a5878' }}>{inst.launchTime}</td>
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
