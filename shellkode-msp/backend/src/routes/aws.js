const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Client = require('../models/Client');
const Activity = require('../models/Activity');

// Load AWS SDK modules safely
const aws = {};
const pkgs = ['@aws-sdk/client-ec2','@aws-sdk/client-rds','@aws-sdk/client-s3',
  '@aws-sdk/client-lambda','@aws-sdk/client-iam','@aws-sdk/client-cost-explorer',
  '@aws-sdk/client-cloudtrail','@aws-sdk/client-sts'];
pkgs.forEach(p => { try { aws[p.replace('@aws-sdk/client-','')] = require(p); } catch { aws[p.replace('@aws-sdk/client-','')] = null; } });
console.log('AWS SDK loaded:', Object.entries(aws).filter(([k,v])=>v).map(([k])=>k).join(', ') || 'NONE');

// ─── CRITICAL: Test credentials from REQUEST BODY (not from DB) ───────────────
// The previous bug: test was reading saved credentials from DB and always passed
router.post('/verify-live', authMiddleware, async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;
  if (!accessKeyId || !secretAccessKey) return res.json({ connected: false, error: 'Both Access Key ID and Secret Access Key are required.' });
  if (!aws['sts']) return res.json({ connected: false, error: 'AWS STS SDK not installed on server. Cannot verify credentials.' });
  try {
    const { STSClient, GetCallerIdentityCommand } = aws['sts'];
    const sts = new STSClient({ credentials: { accessKeyId: accessKeyId.trim(), secretAccessKey: secretAccessKey.trim() }, region: region || 'ap-south-1' });
    const result = await sts.send(new GetCallerIdentityCommand({}));
    return res.json({ connected: true, accountId: result.Account, arn: result.Arn, userId: result.UserId, message: 'Connected to AWS Account ' + result.Account });
  } catch (err) {
    const msgs = { InvalidClientTokenId:'Invalid Access Key ID — check for typos', SignatureDoesNotMatch:'Invalid Secret Access Key — check for typos or whitespace', AuthFailure:'Authentication failed — verify both keys', ExpiredTokenException:'Credentials expired — generate new access keys', InvalidSignatureException:'Invalid signature — check secret key' };
    return res.json({ connected: false, error: msgs[err.name] || ('AWS Error: ' + err.message), errorCode: err.name });
  }
});

// ─── Helper: load credentials from DB ────────────────────────────────────────
async function getCreds(clientId, accountIndex) {
  const idx = parseInt(accountIndex || '0');
  const doc = await Client.findById(clientId);
  if (!doc) throw { code:'NOT_FOUND', message:'Client not found' };
  const accs = doc.awsAccounts || [];
  if (accs.length > idx && accs[idx].accessKeyId && accs[idx].secretAccessKey)
    return { creds:{ accessKeyId:accs[idx].accessKeyId, secretAccessKey:accs[idx].secretAccessKey }, regions:accs[idx].regions||doc.awsRegions||['ap-south-1'], primaryRegion:(accs[idx].regions||doc.awsRegions||['ap-south-1'])[0], label:accs[idx].label||'Account '+(idx+1) };
  if (doc.awsCredentials?.accessKeyId && doc.awsCredentials?.secretAccessKey)
    return { creds:{ accessKeyId:doc.awsCredentials.accessKeyId, secretAccessKey:doc.awsCredentials.secretAccessKey }, regions:doc.awsRegions||['ap-south-1'], primaryRegion:(doc.awsRegions||['ap-south-1'])[0], label:'Primary' };
  throw { code:'NO_CREDENTIALS', message:'AWS credentials not configured. Click "Add Keys" to set up.' };
}

const noCreds = (res,msg) => res.json({hasCredentials:false,hasData:false,message:msg||'AWS credentials not configured'});
const noSdk = (res) => res.json({hasCredentials:true,hasData:false,message:'AWS SDK not available on server. Contact admin.'});
const authErr = (res,err) => {
  const m = { InvalidClientTokenId:'Invalid Access Key ID. Update credentials.',SignatureDoesNotMatch:'Invalid Secret Access Key. Update credentials.',AuthFailure:'AWS auth failed.',AccessDeniedException:'Access denied — IAM user missing ReadOnlyAccess policy.',AccessDenied:'Access denied — IAM user missing permissions.' };
  return res.json({hasCredentials:true,hasData:false,message:m[err.name]||'AWS Error: '+err.message,credentialError:!!(m[err.name])});
};

