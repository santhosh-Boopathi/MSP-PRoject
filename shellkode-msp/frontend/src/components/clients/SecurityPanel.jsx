import React, { useState } from 'react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

var SEV = { CRITICAL:'#ef4444', HIGH:'#f97316', MEDIUM:'#f59e0b', LOW:'#3b82f6', INFORMATIONAL:'#06b6d4' };
var ORD = { CRITICAL:0, HIGH:1, MEDIUM:2, LOW:3, INFORMATIONAL:4 };

function exportHTML(clientName, findings, summary) {
  var rows = findings.map(function(f) {
    return '<tr><td style="font-family:monospace;font-size:11px">'+f.id+'</td><td><span class="badge '+f.severity.toLowerCase()+'">'+f.severity+'</span></td><td>'+f.title+'</td><td>'+f.service+'</td><td>'+f.region+'</td><td style="font-size:11px">'+f.remediation+'</td></tr>';
  }).join('');
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Security Report - '+clientName+'</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,sans-serif;background:#f8fafc;color:#1e293b;padding:30px}.header{background:linear-gradient(135deg,#1e40af,#0891b2);color:white;padding:30px;border-radius:12px;margin-bottom:24px}.header h1{font-size:26px;margin-bottom:4px}.meta{font-size:13px;opacity:.8;margin-top:8px}.summary{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:24px}.card{background:white;border-radius:10px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.06)}.card .val{font-size:28px;font-weight:800}.card .lbl{font-size:11px;color:#64748b;margin-top:4px}table{width:100%;border-collapse:collapse;background:white;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)}th{background:#1e40af;color:white;padding:11px 14px;text-align:left;font-size:12px}td{padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px}.badge{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700}.critical{background:#fef2f2;color:#dc2626}.high{background:#fff7ed;color:#ea580c}.medium{background:#fffbeb;color:#d97706}.low{background:#eff6ff;color:#2563eb}.informational{background:#ecfeff;color:#0891b2}</style></head><body>';
  html += '<div class="header"><h1>Security Audit Report — '+clientName+'</h1><div class="meta">Generated: '+new Date().toLocaleString('en-IN')+' | Team Cronos | ShellKode MSP</div></div>';
  html += '<div class="summary"><div class="card"><div class="val" style="color:#dc2626">'+summary.critical+'</div><div class="lbl">Critical</div></div><div class="card"><div class="val" style="color:#ea580c">'+summary.high+'</div><div class="lbl">High</div></div><div class="card"><div class="val" style="color:#d97706">'+summary.medium+'</div><div class="lbl">Medium</div></div><div class="card"><div class="val" style="color:#2563eb">'+summary.low+'</div><div class="lbl">Low</div></div><div class="card"><div class="val" style="color:#0891b2">'+summary.informational+'</div><div class="lbl">Info</div></div><div class="card"><div class="val" style="color:'+(summary.score>=80?'#16a34a':summary.score>=60?'#d97706':'#dc2626')+'">'+summary.score+'</div><div class="lbl">Score/100</div></div></div>';
  html += '<table><thead><tr><th>ID</th><th>Severity</th><th>Finding</th><th>Service</th><th>Region</th><th>Remediation</th></tr></thead><tbody>'+rows+'</tbody></table>';
  html += '<div style="text-align:center;margin-top:30px;color:#94a3b8;font-size:12px">ShellKode MSP Portal — Team Cronos — Confidential</div></body></html>';
  var b = new Blob([html], { type:'text/html' });
  var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'Security_'+clientName+'_'+new Date().toISOString().split('T')[0]+'.html'; a.click(); URL.revokeObjectURL(a.href);
}

