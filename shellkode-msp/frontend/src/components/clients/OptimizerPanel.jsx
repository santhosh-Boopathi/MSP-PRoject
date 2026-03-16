import React, { useState } from 'react';
import api from '../../utils/api';

export default function OptimizerPanel(props) {
  var clientId = props.clientId; var clientName = props.clientName;
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);
  var [tab, setTab] = useState('ec2');

  var runScan = function() {
    setLoading(true); setData(null);
    api.get('/aws/optimizer/' + clientId).then(function(r) { setData(r.data); }).catch(function(e) {
      setData({ hasCredentials: false, hasData: false, message: e.response?.data?.error || e.message });
    }).finally(function() { setLoading(false); });
  };

  var tabs = [
    { id:'ec2', label:'🖥️ EC2', count: data?.ec2Recommendations?.length || 0 },
    { id:'ebs', label:'💾 EBS', count: data?.ebsRecommendations?.length || 0 },
    { id:'lambda', label:'λ Lambda', count: data?.lambdaRecommendations?.length || 0 },
    { id:'rds', label:'🗄️ RDS', count: data?.rdsRecommendations?.length || 0 },
  ];

  return (
    <div style={{ animation:'fadeIn 0.4s ease' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#f0f4ff', marginBottom:4 }}>⚡ AWS Compute Optimizer</h2>
          <p style={{ color:'#64748b', fontSize:13 }}>Right-sizing recommendations for EC2, EBS, Lambda, RDS from AWS Compute Optimizer service</p>
        </div>
        <button onClick={runScan} disabled={loading}
          style={{ padding:'10px 20px', background:'linear-gradient(135deg, #8b5cf6, #6366f1)', border:'none', borderRadius:10, color:'white', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, opacity:loading?0.7:1 }}>
          {loading ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}}/> Loading...</> : '⚡ Get Recommendations'}
        </button>
      </div>

      {/* Not run yet */}
      {!data && !loading && (
        <div style={{ padding:60, background:'#111827', border:'1px solid #1e2d47', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:14 }}>⚡</div>
          <div style={{ color:'#e2e8f0', fontSize:16, fontWeight:600, marginBottom:6 }}>Compute Optimizer Not Loaded</div>
          <div style={{ color:'#4a5878', fontSize:13, maxWidth:400, margin:'0 auto 20px' }}>
            Click "Get Recommendations" to fetch right-sizing suggestions from AWS Compute Optimizer. Requires Compute Optimizer to be opted-in on your AWS account.
          </div>
          <button onClick={runScan} style={{ padding:'11px 28px', background:'linear-gradient(135deg, #8b5cf6, #6366f1)', border:'none', borderRadius:10, color:'white', fontSize:14, fontWeight:600, cursor:'pointer' }}>⚡ Get Recommendations</button>
        </div>
      )}

      {loading && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:240, background:'#111827', border:'1px solid #1e2d47', borderRadius:14 }}>
          <div className="spinner" style={{ width:36, height:36, borderWidth:3, marginBottom:14 }} />
          <div style={{ color:'#8a9bc5' }}>Fetching from AWS Compute Optimizer...</div>
        </div>
      )}

      {data && !data.hasCredentials && (
        <div style={{ padding:32, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>🔑</div>
          <div style={{ color:'#fbbf24', fontSize:15, fontWeight:600, marginBottom:6 }}>AWS Credentials Not Configured</div>
          <div style={{ color:'#4a5878', fontSize:13 }}>{data.message}</div>
        </div>
      )}

      {data && data.hasCredentials && data.optInRequired && (
        <div style={{ padding:32, background:'rgba(139,92,246,0.06)', border:'1px solid rgba(139,92,246,0.2)', borderRadius:14 }}>
          <div style={{ fontSize:32, marginBottom:12, textAlign:'center' }}>⚡</div>
          <div style={{ color:'#a78bfa', fontSize:16, fontWeight:700, marginBottom:10, textAlign:'center' }}>Compute Optimizer Opt-In Required</div>
          <div style={{ color:'#64748b', fontSize:13, marginBottom:20, textAlign:'center' }}>{data.message}</div>
          <div style={{ background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'16px 20px', marginBottom:16 }}>
            <div style={{ color:'#e2e8f0', fontSize:13, fontWeight:600, marginBottom:10 }}>How to enable:</div>
            {['1. Go to AWS Console → Compute Optimizer','2. Click "Get Started" to opt-in','3. Wait 24-48 hours for data collection','4. Come back and click "Get Recommendations"'].map(function(s, i) {
              return <div key={i} style={{ color:'#94a3b8', fontSize:13, marginBottom:6 }}>{s}</div>;
            })}
          </div>
          <div style={{ textAlign:'center' }}>
            <a href={data.link || 'https://console.aws.amazon.com/compute-optimizer/'} target="_blank" rel="noreferrer"
              style={{ display:'inline-block', padding:'10px 24px', background:'linear-gradient(135deg, #8b5cf6, #6366f1)', borderRadius:10, color:'white', fontSize:13, fontWeight:600, textDecoration:'none' }}>
              Open AWS Compute Optimizer →
            </a>
          </div>
        </div>
      )}

      {data && data.hasCredentials && !data.hasData && !data.optInRequired && (
        <div style={{ padding:32, background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:14, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:10 }}>📊</div>
          <div style={{ color:'#60a5fa', fontSize:15, fontWeight:600, marginBottom:6 }}>No Recommendations Available Yet</div>
          <div style={{ color:'#4a5878', fontSize:13, maxWidth:400, margin:'0 auto' }}>{data.message || 'AWS Compute Optimizer needs at least 14 days of CloudWatch metrics to generate recommendations.'}</div>
        </div>
      )}

      {data && data.hasData && (
        <>
          <div style={{ background:'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.04))', border:'1px solid rgba(16,185,129,0.2)', borderRadius:14, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ color:'#10b981', fontWeight:700, fontSize:13, marginBottom:4 }}>💡 POTENTIAL MONTHLY SAVINGS</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:32, fontWeight:800, color:'#34d399' }}>{data.totalMonthlySavings}/month</div>
              <div style={{ color:'#4a5878', fontSize:12, marginTop:2 }}>by rightsizing under-utilized resources</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {tabs.map(function(t) {
                return <div key={t.id} style={{ textAlign:'center', background:'rgba(0,0,0,0.2)', borderRadius:10, padding:'10px 16px' }}><div style={{ fontSize:18, fontWeight:700, color:'#f0f4ff' }}>{t.count}</div><div style={{ fontSize:11, color:'#4a5878' }}>{t.label}</div></div>;
              })}
            </div>
          </div>

          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            {tabs.map(function(t) {
              return (
                <button key={t.id} onClick={function(){setTab(t.id);}}
                  style={{ padding:'8px 16px', background:tab===t.id?'rgba(139,92,246,0.12)':'#111827', border:'1px solid '+(tab===t.id?'rgba(139,92,246,0.3)':'#1e2d47'), borderRadius:10, color:tab===t.id?'#a78bfa':'#8a9bc5', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
                  {t.label} <span style={{ background:'rgba(255,255,255,0.08)', borderRadius:20, padding:'1px 7px', fontSize:11 }}>{t.count}</span>
                </button>
              );
            })}
          </div>

          <RecsTable title={tabs.find(function(t){return t.id===tab;})?.label} recs={tab==='ec2'?data.ec2Recommendations:tab==='ebs'?data.ebsRecommendations:tab==='lambda'?data.lambdaRecommendations:data.rdsRecommendations} type={tab} />
        </>
      )}
    </div>
  );
}