// ─── SECURITY AUDIT ───────────────────────────────────────────────────────────
router.get('/security/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds,regions,primaryRegion} = await getCreds(req.params.clientId, req.query.account);
    if (!aws.iam || !aws.ec2) return noSdk(res);
    const doc = await Client.findById(req.params.clientId);
    const findings = []; let score = 100;
    const {IAMClient,ListUsersCommand,GetAccountPasswordPolicyCommand,ListMFADevicesCommand} = aws.iam;
    const {EC2Client,DescribeSecurityGroupsCommand,DescribeVolumesCommand,DescribeVpcsCommand} = aws.ec2;
    const iam = new IAMClient({credentials:creds,region:'us-east-1'});
    try { await iam.send(new GetAccountPasswordPolicyCommand({})); } catch(e) { if(e.name==='NoSuchEntityException'){findings.push({id:'SEC-IAM-PWD',severity:'MEDIUM',title:'No IAM password policy',resource:'arn:aws:iam',region:'global',service:'IAM',remediation:'Configure password complexity policy',status:'ACTIVE'});score-=5;} }
    try {
      const users = await iam.send(new ListUsersCommand({MaxItems:50}));
      for (const u of (users.Users||[])) {
        try { const mfa=await iam.send(new ListMFADevicesCommand({UserName:u.UserName})); if(!mfa.MFADevices?.length){findings.push({id:'SEC-IAM-'+u.UserName.slice(0,10),severity:'HIGH',title:'No MFA: '+u.UserName,resource:u.Arn,region:'global',service:'IAM',remediation:'Enable MFA for this IAM user',status:'ACTIVE'});score-=8;} } catch {}
      }
    } catch(e) { if(e.name==='InvalidClientTokenId'||e.name==='SignatureDoesNotMatch') return authErr(res,e); }
    for (const reg of regions.slice(0,3)) {
      try {
        const ec2=new EC2Client({credentials:creds,region:reg});
        const sgs=await ec2.send(new DescribeSecurityGroupsCommand({MaxResults:100}));
        for (const sg of (sgs.SecurityGroups||[])) {
          for (const r of (sg.IpPermissions||[])) {
            const open=(r.IpRanges||[]).some(x=>x.CidrIp==='0.0.0.0/0')||(r.Ipv6Ranges||[]).some(x=>x.CidrIpv6==='::/0');
            if(open&&(r.FromPort===22||r.ToPort===22)){findings.push({id:'SEC-SSH-'+sg.GroupId,severity:'HIGH',title:'SSH open to internet: '+sg.GroupName,resource:sg.GroupId,region:reg,service:'EC2',remediation:'Restrict SSH to your office IP only',status:'ACTIVE'});score-=10;}
            if(open&&(r.FromPort===3389||r.ToPort===3389)){findings.push({id:'SEC-RDP-'+sg.GroupId,severity:'HIGH',title:'RDP open to internet: '+sg.GroupName,resource:sg.GroupId,region:reg,service:'EC2',remediation:'Restrict RDP to VPN/office IP',status:'ACTIVE'});score-=10;}
            if(open&&r.IpProtocol==='-1'){findings.push({id:'SEC-ALL-'+sg.GroupId,severity:'CRITICAL',title:'ALL traffic open to internet: '+sg.GroupName,resource:sg.GroupId,region:reg,service:'EC2',remediation:'Remove open inbound rules IMMEDIATELY',status:'ACTIVE'});score-=20;}
          }
        }
        const vols=await ec2.send(new DescribeVolumesCommand({MaxResults:100}));
        const unenc=(vols.Volumes||[]).filter(v=>!v.Encrypted);
        if(unenc.length>0){findings.push({id:'SEC-EBS-'+reg,severity:'MEDIUM',title:unenc.length+' unencrypted EBS volumes ('+reg+')',resource:unenc.slice(0,2).map(v=>v.VolumeId).join(', '),region:reg,service:'EBS',remediation:'Enable EBS encryption by default',status:'ACTIVE'});score-=Math.min(unenc.length*3,10);}
        const vpcs=await ec2.send(new DescribeVpcsCommand({}));
        if((vpcs.Vpcs||[]).length>0) findings.push({id:'SEC-VPC-'+reg,severity:'LOW',title:'Verify VPC Flow Logs in '+reg,resource:(vpcs.Vpcs||[]).map(v=>v.VpcId).join(', '),region:reg,service:'VPC',remediation:'Enable VPC Flow Logs for network visibility',status:'REVIEW'});
      } catch(e) { if(e.name==='InvalidClientTokenId'||e.name==='SignatureDoesNotMatch') return authErr(res,e); }
    }
    if (aws['cloudtrail']) { try { const {CloudTrailClient,DescribeTrailsCommand}=aws['cloudtrail']; const ct=new CloudTrailClient({credentials:creds,region:primaryRegion}); const t=await ct.send(new DescribeTrailsCommand({includeShadowTrails:false})); if(!t.trailList?.length){findings.push({id:'SEC-CT-001',severity:'HIGH',title:'CloudTrail not enabled',resource:primaryRegion,region:primaryRegion,service:'CloudTrail',remediation:'Enable multi-region CloudTrail',status:'ACTIVE'});score-=12;} } catch {} }
    if (aws.s3) { try { const {S3Client,ListBucketsCommand}=aws.s3; const s3=new S3Client({credentials:creds,region:primaryRegion}); const b=await s3.send(new ListBucketsCommand({})); if((b.Buckets||[]).length>0) findings.push({id:'SEC-S3-AUDIT',severity:'INFORMATIONAL',title:'S3 public access audit needed ('+b.Buckets.length+' buckets)',resource:'All S3 buckets',region:'global',service:'S3',remediation:'Check each bucket Block Public Access settings',status:'REVIEW'}); } catch {} }
    score=Math.max(0,Math.min(100,Math.round(score)));
    const summary={critical:findings.filter(f=>f.severity==='CRITICAL').length,high:findings.filter(f=>f.severity==='HIGH').length,medium:findings.filter(f=>f.severity==='MEDIUM').length,low:findings.filter(f=>f.severity==='LOW').length,informational:findings.filter(f=>f.severity==='INFORMATIONAL').length,score};
    await Activity.create({clientId:req.params.clientId,clientName:doc?.name,action:'Security audit: score '+score+'/100 · '+findings.length+' findings',category:'security',severity:score<60?'critical':score<80?'warning':'success',performedBy:req.user.email,performedByName:req.user.name,details:summary.critical+' critical · '+summary.high+' high'}).catch(()=>{});
    res.json({hasCredentials:true,hasData:true,findings,summary,scannedAt:new Date().toISOString(),regionsScanned:regions});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); return authErr(res,err); }
});

