import React, { useState } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

var REGION_LABELS = {'ap-south-1':'Mumbai','ap-south-2':'Hyderabad','ap-southeast-1':'Singapore','ap-southeast-2':'Sydney','ap-northeast-1':'Tokyo','ap-northeast-2':'Seoul','us-east-1':'N. Virginia','us-east-2':'Ohio','us-west-1':'N. California','us-west-2':'Oregon','eu-west-1':'Ireland','eu-west-2':'London','eu-central-1':'Frankfurt','eu-north-1':'Stockholm','sa-east-1':'São Paulo','ca-central-1':'Canada','me-south-1':'Bahrain','af-south-1':'Cape Town'};
var STATE_COLORS = { running:'#10b981', stopped:'#f59e0b', terminated:'#4a5878', available:'#10b981', creating:'#3b82f6' };

export default function InventoryPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var regions = props.regions || ['ap-south-1']; var onAddCredentials = props.onAddCredentials;

  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [selectedRegion, setSelectedRegion] = useState('ALL');
  var [activeTab, setActiveTab] = useState('ec2');
  var [error, setError] = useState('');

  var allRegionOptions = ['ALL', ...regions];

  var fetchInventory = function() {
    setLoading(true); setError('');
    var allR = selectedRegion === 'ALL';
    var url = '/aws/inventory/' + clientId + '?allRegions=' + allR + (!allR ? '&region=' + selectedRegion : '');
    api.get(url)
      .then(function(r) {
        setData(r.data);
        if (!r.data.hasCredentials) setError(r.data.message || 'AWS credentials not configured');
        else if (!r.data.hasData && r.data.message) setError(r.data.message);
      })
      .catch(function(e) { setError('Failed: ' + (e.response ? e.response.data.error : e.message)); })
      .finally(function() { setLoading(false); });
  };

  var handleExport = function() {
    if (!data) return;
    var rows = [];
    Object.entries(data.regions || {}).forEach(function(e) {
      var reg = e[0]; var rd = e[1];
      (rd.ec2 || []).forEach(function(i) { rows.push(['EC2', i.id, i.name, i.type, i.state, reg, i.privateIp || '', i.publicIp || '']); });
      (rd.rds || []).forEach(function(i) { rows.push(['RDS', i.id, '', i.class, i.status, reg, '', '']); });
      (rd.lambda || []).forEach(function(i) { rows.push(['Lambda', i.name, '', i.runtime || '', '', reg, '', '']); });
    });
    exportToCSV('Inventory_' + clientName, ['Service', 'ID', 'Name', 'Type', 'State', 'Region', 'Private IP', 'Public IP'], rows);
  };

  var getRegionData = function() {
    if (!data || !data.regions) return null;
    if (selectedRegion === 'ALL') {
      var combined = { ec2: [], rds: [], lambda: [], volumes: [], vpcs: [], securityGroups: [], elasticIPs: [] };
      Object.values(data.regions).forEach(function(rd) { Object.keys(combined).forEach(function(k) { combined[k] = combined[k].concat(rd[k] || []); }); });
      return combined;
    }
    return data.regions[selectedRegion] || { ec2: [], rds: [], lambda: [], volumes: [], vpcs: [], securityGroups: [], elasticIPs: [] };
  };

  var rd = getRegionData();
  var totals = data ? data.totals : null;

  var TABS = [
    { id:'ec2', label:'🖥️ EC2', count: rd ? rd.ec2.length : (totals ? totals.ec2 : 0) },
    { id:'rds', label:'🗄️ RDS', count: rd ? rd.rds.length : (totals ? totals.rds : 0) },
    { id:'s3', label:'🪣 S3', count: totals ? totals.s3 : 0 },
    { id:'lambda', label:'λ Lambda', count: rd ? rd.lambda.length : (totals ? totals.lambda : 0) },
    { id:'volumes', label:'💾 EBS', count: rd ? rd.volumes.length : (totals ? totals.volumes : 0) },
    { id:'vpcs', label:'🌐 VPCs', count: rd ? rd.vpcs.length : (totals ? totals.vpcs : 0) },
    { id:'sgs', label:'🔒 Sec Groups', count: rd ? rd.securityGroups.length : (totals ? totals.securityGroups : 0) },
    { id:'eips', label:'⚡ EIPs', count: rd ? rd.elasticIPs.length : (totals ? totals.elasticIPs : 0) },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontFamily: "'Sora',sans-serif", fontSize: 22, fontWeight: 700, color: '#f0f4ff', marginBottom: 4 }}>📦 Account Inventory</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Live AWS resource inventory — click "Sync AWS" to fetch current data</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedRegion} onChange={function(e) { setSelectedRegion(e.target.value); setData(null); }}
            style={{ padding: '8px 12px', background: '#111827', border: '1px solid #1e2d47', borderRadius: 10, color: '#f0f4ff', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            {allRegionOptions.map(function(r) {
              return <option key={r} value={r}>{r === 'ALL' ? 'All Regions (' + regions.length + ')' : r + ' — ' + (REGION_LABELS[r] || r)}</option>;
            })}
          </select>
          <button onClick={fetchInventory} disabled={loading}
            style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Syncing...</> : '🔄 Sync AWS'}
          </button>
          {data && data.hasData && (
            <button onClick={handleExport} style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid #2a3a58', borderRadius: 10, color: '#8a9bc5', fontSize: 13, cursor: 'pointer' }}>📊 Export</button>
          )}
        </div>
      </div>

      {data && data.scannedAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, color: '#10b981', fontSize: 11 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          Live data from AWS · Last synced: {new Date(data.scannedAt).toLocaleString('en-IN')}
        </div>
      )}

      {!data && !loading && (
        <div style={{ textAlign: 'center', padding: 60, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📦</div>
          <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Inventory Not Loaded</div>
          <div style={{ color: '#4a5878', fontSize: 13, maxWidth: 400, margin: '0 auto 20px' }}>
            Click "Sync AWS" to fetch live EC2, RDS, S3, Lambda, EBS, VPC and Security Group data from your AWS account.
          </div>
          <button onClick={fetchInventory} style={{ padding: '11px 28px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', border: 'none', borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            🔄 Sync AWS Now
          </button>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3, marginBottom: 14 }} />
          <div style={{ color: '#8a9bc5' }}>Fetching inventory from AWS...</div>
          <div style={{ color: '#4a5878', fontSize: 12, marginTop: 6 }}>EC2 · RDS · S3 · Lambda · EBS · VPC · Security Groups</div>
        </div>
      )}

      {!loading && error && (
        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: 13, marginBottom: 3 }}>Unable to fetch inventory</div>
            <div style={{ color: '#4a5878', fontSize: 12 }}>{error}</div>
          </div>
          {!data?.hasCredentials && (
            <button onClick={onAddCredentials} style={{ marginLeft: 'auto', padding: '7px 14px', background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', border: 'none', borderRadius: 8, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>Add Keys</button>
          )}
        </div>
      )}

      {data && data.hasData && (
        <>
          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {TABS.map(function(t) {
              return (
                <button key={t.id} onClick={function() { setActiveTab(t.id); }}
                  style={{ padding: '7px 14px', background: activeTab === t.id ? 'rgba(59,130,246,0.12)' : '#111827', border: '1px solid ' + (activeTab === t.id ? 'rgba(59,130,246,0.35)' : '#1e2d47'), borderRadius: 9, color: activeTab === t.id ? '#60a5fa' : '#4a5878', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {t.label}
                  <span style={{ background: (t.count > 0 ? (activeTab === t.id ? 'rgba(59,130,246,0.2)' : '#1e2d47') : 'transparent'), borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700, color: t.count > 0 ? (activeTab === t.id ? '#60a5fa' : '#8a9bc5') : '#2a3a58' }}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* EC2 Table */}
          {activeTab === 'ec2' && <ResourceTable title="🖥️ EC2 Instances" data={rd ? rd.ec2 : []} empty="No EC2 instances in selected region(s)"
            cols={['Instance ID','Name','Type','State','AZ','Private IP','Public IP','Launch Date']}
            renderRow={function(i) {
              var sc = STATE_COLORS[i.state] || '#4a5878';
              return [
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{i.id}</span>,
                <span style={{ fontWeight:600, color:'#e2e8f0' }}>{i.name}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#06b6d4' }}>{i.type}</span>,
                <span style={{ background:sc+'18', color:sc, borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:600 }}>{i.state}</span>,
                <span style={{ color:'#4a5878', fontSize:11 }}>{i.az}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#4a5878' }}>{i.privateIp||'—'}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:i.publicIp?'#f59e0b':'#2a3a58' }}>{i.publicIp||'—'}</span>,
                <span style={{ color:'#4a5878', fontSize:11 }}>{i.launchTime?new Date(i.launchTime).toLocaleDateString('en-IN'):'—'}</span>,
              ];
            }} />}

          {activeTab === 'rds' && <ResourceTable title="🗄️ RDS Instances" data={rd ? rd.rds : []} empty="No RDS instances found"
            cols={['DB Identifier','Engine','Version','Class','Status','Multi-AZ','Storage']}
            renderRow={function(i) {
              var sc = STATE_COLORS[i.status] || '#4a5878';
              return [
                <span style={{ fontWeight:600, color:'#e2e8f0' }}>{i.id}</span>,
                <span style={{ color:'#8b5cf6' }}>{i.engine}</span>,
                <span style={{ color:'#4a5878', fontSize:11 }}>{i.engineVersion}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#06b6d4' }}>{i.class}</span>,
                <span style={{ background:sc+'18', color:sc, borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:600 }}>{i.status}</span>,
                <span style={{ color:i.multiAZ?'#10b981':'#4a5878' }}>{i.multiAZ?'✅ Yes':'❌ No'}</span>,
                <span style={{ color:'#8a9bc5' }}>{i.storage} GB</span>,
              ];
            }} />}

          {activeTab === 's3' && <ResourceTable title="🪣 S3 Buckets (Global)" data={data.s3Buckets || []} empty="No S3 buckets found"
            cols={['Bucket Name','Created']}
            renderRow={function(b) {
              return [
                <span style={{ fontFamily:'monospace', fontSize:12, color:'#e2e8f0', fontWeight:500 }}>{b.name}</span>,
                <span style={{ color:'#4a5878', fontSize:12 }}>{b.createdAt?new Date(b.createdAt).toLocaleDateString('en-IN'):'—'}</span>,
              ];
            }} />}

          {activeTab === 'lambda' && <ResourceTable title="λ Lambda Functions" data={rd ? rd.lambda : []} empty="No Lambda functions found"
            cols={['Function Name','Runtime','Memory','Timeout','Last Modified']}
            renderRow={function(f) {
              return [
                <span style={{ fontWeight:600, color:'#e2e8f0' }}>{f.name}</span>,
                <span style={{ color:'#10b981', fontFamily:'monospace', fontSize:11 }}>{f.runtime||'—'}</span>,
                <span style={{ color:'#8a9bc5' }}>{f.memory} MB</span>,
                <span style={{ color:'#8a9bc5' }}>{f.timeout}s</span>,
                <span style={{ color:'#4a5878', fontSize:11 }}>{f.lastModified?new Date(f.lastModified).toLocaleDateString('en-IN'):'—'}</span>,
              ];
            }} />}

          {activeTab === 'volumes' && <ResourceTable title="💾 EBS Volumes" data={rd ? rd.volumes : []} empty="No EBS volumes found"
            cols={['Volume ID','Size','Type','State','Encrypted','Attached To','AZ']}
            renderRow={function(v) {
              var sc = STATE_COLORS[v.state] || '#4a5878';
              return [
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{v.id}</span>,
                <span style={{ color:'#8a9bc5' }}>{v.size} GB</span>,
                <span style={{ color:'#06b6d4', fontFamily:'monospace', fontSize:11 }}>{v.type}</span>,
                <span style={{ background:sc+'18', color:sc, borderRadius:20, padding:'2px 8px', fontSize:10 }}>{v.state}</span>,
                <span style={{ color:v.encrypted?'#10b981':'#ef4444' }}>{v.encrypted?'✅':'❌'}</span>,
                <span style={{ fontFamily:'monospace', fontSize:10, color:'#4a5878' }}>{v.attachedTo||'Not attached'}</span>,
                <span style={{ color:'#4a5878', fontSize:11 }}>{v.az}</span>,
              ];
            }} />}

          {activeTab === 'vpcs' && <ResourceTable title="🌐 VPCs" data={rd ? rd.vpcs : []} empty="No VPCs found"
            cols={['VPC ID','CIDR Block','Default','State']}
            renderRow={function(v) {
              return [
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#e2e8f0' }}>{v.id}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#06b6d4' }}>{v.cidr}</span>,
                <span style={{ color:v.isDefault?'#f59e0b':'#4a5878' }}>{v.isDefault?'⭐ Default':'Custom'}</span>,
                <span style={{ color:'#10b981' }}>{v.state}</span>,
              ];
            }} />}

          {activeTab === 'sgs' && <ResourceTable title="🔒 Security Groups" data={rd ? rd.securityGroups : []} empty="No security groups found"
            cols={['Group ID','Name','VPC ID','Inbound Rules']}
            renderRow={function(sg) {
              return [
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{sg.id}</span>,
                <span style={{ color:'#e2e8f0', fontWeight:500 }}>{sg.name}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#4a5878' }}>{sg.vpcId||'—'}</span>,
                <span style={{ color:sg.inboundRules>5?'#f59e0b':'#8a9bc5' }}>{sg.inboundRules} rules</span>,
              ];
            }} />}

          {activeTab === 'eips' && <ResourceTable title="⚡ Elastic IPs" data={rd ? rd.elasticIPs : []} empty="No Elastic IPs found"
            cols={['Allocation ID','Public IP','Status','Instance']}
            renderRow={function(eip) {
              return [
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#64748b' }}>{eip.allocationId}</span>,
                <span style={{ fontFamily:'monospace', fontSize:12, color:'#f59e0b' }}>{eip.publicIp}</span>,
                <span style={{ color:eip.associated?'#10b981':'#ef4444' }}>{eip.associated?'✅ In use':'❌ Unused ($3.65/mo)'}</span>,
                <span style={{ fontFamily:'monospace', fontSize:11, color:'#4a5878' }}>{eip.instanceId||'—'}</span>,
              ];
            }} />}
        </>
      )}

      {data && !data.hasData && !error && (
        <div style={{ textAlign: 'center', padding: 40, background: '#111827', border: '1px solid #1e2d47', borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <div style={{ color: '#8a9bc5', fontSize: 14 }}>No resources found in {selectedRegion === 'ALL' ? 'any configured region' : selectedRegion}</div>
          <div style={{ color: '#4a5878', fontSize: 12, marginTop: 4 }}>{data.note || 'This account may not have resources in the selected region(s)'}</div>
        </div>
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
          {empty}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#0d1424' }}>{cols.map(function(c) { return <th key={c} style={{ padding: '9px 14px', textAlign: 'left', color: '#4a5878', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{c}</th>; })}</tr></thead>
            <tbody>
              {data.map(function(item, i) {
                var cells = renderRow(item);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #1a2540', transition: 'background 0.1s' }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.015)'; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}>
                    {cells.map(function(cell, j) { return <td key={j} style={{ padding: '10px 14px', fontSize: 12 }}>{cell}</td>; })}
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
