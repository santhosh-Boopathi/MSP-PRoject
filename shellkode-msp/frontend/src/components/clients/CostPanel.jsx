import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart } from 'recharts';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

var COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#06b6d4','#ef4444','#f97316','#ec4899','#14b8a6','#6366f1','#84cc16','#a855f7'];

function NoDataState(props) {
  return (
    <div style={{ padding:props.compact?20:50, background:'#111827', border:'1px solid #1e2d47', borderRadius:14, textAlign:'center' }}>
      <div style={{ fontSize:props.compact?28:44, marginBottom:10 }}>{props.icon||'💰'}</div>
      <div style={{ color:'#8a9bc5', fontSize:props.compact?13:15, fontWeight:600, marginBottom:4 }}>{props.title||'No Data'}</div>
      <div style={{ color:'#4a5878', fontSize:12, maxWidth:360, margin:'0 auto', marginBottom: props.onAction?14:0, lineHeight:1.6 }}>{props.message}</div>
      {props.onAction && <button onClick={props.onAction} style={{ padding:'9px 20px', background:'linear-gradient(135deg, #3b82f6, #06b6d4)', border:'none', borderRadius:9, color:'white', fontSize:13, fontWeight:600, cursor:'pointer' }}>{props.actionLabel}</button>}
    </div>
  );
}