// ─── COST ─────────────────────────────────────────────────────────────────────
router.get('/cost/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds} = await getCreds(req.params.clientId, req.query.account);
    if (!aws['cost-explorer']) return noSdk(res);
    const {CostExplorerClient,GetCostAndUsageCommand} = aws['cost-explorer'];
    const ce = new CostExplorerClient({credentials:creds,region:'us-east-1'});
    const now=new Date(); const end=now.toISOString().split('T')[0];
    const start=new Date(now.getFullYear(),now.getMonth()-5,1).toISOString().split('T')[0];
    const resp=await ce.send(new GetCostAndUsageCommand({TimePeriod:{Start:start,End:end},Granularity:'MONTHLY',Metrics:['UnblendedCost'],GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}]}));
    const months={};
    for (const p of (resp.ResultsByTime||[])) {
      const k=p.TimePeriod.Start.slice(0,7);
      months[k]={total:0,services:{},label:new Date(p.TimePeriod.Start+'T12:00:00').toLocaleString('default',{month:'short',year:'numeric'})};
      for (const g of (p.Groups||[])) { const c=parseFloat(g.Metrics.UnblendedCost.Amount||'0'); if(c>0.01){months[k].services[g.Keys[0]]=(months[k].services[g.Keys[0]]||0)+c;months[k].total+=c;} }
    }
    const keys=Object.keys(months).sort(); const last=keys[keys.length-1]; const prev=keys[keys.length-2];
    const svc=Object.entries(months[last]?.services||{}).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([s,c])=>({service:s,lastMonth:parseFloat(c.toFixed(2)),twoMonthsAgo:parseFloat((months[prev]?.services[s]||0).toFixed(2)),percentage:months[last]?.total>0?parseFloat(((c/months[last].total)*100).toFixed(1)):0}));
    const trend=keys.map(k=>({month:months[k]?.label||k,cost:parseFloat((months[k]?.total||0).toFixed(2))}));
    let anomalies=[];
    try { const {GetAnomaliesCommand}=aws['cost-explorer']; const ar=await ce.send(new GetAnomaliesCommand({DateInterval:{StartDate:new Date(Date.now()-60*86400000).toISOString().split('T')[0],EndDate:end}})); anomalies=(ar.Anomalies||[]).map(a=>({id:a.AnomalyId,service:a.DimensionValue||'Unknown',startDate:a.AnomalyStartDate,endDate:a.AnomalyEndDate,anomalyAmount:'$'+parseFloat(a.Impact?.TotalImpact||0).toFixed(2),expectedAmount:'$'+parseFloat(a.Impact?.TotalExpectedSpend||0).toFixed(2),actualAmount:'$'+parseFloat(a.Impact?.TotalActualSpend||0).toFixed(2),severity:parseFloat(a.Impact?.TotalImpact||0)>500?'HIGH':'MEDIUM'})); } catch {}
    res.json({hasCredentials:true,hasData:true,totalLastMonth:parseFloat((months[last]?.total||0).toFixed(2)),totalTwoMonthsAgo:parseFloat((months[prev]?.total||0).toFixed(2)),monthlyTrend:trend,serviceBreakdown:svc,anomalies,unusedEIPs:[],oldAMIs:[],oldSnapshots:[],oldRDSSnapshots:[],scannedAt:new Date().toISOString()});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); if(err.name==='AccessDeniedException') return res.json({hasCredentials:true,hasData:false,message:'Cost Explorer access denied. Add ce:GetCostAndUsage permission.'}); return authErr(res,err); }
});

