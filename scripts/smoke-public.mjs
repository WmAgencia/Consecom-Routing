const checks=[
 {name:"Landing",url:"https://consecom-landing-v3-production.up.railway.app/healthz",expect:200,json:value=>value.ok===true},
 {name:"Portal",url:"https://consecom-ai-portal-production.up.railway.app/healthz",expect:200,json:value=>value.ok===true},
 {name:"Checkout",url:"https://consecom-checkout-production.up.railway.app/healthz",expect:200,json:value=>value.ok===true&&typeof value.checkoutReady==="boolean"},
 {name:"Painel",url:"https://consecom-proxy-dashboard-production.up.railway.app/healthz",expect:200,json:value=>value.ok===true},
 {name:"API principal",url:"https://api-consecom.up.railway.app/healthz",expect:200,json:value=>value.ok===true},
 {name:"API compatibilidade",url:"https://litellm-production-90c2f4f8.up.railway.app/healthz",expect:200,json:value=>value.ok===true},
 {name:"LiteLLM",url:"https://consecom-litellm-admin.up.railway.app/health/readiness",expect:200,json:value=>value.status==="healthy"&&value.db==="connected"},
 {name:"API sem credencial",url:"https://api-consecom.up.railway.app/v1/models",expect:401},
];

const results=await Promise.all(checks.map(async check=>{
 const started=Date.now();
 try{
  const response=await fetch(check.url,{redirect:"manual",signal:AbortSignal.timeout(15000)});
  let valid=response.status===check.expect;
  let details=`HTTP ${response.status}`;
  if(check.json){
   const payload=await response.json();
   valid=valid&&check.json(payload);
   details+=` · ${JSON.stringify(payload)}`;
  }
  return {...check,valid,details,duration:Date.now()-started};
 }catch(error){
  return {...check,valid:false,details:String(error),duration:Date.now()-started};
 }
}));

for(const result of results){
 console.log(`${result.valid?"PASS":"FAIL"} ${result.name} · ${result.duration}ms · ${result.details}`);
}

if(results.some(result=>!result.valid))process.exitCode=1;

