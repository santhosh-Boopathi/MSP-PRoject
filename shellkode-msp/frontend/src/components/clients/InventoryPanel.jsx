import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

var ALL_REGIONS = ['ap-south-1','ap-south-2','ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2','us-east-1','us-east-2','us-west-1','us-west-2','eu-west-1','eu-west-2','eu-central-1','eu-north-1','sa-east-1','ca-central-1','me-south-1','af-south-1'];
var REGION_LABELS = { 'ap-south-1':'Mumbai','ap-south-2':'Hyderabad','ap-southeast-1':'Singapore','ap-southeast-2':'Sydney','ap-northeast-1':'Tokyo','ap-northeast-2':'Seoul','us-east-1':'N. Virginia','us-east-2':'Ohio','us-west-1':'N. California','us-west-2':'Oregon','eu-west-1':'Ireland','eu-west-2':'London','eu-central-1':'Frankfurt','eu-north-1':'Stockholm','sa-east-1':'São Paulo','ca-central-1':'Canada','me-south-1':'Bahrain','af-south-1':'Cape Town' };

var STATE_COLORS = { running: '#10b981', stopped: '#f59e0b', terminated: '#4a5878', 'shutting-down': '#f97316', pending: '#3b82f6', available: '#10b981', creating: '#3b82f6', deleting: '#ef4444' };