// ─── WASTE ────────────────────────────────────────────────────────────────────
router.get('/waste/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds,regions} = await getCreds(req.params.clientId, req.query.account);
    if (!aws.ec2) return noSdk(res);
    const {EC2Client,DescribeAddressesCommand,DescribeImagesCommand,DescribeSnapshotsCommand}=aws.ec2;
    const THREE_MONTHS=new Date(Date.now()-90*86400000);
    const unusedEIPs=[],oldAMIs=[],oldSnapshots=[],oldRDSSnapshots=[];
    for (const reg of regions.slice(0,3)) {
      const ec2=new EC2Client({credentials:creds,region:reg});
      try{const r=await ec2.send(new DescribeAddressesCommand({}));for(const a of(r.Addresses||[]))if(!a.AssociationId)unusedEIPs.push({allocationId:a.AllocationId,publicIp:a.PublicIp,region:reg,monthlyCost:'$3.65'});}catch{}
      try{const r=await ec2.send(new DescribeImagesCommand({Owners:['self'],MaxResults:100}));for(const a of(r.Images||[]))if(new Date(a.CreationDate)<THREE_MONTHS){const age=Math.floor((Date.now()-new Date(a.CreationDate))/86400000);oldAMIs.push({imageId:a.ImageId,name:a.Name||'(unnamed)',createdDate:a.CreationDate?.split('T')[0],ageDays:age,snapshotCount:(a.BlockDeviceMappings||[]).length,region:reg,estimatedCost:'$'+((a.BlockDeviceMappings||[]).length*0.5).toFixed(2)+'/mo'});}}catch{}
      try{const r=await ec2.send(new DescribeSnapshotsCommand({OwnerIds:['self'],MaxResults:200}));for(const s of(r.Snapshots||[]))if(s.StartTime&&new Date(s.StartTime)<THREE_MONTHS){const age=Math.floor((Date.now()-new Date(s.StartTime))/86400000);oldSnapshots.push({snapshotId:s.SnapshotId,volumeId:s.VolumeId||'N/A',size:(s.VolumeSize||0)+' GB',createdDate:s.StartTime?.split('T')[0],ageDays:age,region:reg,estimatedCost:'$'+((s.VolumeSize||0)*0.05).toFixed(2)+'/mo'});}}catch{}
    }
    if(aws.rds){const{RDSClient,DescribeDBSnapshotsCommand}=aws.rds;for(const reg of regions.slice(0,2)){try{const rds=new RDSClient({credentials:creds,region:reg});const r=await rds.send(new DescribeDBSnapshotsCommand({SnapshotType:'manual',MaxRecords:50}));for(const s of(r.DBSnapshots||[]))if(s.SnapshotCreateTime&&new Date(s.SnapshotCreateTime)<THREE_MONTHS){const age=Math.floor((Date.now()-new Date(s.SnapshotCreateTime))/86400000);oldRDSSnapshots.push({snapshotId:s.DBSnapshotIdentifier,dbInstance:s.DBInstanceIdentifier,size:(s.AllocatedStorage||0)+' GB',createdDate:s.SnapshotCreateTime?.split('T')[0],ageDays:age,region:reg,estimatedCost:'$'+((s.AllocatedStorage||0)*0.095).toFixed(2)+'/mo'});}}catch{}}}
    res.json({hasCredentials:true,hasData:true,unusedEIPs,oldAMIs,oldSnapshots,oldRDSSnapshots,scannedAt:new Date().toISOString()});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); return authErr(res,err); }
});