export default function SecurityPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [filter, setFilter] = useState('ALL');
  var [svcFilter, setSvcFilter] = useState('ALL');
  var [search, setSearch] = useState('');
  var [page, setPage] = useState(1);
  var PER = 25;

  var runScan = function() {
    setLoading(true); setData(null); setFilter('ALL'); setSvcFilter('ALL'); setSearch(''); setPage(1);
    api.get('/aws/security/' + clientId).then(function(r) {
      setData(r.data);
    }).catch(function(e) {
      setData({ hasCredentials: false, hasData: false, message: e.response?.data?.error || e.message });
    }).finally(function() { setLoading(false); });
  };

  var services = data?.findings ? ['ALL', ...new Set(data.findings.map(function(f){return f.service;}))] : ['ALL'];
  var filtered = (data?.findings || []).filter(function(f){
    return (filter==='ALL'||f.severity===filter) && (svcFilter==='ALL'||f.service===svcFilter) && (!search||f.title.toLowerCase().includes(search.toLowerCase())||f.service.toLowerCase().includes(search.toLowerCase()));
  }).sort(function(a,b){return ORD[a.severity]-ORD[b.severity];});
  var totalPages = Math.ceil(filtered.length / PER);
  var paged = filtered.slice((page-1)*PER, page*PER);

  return (
    <div style={{ animation:'fadeIn 0.4s ease' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#f0f4ff', marginBottom:4 }}>🛡️ Security Audit</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>Click "Run Scan" to fetch real-time findings from your AWS account</p>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={runScan} disabled={loading}
            style={{ padding:'10px 20px', background:'linear-gradient(135deg, #3b82f6, #06b6d4)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, opacity:loading?0.7:1 }}>
            {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}}/> Scanning AWS...</> : '🔍 Run Security Scan'}
          </button>
          {data?.hasData && <button onClick={function(){exportHTML(clientName,filtered,data.summary);}} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid #2a3a58', borderRadius:10, color:'#8a9bc5', fontSize:13, cursor:'pointer' }}>📄 HTML Report</button>}
          {data?.hasData && <button onClick={function(){exportToCSV('Security_'+clientName,['ID','Severity','Finding','Service','Region','Resource','Remediation'],filtered.map(function(f){return[f.id,f.severity,f.title,f.service,f.region,f.resource,f.remediation];}));}} style={{ padding:'10px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid #2a3a58', borderRadius:10, color:'#8a9bc5', fontSize:13, cursor:'pointer' }}>📊 Export CSV</button>}
        </div>
      </div>

      {/* Not run yet */}
      {!data && !loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60, background:'#111827', border:'1px solid #1e2d47', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:14 }}>🛡️</div>
          <div style={{ color:'#e2e8f0', fontSize:16, fontWeight:600, marginBottom:6 }}>Security Audit Not Run Yet</div>
          <div style={{ color:'#4a5878', fontSize:13, maxWidth:400, marginBottom:20 }}>Click "Run Security Scan" to analyse your entire AWS account including IAM, EC2, RDS, S3, CloudTrail and more.</div>
          <button onClick={runScan} style={{ padding:'11px 28px', background:'linear-gradient(135deg, #3b82f6, #06b6d4)', border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>🔍 Run Security Scan Now</button>
        </div>
      )}

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:280, background:'#111827', border:'1px solid #1e2d47', borderRadius:14 }}>
          <div className="spinner" style={{ width:40, height:40, borderWidth:3, marginBottom:14 }} />
          <div style={{ color:'#8a9bc5', fontSize:14 }}>Scanning AWS account for {clientName}...</div>
          <div style={{ color:'#4a5878', fontSize:12, marginTop:6 }}>Checking IAM, EC2, RDS, S3, CloudTrail...</div>
        </div>
      )}

      {/* Error / no credentials */}
      {data && !data.hasCredentials && (
        <div style={{ padding:32, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🔑</div>
          <div style={{ color:'#fbbf24', fontSize:15, fontWeight:600, marginBottom:6 }}>AWS Credentials Not Configured</div>
          <div style={{ color:'#4a5878', fontSize:13 }}>{data.message}</div>
        </div>
      )}

      {data && data.hasCredentials && !data.hasData && (
        <div style={{ padding:32, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>❌</div>
          <div style={{ color:'#f87171', fontSize:15, fontWeight:600, marginBottom:6 }}>Scan Failed</div>
          <div style={{ color:'#4a5878', fontSize:13, maxWidth:400, margin:'0 auto' }}>{data.message}</div>
          {data.credentialError && <div style={{ color:'#fbbf24', fontSize:12, marginTop:8 }}>Please update AWS credentials in client settings.</div>}
        </div>
      )}

      {data?.hasData && data.findings && (
        <>
          {/* Score + summary */}
          <div style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap', alignItems:'flex-start' }}>
            <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, padding:'20px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
              <svg width="110" height="110" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2d47" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={data.summary.score>=80?'#10b981':data.summary.score>=60?'#f59e0b':'#ef4444'} strokeWidth="10" strokeLinecap="round" strokeDasharray={String(2*Math.PI*50*data.summary.score/100)+' '+String(2*Math.PI*50)} transform="rotate(-90 60 60)"/>
                <text x="60" y="55" textAnchor="middle" fill="#f0f4ff" fontSize="24" fontWeight="800">{data.summary.score}</text>
                <text x="60" y="72" textAnchor="middle" fill="#4a5878" fontSize="10">/100</text>
              </svg>
              <div style={{ color:data.summary.score>=60?'#f59e0b':'#ef4444', fontSize:11, fontWeight:700 }}>{data.summary.score>=80?'GOOD':data.summary.score>=60?'FAIR':'NEEDS ATTENTION'}</div>
              <div style={{ color:'#4a5878', fontSize:10 }}>Scanned: {data.scannedAt ? new Date(data.scannedAt).toLocaleString('en-IN') : ''}</div>
            </div>
            <div style={{ flex:1, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(90px, 1fr))', gap:10 }}>
              {Object.entries(SEV).map(function(entry) {
                var sev=entry[0]; var color=entry[1];
                return (
                  <div key={sev} onClick={function(){setFilter(filter===sev?'ALL':sev); setPage(1);}}
                    style={{ background:'#111827', border:'1px solid '+(filter===sev?color:color+'33'), borderRadius:12, padding:'14px 10px', textAlign:'center', cursor:'pointer', outline:filter===sev?'2px solid '+color:'none' }}>
                    <div style={{ fontSize:24, fontWeight:800, color:color }}>{data.summary[sev.toLowerCase()]||0}</div>
                    <div style={{ color:'#4a5878', fontSize:9, marginTop:3, textTransform:'uppercase' }}>{sev}</div>
                  </div>
                );
              })}
              <div onClick={function(){setFilter('ALL');setPage(1);}} style={{ background:'#111827', border:'1px solid '+(filter==='ALL'?'#3b82f6':'#3b82f633'), borderRadius:12, padding:'14px 10px', textAlign:'center', cursor:'pointer', outline:filter==='ALL'?'2px solid #3b82f6':'none' }}>
                <div style={{ fontSize:24, fontWeight:800, color:'#3b82f6' }}>{data.findings.length}</div>
                <div style={{ color:'#4a5878', fontSize:9, marginTop:3, textTransform:'uppercase' }}>TOTAL</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            <input value={search} onChange={function(e){setSearch(e.target.value);setPage(1);}} placeholder="Search findings..." style={{ flex:1, minWidth:180, padding:'8px 12px', background:'#111827', border:'1px solid #1e2d47', borderRadius:9, color:'#f0f4ff', fontSize:13, outline:'none' }} />
            <select value={svcFilter} onChange={function(e){setSvcFilter(e.target.value);setPage(1);}} style={{ padding:'8px 12px', background:'#111827', border:'1px solid #1e2d47', borderRadius:9, color:'#8a9bc5', fontSize:13, outline:'none', cursor:'pointer' }}>
              {services.map(function(s){return <option key={s} value={s}>{s==='ALL'?'All Services':s}</option>;})}
            </select>
            <span style={{ color:'#4a5878', fontSize:12 }}>{filtered.length} findings</span>
          </div>

          <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead>
                <tr style={{ background:'#0d1424' }}>
                  {['ID','Severity','Finding','Service','Region','Resource','Remediation'].map(function(h){return <th key={h} style={{ padding:'9px 14px', textAlign:'left', color:'#4a5878', fontSize:10, fontWeight:600, textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>;})}
                </tr>
              </thead>
              <tbody>
                {paged.map(function(f,i){
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid #1a2540', background:i%2===0?'transparent':'rgba(255,255,255,0.01)' }}>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:'#4a5878' }}>{f.id}</td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ background:SEV[f.severity]+'18', color:SEV[f.severity], border:'1px solid '+SEV[f.severity]+'44', borderRadius:20, padding:'2px 9px', fontSize:10, fontWeight:700 }}>{f.severity}</span>
                      </td>
                      <td style={{ padding:'10px 14px', color:'#e2e8f0', fontWeight:500, minWidth:200 }}>{f.title}</td>
                      <td style={{ padding:'10px 14px', color:'#06b6d4', fontSize:12 }}>{f.service}</td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:11, color:'#4a5878' }}>{f.region}</td>
                      <td style={{ padding:'10px 14px', fontFamily:'monospace', fontSize:10, color:'#2a3a58', maxWidth:160, wordBreak:'break-all' }}>{f.resource}</td>
                      <td style={{ padding:'10px 14px', color:'#94a3b8', fontSize:12, minWidth:150 }}>{f.remediation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12, padding:'10px 14px', background:'#111827', border:'1px solid #1e2d47', borderRadius:10 }}>
              <button onClick={function(){setPage(function(p){return Math.max(1,p-1);});}} disabled={page===1} style={{ padding:'6px 14px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, color:'#60a5fa', fontSize:13, cursor:'pointer' }}>← Prev</button>
              <span style={{ color:'#8a9bc5', fontSize:13 }}>Page {page} of {totalPages} · {filtered.length} findings</span>
              <button onClick={function(){setPage(function(p){return Math.min(totalPages,p+1);});}} disabled={page===totalPages} style={{ padding:'6px 14px', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:8, color:'#60a5fa', fontSize:13, cursor:'pointer' }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