function RecsTable(props) {
  var title=props.title; var recs=props.recs||[]; var type=props.type;
  if (recs.length === 0) return <div style={{ padding:'30px', background:'#111827', border:'1px solid #1e2d47', borderRadius:14, textAlign:'center', color:'#4a5878', fontSize:13 }}>✅ No rightsizing recommendations for {title} — resources are optimally sized!</div>;
  var cols = { ec2:['Instance ID','Current Type','Recommended','CPU Util','Current Cost','Savings','Reason'], ebs:['Volume ID','Current Type','Recommended','Savings','Note'], lambda:['Function','Current Memory','Recommended','Savings'], rds:['DB Instance','Current Class','Recommended','Savings'] };
  var getRow = function(r) {
    if (type==='ec2') return [r.instanceId,r.currentType,r.recommendedType,r.cpuUtil,r.currentCost||'—',r.savings,r.reason];
    if (type==='ebs') return [r.volumeId,r.currentType,r.recommendedType,r.savings,'Review recommended'];
    if (type==='lambda') return [r.functionName,r.currentMemory,r.recommendedMemory,r.savings];
    return [r.dbInstanceId||r.dbInstance,r.currentClass||r.class,r.recommendedClass||r.recommendedType,r.savings];
  };
  return (
    <div style={{ background:'#111827', border:'1px solid #1e2d47', borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', borderBottom:'1px solid #1a2540', color:'#a78bfa', fontWeight:600, fontSize:14 }}>{title} Rightsizing Recommendations</div>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ background:'#0d1424' }}>{(cols[type]||[]).map(function(c){return <th key={c} style={{ padding:'9px 14px', textAlign:'left', color:'#4a5878', fontSize:10, fontWeight:600, textTransform:'uppercase', whiteSpace:'nowrap' }}>{c}</th>;})}</tr></thead>
          <tbody>{recs.map(function(r,i){var row=getRow(r);return <tr key={i} style={{ borderBottom:'1px solid #1a2540' }}>{row.map(function(cell,j){return <td key={j} style={{ padding:'10px 14px', fontSize:12, color:j===row.length-1&&type==='ec2'?'#94a3b8':j===0?'#64748b':j===row.length-(type==='ec2'?2:1)?'#10b981':'#e2e8f0', fontFamily:j===0?'monospace':'inherit', fontWeight:j===row.length-(type==='ec2'?2:1)?700:400, whiteSpace:'nowrap' }}>{cell}</td>; })}</tr>; })}</tbody>
        </table>
      </div>
    </div>
  );
}