// ─── INVENTORY ────────────────────────────────────────────────────────────────
router.get('/inventory/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds,regions,primaryRegion} = await getCreds(req.params.clientId, req.query.account);
    if (!aws.ec2) return noSdk(res);
    const {EC2Client,DescribeInstancesCommand,DescribeVolumesCommand,DescribeAddressesCommand,DescribeSecurityGroupsCommand,DescribeVpcsCommand}=aws.ec2;
    const allR=req.query.allRegions==='true'; const targetReg=req.query.region;
    const scanRegs=allR?regions:(targetReg?[targetReg]:[primaryRegion]);
    const result={regions:{},totals:{ec2:0,rds:0,s3:0,lambda:0,volumes:0,vpcs:0,securityGroups:0,elasticIPs:0},s3Buckets:[]};
    if(aws.s3){try{const{S3Client,ListBucketsCommand}=aws.s3;const s3=new S3Client({credentials:creds,region:primaryRegion});const b=await s3.send(new ListBucketsCommand({}));result.s3Buckets=(b.Buckets||[]).map(x=>({name:x.Name,createdAt:x.CreationDate}));result.totals.s3=result.s3Buckets.length;}catch{}}
    for (const reg of scanRegs) {
      const rd={ec2:[],rds:[],lambda:[],volumes:[],vpcs:[],securityGroups:[],elasticIPs:[]};
      const ec2=new EC2Client({credentials:creds,region:reg});
      try{const r=await ec2.send(new DescribeInstancesCommand({MaxResults:200}));rd.ec2=(r.Reservations||[]).flatMap(x=>x.Instances||[]).map(i=>({id:i.InstanceId,name:(i.Tags||[]).find(t=>t.Key==='Name')?.Value||'(no name)',type:i.InstanceType,state:i.State?.Name,az:i.Placement?.AvailabilityZone,privateIp:i.PrivateIpAddress,publicIp:i.PublicIpAddress||null,launchTime:i.LaunchTime,env:(i.Tags||[]).find(t=>t.Key==='Environment'||t.Key==='Env')?.Value||'N/A'}));result.totals.ec2+=rd.ec2.length;}catch(e){if(e.name==='InvalidClientTokenId'||e.name==='SignatureDoesNotMatch')return authErr(res,e);}
      try{const r=await ec2.send(new DescribeVolumesCommand({MaxResults:200}));rd.volumes=(r.Volumes||[]).map(v=>({id:v.VolumeId,size:v.Size,type:v.VolumeType,state:v.State,encrypted:v.Encrypted,az:v.AvailabilityZone,attachedTo:(v.Attachments||[]).map(a=>a.InstanceId).join(',')||null}));result.totals.volumes+=rd.volumes.length;}catch{}
      try{const r=await ec2.send(new DescribeVpcsCommand({}));rd.vpcs=(r.Vpcs||[]).map(v=>({id:v.VpcId,cidr:v.CidrBlock,isDefault:v.IsDefault,state:v.State}));result.totals.vpcs+=rd.vpcs.length;}catch{}
      try{const r=await ec2.send(new DescribeSecurityGroupsCommand({MaxResults:200}));rd.securityGroups=(r.SecurityGroups||[]).map(sg=>({id:sg.GroupId,name:sg.GroupName,vpcId:sg.VpcId,inboundRules:(sg.IpPermissions||[]).length}));result.totals.securityGroups+=rd.securityGroups.length;}catch{}
      try{const r=await ec2.send(new DescribeAddressesCommand({}));rd.elasticIPs=(r.Addresses||[]).map(a=>({allocationId:a.AllocationId,publicIp:a.PublicIp,associated:!!a.AssociationId,instanceId:a.InstanceId||null}));result.totals.elasticIPs+=rd.elasticIPs.length;}catch{}
      if(aws.rds){try{const{RDSClient,DescribeDBInstancesCommand}=aws.rds;const rds=new RDSClient({credentials:creds,region:reg});const r=await rds.send(new DescribeDBInstancesCommand({MaxRecords:100}));rd.rds=(r.DBInstances||[]).map(db=>({id:db.DBInstanceIdentifier,engine:db.Engine,engineVersion:db.EngineVersion,class:db.DBInstanceClass,status:db.DBInstanceStatus,multiAZ:db.MultiAZ,storage:db.AllocatedStorage,endpoint:db.Endpoint?.Address,encrypted:db.StorageEncrypted}));result.totals.rds+=rd.rds.length;}catch{}}
      if(aws.lambda){try{const{LambdaClient,ListFunctionsCommand}=aws.lambda;const lam=new LambdaClient({credentials:creds,region:reg});const r=await lam.send(new ListFunctionsCommand({MaxItems:50}));rd.lambda=(r.Functions||[]).map(f=>({name:f.FunctionName,runtime:f.Runtime,memory:f.MemorySize,timeout:f.Timeout,lastModified:f.LastModified}));result.totals.lambda+=rd.lambda.length;}catch{}}
      result.regions[reg]=rd;
    }
    const hasData=Object.values(result.totals).some(v=>v>0);
    res.json({hasCredentials:true,hasData,...result,scannedAt:new Date().toISOString(),note:hasData?null:'No resources found in selected region(s).'});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); return authErr(res,err); }
});