function NoData(props) {
  var message = props.message; var icon = props.icon; var sub = props.sub; var onConnect = props.onConnect;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '50px 20px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon || '☁️'}</div>
      <div style={{ color: '#8a9bc5', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{message || 'No Data Available'}</div>
      {sub && <div style={{ color: '#4a5878', fontSize: 12, maxWidth: 360, lineHeight: 1.6, marginBottom: onConnect ? 16 : 0 }}>{sub}</div>}
      {onConnect && (
        <button onClick={onConnect} style={{ marginTop: 10, padding: '8px 20px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          🔑 Add AWS Credentials
        </button>
      )}
    </div>
  );
}

export default function InventoryPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName; var regions = props.regions; var onAddCredentials = props.onAddCredentials;

  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [selectedRegion, setSelectedRegion] = useState('ALL');
  var [activeTab, setActiveTab] = useState('overview');
  var [error, setError] = useState('');
  var [syncing, setSyncing] = useState(false);

  var clientRegions = (regions && regions.length) ? regions : ['ap-south-1'];
  var allRegionOptions = ['ALL', ...clientRegions];

  var fetchInventory = function(regionParam) {
    setLoading(true); setError('');
    var allR = regionParam === 'ALL';
    var url = '/aws/inventory/' + clientId + '?allRegions=' + allR + (regionParam && regionParam !== 'ALL' ? '&region=' + regionParam : '');
    api.get(url)
      .then(function(r) {
        setData(r.data);
        if (r.data && !r.data.hasCredentials) setError(r.data.message || 'AWS credentials not configured');
        else if (r.data && !r.data.hasData && r.data.message) setError(r.data.message);
      })
      .catch(function(e) { setError('Failed to fetch inventory: ' + (e.response ? e.response.data.error : e.message)); })
      .finally(function() { setLoading(false); });
  };

  useEffect(function() { fetchInventory(selectedRegion); }, [clientId, selectedRegion]);

  var handleSync = function() {
    setSyncing(true);
    fetchInventory(selectedRegion);
    setTimeout(function() { setSyncing(false); }, 2000);
  };

  var handleExport = function() {
    if (!data) return;
    var rows = [];
    Object.entries(data.regions || {}).forEach(function(entry) {
      var reg = entry[0]; var rd = entry[1];
      (rd.ec2 || []).forEach(function(i) { rows.push(['EC2', i.id, i.name, i.type, i.state, reg, i.privateIp, i.publicIp || '', i.launchTime ? new Date(i.launchTime).toLocaleDateString() : '']); });
      (rd.rds || []).forEach(function(i) { rows.push(['RDS', i.id, '', i.class, i.status, reg, '', '', '']); });
      (rd.lambda || []).forEach(function(i) { rows.push(['Lambda', i.name, '', i.runtime, '', reg, '', '', i.lastModified ? new Date(i.lastModified).toLocaleDateString() : '']); });
    });
    exportToCSV('Inventory_' + clientName, ['Service', 'ID/Name', 'Name Tag', 'Type/Class', 'State/Status', 'Region', 'Private IP', 'Public IP', 'Date'], rows);
  };

  // Get data for selected region(s)
  var getRegionData = function() {
    if (!data || !data.regions) return null;
    if (selectedRegion === 'ALL') {
      var combined = { ec2: [], rds: [], lambda: [], volumes: [], vpcs: [], securityGroups: [], elasticIPs: [] };
      Object.values(data.regions).forEach(function(rd) {
        Object.keys(combined).forEach(function(k) { combined[k] = combined[k].concat(rd[k] || []); });
      });
      return combined;
    }
    return data.regions[selectedRegion] || null;
  };

  var rd = getRegionData();
  var totals = data ? data.totals : null;

  var SERVICES = [
    { id: 'ec2', label: 'EC2 Instances', icon: '🖥️', color: '#3b82f6' },
    { id: 'rds', label: 'RDS Databases', icon: '🗄️', color: '#8b5cf6' },
    { id: 's3', label: 'S3 Buckets', icon: '🪣', color: '#f59e0b', global: true },
    { id: 'lambda', label: 'Lambda Functions', icon: 'λ', color: '#10b981' },
    { id: 'volumes', label: 'EBS Volumes', icon: '💾', color: '#06b6d4' },
    { id: 'vpcs', label: 'VPCs', icon: '🌐', color: '#f97316' },
    { id: 'securityGroups', label: 'Security Groups', icon: '🔒', color: '#ec4899' },
    { id: 'elasticIPs', label: 'Elastic IPs', icon: '⚡', color: '#ef4444' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>📦 Account Inventory</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Live AWS resource inventory · Select region to filter · Click Sync to refresh</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Region selector */}
          <select value={selectedRegion} onChange={function(e) { setSelectedRegion(e.target.value); }}
            style={{ padding: '8px 14px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {allRegionOptions.map(function(r) {
              return <option key={r} value={r}>{r === 'ALL' ? 'All Regions (' + clientRegions.length + ')' : r + ' — ' + (REGION_LABELS[r] || r)}</option>;
            })}
            {/* Allow selecting other regions too */}
            <optgroup label="Other Regions">
              {ALL_REGIONS.filter(function(r) { return !clientRegions.includes(r); }).map(function(r) {
                return <option key={r} value={r}>{r} — {REGION_LABELS[r] || r}</option>;
              })}
            </optgroup>
          </select>
          <button onClick={handleSync} disabled={loading || syncing}
            style={{ padding: '8px 14px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, color: '#60a5fa', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            {(loading || syncing) ? '🔄 Syncing...' : '🔄 Sync AWS'}
          </button>
          {data && data.hasData && (
            <button onClick={handleExport}
              style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>
              📊 Export
            </button>
          )}
        </div>
      </div>

      {/* Sync timestamp */}
      {data && data.scannedAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: '#4a5878', fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
          Last synced: {new Date(data.scannedAt).toLocaleString('en-IN')} · Data from AWS live account
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 12 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
          <p style={{ color: '#4a5878', fontSize: 13 }}>Fetching live data from AWS · {selectedRegion === 'ALL' ? clientRegions.join(', ') : selectedRegion}</p>
        </div>
      )}

      {/* No credentials */}
      {!loading && error && !data?.hasData && (
        <NoData
          icon={data && !data.hasCredentials ? '🔑' : '⚠️'}
          message={data && !data.hasCredentials ? 'AWS Credentials Not Configured' : 'Unable to Fetch Inventory'}
          sub={error}
          onConnect={data && !data.hasCredentials ? onAddCredentials : null}
        />
      )}

      {/* Has data */}
      {!loading && data && data.hasData && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {SERVICES.map(function(s) {
              var count = s.global ? (data.totals ? data.totals.s3 : 0) : (rd ? (rd[s.id] || []).length : (totals ? totals[s.id] || 0 : 0));
              var label = s.global ? '(Global)' : selectedRegion === 'ALL' ? 'All regions' : selectedRegion;
              return (
                <div key={s.id} onClick={function() { setActiveTab(s.id); }}
                  style={{ background: '#111827', border: '1px solid ' + (activeTab === s.id ? s.color + '55' : s.color + '22'), borderRadius: 12, padding: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Sora',sans-serif", fontSize: count > 0 ? 24 : 20, fontWeight: 800, color: count > 0 ? s.color : '#2a3a58' }}>{count}</div>
                  <div style={{ fontSize: 11, color: '#4a5878', marginTop: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: '#2a3a58', marginTop: 2 }}>{label}</div>
                </div>
              );
            })}
          </div>

          {/* Detail tables */}
          {activeTab === 'overview' || activeTab === 'ec2' ? (
            <ResourceTable
              title="🖥️ EC2 Instances"
              data={rd ? rd.ec2 : []}
              empty="No EC2 instances found in this region"
              cols={['Instance ID', 'Name', 'Type', 'State', 'AZ', 'Private IP', 'Public IP', 'Launch Date']}
              renderRow={function(i) {
                var stColor = STATE_COLORS[i.state] || '#4a5878';
                return [
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{i.id}</span>,
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{i.name}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#06b6d4' }}>{i.type}</span>,
                  <span style={{ background: stColor + '18', color: stColor, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 600 }}>{i.state}</span>,
                  <span style={{ color: '#4a5878', fontSize: 11 }}>{i.az}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{i.privateIp || '—'}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: i.publicIp ? '#f59e0b' : '#2a3a58' }}>{i.publicIp || '—'}</span>,
                  <span style={{ color: '#4a5878', fontSize: 11 }}>{i.launchTime ? new Date(i.launchTime).toLocaleDateString('en-IN') : '—'}</span>,
                ];
              }}
            />
          ) : null}

          {activeTab === 'rds' && (
            <ResourceTable title="🗄️ RDS Instances" data={rd ? rd.rds : []} empty="No RDS instances found"
              cols={['DB Identifier', 'Engine', 'Version', 'Class', 'Status', 'Multi-AZ', 'Storage', 'Endpoint']}
              renderRow={function(i) {
                var stColor = STATE_COLORS[i.status] || '#4a5878';
                return [
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{i.id}</span>,
                  <span style={{ color: '#8b5cf6' }}>{i.engine}</span>,
                  <span style={{ color: '#4a5878', fontSize: 11 }}>{i.engineVersion}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#06b6d4' }}>{i.class}</span>,
                  <span style={{ background: stColor + '18', color: stColor, borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 600 }}>{i.status}</span>,
                  <span style={{ color: i.multiAZ ? '#10b981' : '#4a5878' }}>{i.multiAZ ? '✅ Yes' : '❌ No'}</span>,
                  <span style={{ color: '#8a9bc5' }}>{i.storage} GB</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5878' }}>{i.endpoint || '—'}</span>,
                ];
              }}
            />
          )}

          {activeTab === 's3' && (
            <ResourceTable title="🪣 S3 Buckets (Global)" data={data.s3Buckets || []} empty="No S3 buckets found"
              cols={['Bucket Name', 'Created']}
              renderRow={function(b) {
                return [
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{b.name}</span>,
                  <span style={{ color: '#4a5878', fontSize: 12 }}>{b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN') : '—'}</span>,
                ];
              }}
            />
          )}

          {activeTab === 'lambda' && (
            <ResourceTable title="λ Lambda Functions" data={rd ? rd.lambda : []} empty="No Lambda functions found"
              cols={['Function Name', 'Runtime', 'Memory', 'Timeout', 'Last Modified']}
              renderRow={function(f) {
                return [
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{f.name}</span>,
                  <span style={{ color: '#10b981', fontFamily: 'monospace', fontSize: 11 }}>{f.runtime || '—'}</span>,
                  <span style={{ color: '#8a9bc5' }}>{f.memory} MB</span>,
                  <span style={{ color: '#8a9bc5' }}>{f.timeout}s</span>,
                  <span style={{ color: '#4a5878', fontSize: 11 }}>{f.lastModified ? new Date(f.lastModified).toLocaleDateString('en-IN') : '—'}</span>,
                ];
              }}
            />
          )}

          {activeTab === 'volumes' && (
            <ResourceTable title="💾 EBS Volumes" data={rd ? rd.volumes : []} empty="No EBS volumes found"
              cols={['Volume ID', 'Size', 'Type', 'State', 'Encrypted', 'Attached To', 'AZ']}
              renderRow={function(v) {
                var stColor = STATE_COLORS[v.state] || '#4a5878';
                return [
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{v.id}</span>,
                  <span style={{ color: '#8a9bc5' }}>{v.size} GB</span>,
                  <span style={{ color: '#06b6d4', fontFamily: 'monospace', fontSize: 11 }}>{v.type}</span>,
                  <span style={{ background: stColor + '18', color: stColor, borderRadius: 20, padding: '2px 8px', fontSize: 10 }}>{v.state}</span>,
                  <span style={{ color: v.encrypted ? '#10b981' : '#ef4444' }}>{v.encrypted ? '✅' : '❌'}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a5878' }}>{v.attachedTo || 'Not attached'}</span>,
                  <span style={{ color: '#4a5878', fontSize: 11 }}>{v.az}</span>,
                ];
              }}
            />
          )}

          {activeTab === 'vpcs' && (
            <ResourceTable title="🌐 VPCs" data={rd ? rd.vpcs : []} empty="No VPCs found"
              cols={['VPC ID', 'CIDR Block', 'Default', 'State']}
              renderRow={function(v) {
                return [
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#e2e8f0' }}>{v.id}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#06b6d4' }}>{v.cidr}</span>,
                  <span style={{ color: v.isDefault ? '#f59e0b' : '#4a5878' }}>{v.isDefault ? '⭐ Default' : 'Custom'}</span>,
                  <span style={{ color: '#10b981' }}>{v.state}</span>,
                ];
              }}
            />
          )}

          {activeTab === 'securityGroups' && (
            <ResourceTable title="🔒 Security Groups" data={rd ? rd.securityGroups : []} empty="No security groups found"
              cols={['Group ID', 'Name', 'VPC ID', 'Inbound Rules']}
              renderRow={function(sg) {
                return [
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{sg.id}</span>,
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{sg.name}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{sg.vpcId || '—'}</span>,
                  <span style={{ color: sg.inboundRules > 5 ? '#f59e0b' : '#8a9bc5' }}>{sg.inboundRules} rules</span>,
                ];
              }}
            />
          )}

          {activeTab === 'elasticIPs' && (
            <ResourceTable title="⚡ Elastic IPs" data={rd ? rd.elasticIPs : []} empty="No Elastic IPs found"
              cols={['Allocation ID', 'Public IP', 'Associated', 'Instance']}
              renderRow={function(eip) {
                return [
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b' }}>{eip.allocationId}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#f59e0b' }}>{eip.publicIp}</span>,
                  <span style={{ color: eip.associated ? '#10b981' : '#ef4444' }}>{eip.associated ? '✅ In use' : '❌ Unused (wasting $3.65/mo)'}</span>,
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4a5878' }}>{eip.instanceId || '—'}</span>,
                ];
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

function ResourceTable(props) {
  var title = props.title; var data = props.data; var empty = props.empty; var cols = props.cols; var renderRow = props.renderRow;
  return (
    <div style={{ background: '#111827', border: '1px solid #1e2d47', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #1a2540', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{title}</span>
        <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{data.length} items</span>
      </div>
      {data.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#4a5878', fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
          {empty || 'No items found'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0d1424' }}>
                {cols.map(function(c) { return <th key={c} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c}</th>; })}
              </tr>
            </thead>
            <tbody>
              {data.map(function(item, i) {
                var cells = renderRow(item);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1a2540', transition: 'background 0.1s' }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
                    {cells.map(function(cell, j) { return <td key={j} style={{ padding: '11px 14px', fontSize: 12 }}>{cell}</td>; })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