export default function CostPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var [data, setData] = useState(null);
  var [wasteData, setWasteData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [loadingWaste, setLoadingWaste] = useState(false);
  var [tab, setTab] = useState('overview');

  var fetchCost = function() {
    setLoading(true); setData(null);
    api.get('/aws/cost/' + clientId).then(function(r) { setData(r.data); }).catch(function(e) {
      setData({ hasCredentials: false, hasData: false, message: e.response?.data?.error || e.message });
    }).finally(function() { setLoading(false); });
  };

  var fetchWaste = function() {
    setLoadingWaste(true); setWasteData(null);
    api.get('/aws/waste/' + clientId).then(function(r) { setWasteData(r.data); }).catch(function(e) {
      setWasteData({ hasCredentials: false, hasData: false, message: e.response?.data?.error || e.message });
    }).finally(function() { setLoadingWaste(false); });
  };

  var change = data?.totalLastMonth && data?.totalTwoMonthsAgo ? (((data.totalLastMonth - data.totalTwoMonthsAgo) / data.totalTwoMonthsAgo) * 100).toFixed(1) : 0;
  var isUp = parseFloat(change) > 0;

  var tabs = [
    { id:'overview', label:'📊 Overview' },
    { id:'comparison', label:'📈 MoM Comparison' },
    { id:'services', label:'🔧 By Service' },
    { id:'waste', label:'♻️ Waste & Cleanup' },
    { id:'anomalies', label:'⚠️ Anomalies' },
  ];

  return (
    <div style={{ animation:'fadeIn 0.4s ease' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#f0f4ff', marginBottom:4 }}>💰 Cost Optimization</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>Real AWS Cost Explorer data — click to fetch latest billing information</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={fetchCost} disabled={loading}
            style={{ padding:'10px 20px', background:'linear-gradient(135deg, #f59e0b, #d97706)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, display:'flex', alignItems:'center', gap:8 }}>
            {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}}/> Fetching...</> : '💰 Fetch Cost Data'}
          </button>
          {data?.hasData && <button onClick={function(){exportToCSV('Cost_'+clientName,['Service','Last Month','2 Months Ago','% Change'],(data.serviceBreakdown||[]).map(function(s){return[s.service,'$'+(s.lastMonth||0).toLocaleString(),'$'+(s.twoMonthsAgo||0).toLocaleString(),s.percentage+'%'];}));}} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid #2a3a58', borderRadius:10, color:'#8a9bc5', fontSize:13, cursor:'pointer' }}>📊 CSV</button>}
        </div>
      </div>

      {/* Not loaded */}
      {!data && !loading && <NoDataState icon="💰" title="Cost Data Not Loaded" message="Click 'Fetch Cost Data' to pull real billing data from AWS Cost Explorer for the last 6 months." onAction={fetchCost} actionLabel="💰 Fetch Cost Data" />}
      {loading && <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:240, background:'#111827', border:'1px solid #1e2d47', borderRadius:14 }}><div className="spinner" style={{ width:36, height:36, borderWidth:3, marginBottom:14 }} /><div style={{ color:'#8a9bc5' }}>Fetching cost data from AWS Cost Explorer...</div><div style={{ color:'#4a5878', fontSize:12, marginTop:6 }}>This may take a few seconds</div></div>}

      {data && !data.hasCredentials && <NoDataState icon="🔑" title="AWS Credentials Not Configured" message={data.message} />}
      {data && data.hasCredentials && !data.hasData && <NoDataState icon="❌" title="Cost Data Unavailable" message={data.message} onAction={data.credentialError ? null : fetchCost} actionLabel="Retry" />}

      {data?.hasData && (
        <>
          {/* KPI Strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12, marginBottom:18 }}>
            {[
              { l:'Last Month', v:'$'+(data.totalLastMonth/1000).toFixed(1)+'K', c:'#3b82f6' },
              { l:'2 Months Ago', v:'$'+(data.totalTwoMonthsAgo/1000).toFixed(1)+'K', c:'#8b5cf6' },
              { l:'MoM Change', v:(isUp?'↑':'↓')+' '+Math.abs(change)+'%', c:isUp?'#ef4444':'#10b981' },
              { l:'Anomalies', v:(data.anomalies||[]).length, c:'#f59e0b' },
              { l:'Scanned', v:data.scannedAt?new Date(data.scannedAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}):'—', c:'#4a5878' },
            ].map(function(s,i){ return <div key={i} style={{ background:'#111827', border:'1px solid '+s.c+'22', borderRadius:12, padding:'12px 14px' }}><div style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ color:'#4a5878', fontSize:11, marginTop:3 }}>{s.l}</div></div>; })}
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
            {tabs.map(function(t){
              return <button key={t.id} onClick={function(){setTab(t.id); if(t.id==='waste'&&!wasteData)fetchWaste();}} style={{ padding:'7px 14px', background:tab===t.id?'rgba(59,130,246,0.12)':'#111827', border:'1px solid '+(tab===t.id?'rgba(59,130,246,0.3)':'#1e2d47'), borderRadius:9, color:tab===t.id?'#60a5fa':'#8a9bc5', fontSize:13, cursor:'pointer' }}>{t.label}</button>;
            })}
          </div>

          {/* Overview */}
          {tab==='overview' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, padding:18 }}>
                <div style={{ color:'#8a9bc5', fontSize:13, fontWeight:600, marginBottom:14 }}>Monthly Spend</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.monthlyTrend||[]}>
                    <XAxis dataKey="month" tick={{fill:'#4a5878',fontSize:11}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fill:'#4a5878',fontSize:11}} axisLine={false} tickLine={false} tickFormatter={function(v){return '$'+(v/1000).toFixed(0)+'K';}}/>
                    <Tooltip contentStyle={{background:'#111827',border:'1px solid #1e2d47',borderRadius:8,color:'#f0f4ff'}} formatter={function(v){return ['$'+Number(v).toLocaleString(),'Cost'];}}/>
                    <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2.5} dot={{fill:'#3b82f6',r:4}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, padding:18 }}>
                <div style={{ color:'#8a9bc5', fontSize:13, fontWeight:600, marginBottom:14 }}>Service Breakdown</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={(data.serviceBreakdown||[]).slice(0,7)} dataKey="lastMonth" nameKey="service" cx="50%" cy="50%" outerRadius={75} innerRadius={30} paddingAngle={2}>
                      {(data.serviceBreakdown||[]).slice(0,7).map(function(_,i){return <Cell key={i} fill={COLORS[i%COLORS.length]}/>;}) }
                    </Pie>
                    <Tooltip contentStyle={{background:'#111827',border:'1px solid #1e2d47',borderRadius:8,color:'#f0f4ff'}} formatter={function(v){return ['$'+Number(v).toLocaleString(),'Cost'];}}/>
                    <Legend iconType="circle" formatter={function(val){return React.createElement('span',{style:{color:'#8a9bc5',fontSize:10}},val);}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* MoM Comparison */}
          {tab==='comparison' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, padding:18 }}>
                <div style={{ color:'#8a9bc5', fontSize:13, fontWeight:600, marginBottom:14 }}>Service Cost — Last Month vs Previous Month</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={(data.serviceBreakdown||[]).slice(0,8)} layout="vertical">
                    <XAxis type="number" tick={{fill:'#4a5878',fontSize:11}} tickFormatter={function(v){return '$'+(v/1000).toFixed(0)+'K';}} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="service" tick={{fill:'#8a9bc5',fontSize:11}} width={150} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{background:'#111827',border:'1px solid #1e2d47',borderRadius:8,color:'#f0f4ff'}} formatter={function(v){return ['$'+Number(v).toLocaleString(),''];}}/>
                    <Bar dataKey="twoMonthsAgo" name="2 Months Ago" fill="#4a5878" radius={[0,4,4,0]}/>
                    <Bar dataKey="lastMonth" name="Last Month" fill="#3b82f6" radius={[0,4,4,0]}/>
                    <Legend formatter={function(val){return React.createElement('span',{style:{color:'#8a9bc5',fontSize:11}},val);}}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a2540', color:'#8a9bc5', fontWeight:600, fontSize:13 }}>Service Cost Changes</div>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#0d1424' }}>{['Service','2 Months Ago','Last Month','Change','% Change'].map(function(h){return <th key={h} style={{ padding:'9px 14px', textAlign:'left', color:'#4a5878', fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>;})}</tr></thead>
                  <tbody>
                    {(data.serviceBreakdown||[]).map(function(s,i){
                      var delta = s.lastMonth - s.twoMonthsAgo;
                      var pct = s.twoMonthsAgo > 0 ? ((delta/s.twoMonthsAgo)*100).toFixed(1) : '—';
                      var up = delta > 0;
                      return (
                        <tr key={i} style={{ borderBottom:'1px solid #1a2540' }}>
                          <td style={{ padding:'10px 14px', color:'#e2e8f0', fontWeight:500, fontSize:13 }}>{s.service}</td>
                          <td style={{ padding:'10px 14px', color:'#8b5cf6', fontSize:13 }}>${s.twoMonthsAgo.toLocaleString()}</td>
                          <td style={{ padding:'10px 14px', color:'#3b82f6', fontWeight:700, fontSize:13 }}>${s.lastMonth.toLocaleString()}</td>
                          <td style={{ padding:'10px 14px', color:up?'#ef4444':'#10b981', fontWeight:700, fontSize:13 }}>{up?'+':''}${Math.abs(delta).toLocaleString()}</td>
                          <td style={{ padding:'10px 14px' }}>
                            <span style={{ background:(up?'rgba(239,68,68,':'rgba(16,185,129,')+'0.1)', color:up?'#ef4444':'#10b981', border:'1px solid '+(up?'rgba(239,68,68,':'rgba(16,185,129,')+'0.3)', borderRadius:20, padding:'2px 9px', fontSize:11, fontWeight:700 }}>
                              {up?'↑':'↓'} {Math.abs(pct)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* By Service */}
          {tab==='services' && (
            <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, padding:18 }}>
              <div style={{ color:'#8a9bc5', fontSize:13, fontWeight:600, marginBottom:14 }}>Cost by Service — Last Month</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.serviceBreakdown||[]} layout="vertical">
                  <XAxis type="number" tick={{fill:'#4a5878',fontSize:11}} tickFormatter={function(v){return '$'+(v/1000).toFixed(0)+'K';}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="service" tick={{fill:'#8a9bc5',fontSize:11}} width:160 axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{background:'#111827',border:'1px solid #1e2d47',borderRadius:8,color:'#f0f4ff'}} formatter={function(v){return ['$'+Number(v).toLocaleString(),'Cost'];}}/>
                  <Bar dataKey="lastMonth" name="Cost" radius={[0,6,6,0]}>
                    {(data.serviceBreakdown||[]).map(function(_,i){return <Cell key={i} fill={COLORS[i%COLORS.length]}/>;}) }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Waste */}
          {tab==='waste' && (
            <div>
              {!wasteData && !loadingWaste && <NoDataState icon="♻️" title="Waste Analysis Not Loaded" message="Click to scan for unused EIPs, old AMIs, and old snapshots in your account." onAction={fetchWaste} actionLabel="♻️ Scan for Waste" />}
              {loadingWaste && <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, padding:40, background:'#111827', border:'1px solid #1e2d47', borderRadius:14 }}><div className="spinner" style={{width:28,height:28,borderWidth:3}}/><span style={{color:'#8a9bc5'}}>Scanning for waste resources...</span></div>}
              {wasteData && !wasteData.hasCredentials && <NoDataState icon="🔑" title="Credentials Error" message={wasteData.message}/>}
              {wasteData?.hasData && (
                <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <WasteTable title="⚡ Unused Elastic IPs" items={wasteData.unusedEIPs||[]} cols={['Allocation ID','Public IP','Region','Monthly Cost']} rows={(wasteData.unusedEIPs||[]).map(function(e){return[e.allocationId,e.publicIp,e.region,e.monthlyCost];})}/>
                  <WasteTable title="🖼️ AMIs Older than 90 Days" items={wasteData.oldAMIs||[]} cols={['AMI ID','Name','Created','Age','Snapshots','Est. Cost']} rows={(wasteData.oldAMIs||[]).map(function(a){return[a.imageId,a.name,a.createdDate,a.ageDays+'d',a.snapshotCount,a.estimatedCost];})}/>
                  <WasteTable title="💾 EBS Snapshots Older than 90 Days" items={wasteData.oldSnapshots||[]} cols={['Snapshot ID','Volume ID','Size','Created','Age','Est. Cost']} rows={(wasteData.oldSnapshots||[]).map(function(s){return[s.snapshotId,s.volumeId,s.size,s.createdDate,s.ageDays+'d',s.estimatedCost];})}/>
                  <WasteTable title="🗄️ RDS Snapshots Older than 90 Days" items={wasteData.oldRDSSnapshots||[]} cols={['Snapshot ID','DB Instance','Size','Created','Age','Est. Cost']} rows={(wasteData.oldRDSSnapshots||[]).map(function(s){return[s.snapshotId,s.dbInstance,s.size,s.createdDate,s.ageDays+'d',s.estimatedCost];})}/>
                </div>
              )}
            </div>
          )}

          {/* Anomalies */}
          {tab==='anomalies' && (
            <div style={{ background:'#111827', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a2540', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ color:'#f59e0b', fontWeight:700, fontSize:14 }}>⚠️ Cost Anomalies from AWS</span>
                <span style={{ color:'#4a5878', fontSize:12 }}>{(data.anomalies||[]).length} detected</span>
              </div>
              {(data.anomalies||[]).length === 0 ? (
                <div style={{ padding:'30px', textAlign:'center', color:'#4a5878', fontSize:13 }}>✅ No cost anomalies detected by AWS in the last 60 days</div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead><tr style={{ background:'#0d1424' }}>{['Service','Start Date','Expected','Actual','Anomaly','Severity'].map(function(h){return <th key={h} style={{ padding:'9px 14px', textAlign:'left', color:'#4a5878', fontSize:10, fontWeight:600, textTransform:'uppercase' }}>{h}</th>;})}</tr></thead>
                  <tbody>
                    {(data.anomalies||[]).map(function(a,i){
                      return (
                        <tr key={i} style={{ borderBottom:'1px solid #1a2540' }}>
                          <td style={{ padding:'10px 14px', color:'#06b6d4', fontWeight:600 }}>{a.service}</td>
                          <td style={{ padding:'10px 14px', color:'#8a9bc5', fontSize:12 }}>{a.startDate}</td>
                          <td style={{ padding:'10px 14px', color:'#10b981' }}>{a.expectedAmount}</td>
                          <td style={{ padding:'10px 14px', color:'#ef4444', fontWeight:700 }}>{a.actualAmount}</td>
                          <td style={{ padding:'10px 14px', color:'#f59e0b', fontWeight:800 }}>{a.anomalyAmount}</td>
                          <td style={{ padding:'10px 14px' }}><span style={{ background:a.severity==='HIGH'?'rgba(239,68,68,0.1)':'rgba(245,158,11,0.1)', color:a.severity==='HIGH'?'#ef4444':'#f59e0b', border:'1px solid '+(a.severity==='HIGH'?'rgba(239,68,68,0.3)':'rgba(245,158,11,0.3)'), borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:700 }}>{a.severity}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WasteTable(props) {
  var title=props.title; var items=props.items||[]; var cols=props.cols; var rows=props.rows||[];
  return (
    <div style={{ background:'#111827', border:'1px solid '+(items.length>0?'rgba(245,158,11,0.2)':'#1e2d47'), borderRadius:12, overflow:'hidden' }}>
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #1a2540', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:items.length>0?'#fbbf24':'#8a9bc5', fontWeight:600, fontSize:13 }}>{title}</span>
        {items.length > 0 && <span style={{ background:'rgba(245,158,11,0.1)', color:'#f59e0b', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{items.length} items</span>}
      </div>
      {items.length === 0 ? (
        <div style={{ padding:'16px', textAlign:'center', color:'#10b981', fontSize:13 }}>✅ Clean — no items found</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'#0d1424' }}>{cols.map(function(c){return <th key={c} style={{ padding:'8px 12px', textAlign:'left', color:'#4a5878', fontSize:10, fontWeight:600, textTransform:'uppercase', whiteSpace:'nowrap' }}>{c}</th>;})}</tr></thead>
            <tbody>{rows.map(function(r,i){return <tr key={i} style={{ borderBottom:'1px solid #1a2540' }}>{r.map(function(cell,j){return <td key={j} style={{ padding:'9px 12px', fontSize:11, color:j===0?'#64748b':'#94a3b8', fontFamily:j===0?'monospace':'inherit', whiteSpace:'nowrap' }}>{cell}</td>;})}</tr>;})}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