// ─── PATCHING ─────────────────────────────────────────────────────────────────
router.get('/patching/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds,regions} = await getCreds(req.params.clientId, req.query.account);
    if (!aws.ec2) return noSdk(res);
    const {EC2Client,DescribeInstancesCommand}=aws.ec2;
    const all=[];
    for (const reg of regions.slice(0,3)) {
      try{const ec2=new EC2Client({credentials:creds,region:reg});const r=await ec2.send(new DescribeInstancesCommand({Filters:[{Name:'instance-state-name',Values:['running','stopped']}],MaxResults:100}));const insts=(r.Reservations||[]).flatMap(x=>x.Instances||[]).map(i=>({id:i.InstanceId,name:(i.Tags||[]).find(t=>t.Key==='Name')?.Value||i.InstanceId,os:i.Platform==='windows'?'Windows':'Linux',ip:i.PrivateIpAddress||'N/A',type:i.InstanceType,state:i.State?.Name,env:(i.Tags||[]).find(t=>t.Key==='Environment'||t.Key==='Env')?.Value||'Production',region:reg}));all.push(...insts);}catch(e){if(e.name==='InvalidClientTokenId'||e.name==='SignatureDoesNotMatch')return authErr(res,e);}
    }
    res.json({hasCredentials:true,hasData:all.length>0,instances:all,scannedAt:new Date().toISOString(),note:all.length===0?'No instances found in configured regions.':null});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); return authErr(res,err); }
});

// ─── COMPUTE OPTIMIZER ────────────────────────────────────────────────────────
router.get('/optimizer/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds,primaryRegion} = await getCreds(req.params.clientId, req.query.account);
    let ec2Recs=[],ebsRecs=[],lambdaRecs=[],optInRequired=false;
    try {
      const co=require('@aws-sdk/client-compute-optimizer');
      const client=new co.ComputeOptimizerClient({credentials:creds,region:primaryRegion});
      try{const r=await client.send(new co.GetEC2InstanceRecommendationsCommand({maxResults:50}));ec2Recs=(r.instanceRecommendations||[]).map(x=>({instanceId:x.instanceArn?.split('/').pop(),currentType:x.currentInstanceType,recommendedType:x.recommendationOptions?.[0]?.instanceType||'No change',savings:'$'+parseFloat(x.recommendationOptions?.[0]?.estimatedMonthlySavings?.value||0).toFixed(0)+'/mo',cpuUtil:(x.utilizationMetrics?.find(m=>m.name==='CPU')?.value||0).toFixed(1)+'%',reason:x.findingReasonCodes?.[0]||'Over-provisioned'}));}catch(e){if(e.name==='OptInRequiredException'||e.message?.includes('opt'))optInRequired=true;}
      if(!optInRequired){try{const r=await client.send(new co.GetEBSVolumeRecommendationsCommand({maxResults:50}));ebsRecs=(r.volumeRecommendations||[]).map(x=>({volumeId:x.volumeArn?.split('/').pop(),currentType:x.currentConfiguration?.volumeType,recommendedType:x.volumeRecommendationOptions?.[0]?.configuration?.volumeType||'No change',savings:'$'+parseFloat(x.volumeRecommendationOptions?.[0]?.estimatedMonthlySavings?.value||0).toFixed(0)+'/mo'}));}catch{}
      try{const r=await client.send(new co.GetLambdaFunctionRecommendationsCommand({maxResults:50}));lambdaRecs=(r.lambdaFunctionRecommendations||[]).map(x=>({functionName:x.functionArn?.split(':').pop(),currentMemory:x.currentMemorySize+'MB',recommendedMemory:(x.memorySizeRecommendationOptions?.[0]?.memorySize||x.currentMemorySize)+'MB',savings:'$'+parseFloat(x.memorySizeRecommendationOptions?.[0]?.projectedUtilizationMetrics?.[0]?.estimatedMonthlySavings?.value||0).toFixed(0)+'/mo'}));}catch{}}
    } catch(e) { if(e.message?.includes('opt'))optInRequired=true; }
    const totalSavings=[...ec2Recs,...ebsRecs,...lambdaRecs].reduce((s,r)=>s+parseFloat((r.savings||'$0/mo').replace(/[$\/mo]/g,'')||0),0);
    res.json({hasCredentials:true,hasData:!optInRequired&&(ec2Recs.length>0||ebsRecs.length>0||lambdaRecs.length>0),optInRequired,ec2Recommendations:ec2Recs,ebsRecommendations:ebsRecs,lambdaRecommendations:lambdaRecs,rdsRecommendations:[],totalMonthlySavings:'$'+totalSavings.toFixed(0),message:optInRequired?'Compute Optimizer requires opt-in. Go to AWS Console → Compute Optimizer → Get Started, then wait 24-48 hours.':(ec2Recs.length===0&&ebsRecs.length===0?'No recommendations yet. Compute Optimizer needs 14+ days of CloudWatch metrics to generate recommendations.':null),link:'https://console.aws.amazon.com/compute-optimizer/',scannedAt:new Date().toISOString()});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); return authErr(res,err); }
});

// ─── SSL/RI from AWS ──────────────────────────────────────────────────────────
router.get('/ssl-aws/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds,regions} = await getCreds(req.params.clientId, req.query.account);
    if (!aws.ec2) return noSdk(res);
    const {EC2Client,DescribeReservedInstancesCommand}=aws.ec2;
    const entries=[];
    for (const reg of regions.slice(0,3)) {
      try{const ec2=new EC2Client({credentials:creds,region:reg});const r=await ec2.send(new DescribeReservedInstancesCommand({Filters:[{Name:'state',Values:['active']}]}));for(const ri of(r.ReservedInstances||[]))if(ri.End)entries.push({type:'ri_ec2',name:ri.InstanceType+' x'+ri.InstanceCount+' ('+reg+')',expiryDate:ri.End,source:'aws',daysRemaining:Math.floor((new Date(ri.End)-new Date())/86400000),offeringClass:ri.OfferingClass,paymentOption:ri.OfferingType,region:reg});}catch{}
    }
    if(aws.rds){const{RDSClient,DescribeReservedDBInstancesCommand}=aws.rds;for(const reg of regions.slice(0,2)){try{const rds=new RDSClient({credentials:creds,region:reg});const r=await rds.send(new DescribeReservedDBInstancesCommand({MaxRecords:50}));for(const ri of(r.ReservedDBInstances||[]))if(ri.StartTime){const exp=new Date(new Date(ri.StartTime).getTime()+ri.Duration*1000);entries.push({type:'ri_rds',name:ri.DBInstanceClass+' x'+ri.DBInstanceCount+' RDS ('+reg+')',expiryDate:exp.toISOString(),source:'aws',daysRemaining:Math.floor((exp-new Date())/86400000),engine:ri.ProductDescription,region:reg});}}catch{}}}
    res.json({hasCredentials:true,hasData:entries.length>0,entries,scannedAt:new Date().toISOString()});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); return authErr(res,err); }
});

// ─── SERVICES CHANGE this month vs last month ─────────────────────────────────
router.get('/services-change/:clientId', authMiddleware, async (req, res) => {
  try {
    const {creds} = await getCreds(req.params.clientId, req.query.account);
    if (!aws['cost-explorer']) return noSdk(res);
    const {CostExplorerClient,GetCostAndUsageCommand}=aws['cost-explorer'];
    const ce=new CostExplorerClient({credentials:creds,region:'us-east-1'});
    const now=new Date();
    const thisStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString().split('T')[0];
    const lastStart=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString().split('T')[0];
    const lastEnd=new Date(now.getFullYear(),now.getMonth(),0).toISOString().split('T')[0];
    const end=now.toISOString().split('T')[0];
    const [tr,lr]=await Promise.all([ce.send(new GetCostAndUsageCommand({TimePeriod:{Start:thisStart,End:end},Granularity:'MONTHLY',Metrics:['UnblendedCost'],GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}]})),ce.send(new GetCostAndUsageCommand({TimePeriod:{Start:lastStart,End:lastEnd},Granularity:'MONTHLY',Metrics:['UnblendedCost'],GroupBy:[{Type:'DIMENSION',Key:'SERVICE'}]}))]);
    const tc={},lc={};
    for(const g of(tr.ResultsByTime?.[0]?.Groups||[])){const c=parseFloat(g.Metrics.UnblendedCost.Amount||'0');if(c>0.5)tc[g.Keys[0]]=parseFloat(c.toFixed(2));}
    for(const g of(lr.ResultsByTime?.[0]?.Groups||[])){const c=parseFloat(g.Metrics.UnblendedCost.Amount||'0');if(c>0.5)lc[g.Keys[0]]=parseFloat(c.toFixed(2));}
    const added=Object.keys(tc).filter(s=>!lc[s]).map(s=>({service:s,cost:'$'+tc[s],status:'new'}));
    const removed=Object.keys(lc).filter(s=>!tc[s]).map(s=>({service:s,lastCost:'$'+lc[s],status:'removed'}));
    const increased=Object.keys(tc).filter(s=>lc[s]&&tc[s]>lc[s]*1.5&&tc[s]-lc[s]>10).map(s=>({service:s,lastCost:'$'+lc[s],currentCost:'$'+tc[s],change:'+$'+(tc[s]-lc[s]).toFixed(2),status:'increased'}));
    res.json({hasCredentials:true,hasData:true,added,removed,increased,thisMonth:new Date(now.getFullYear(),now.getMonth(),1).toLocaleString('default',{month:'long',year:'numeric'}),lastMonth:new Date(now.getFullYear(),now.getMonth()-1,1).toLocaleString('default',{month:'long',year:'numeric'}),scannedAt:new Date().toISOString()});
  } catch(err) { if(err.code==='NO_CREDENTIALS') return noCreds(res,err.message); if(err.name==='AccessDeniedException') return res.json({hasCredentials:true,hasData:false,message:'Cost Explorer access denied.'}); return authErr(res,err); }
});

module.exports = router;
