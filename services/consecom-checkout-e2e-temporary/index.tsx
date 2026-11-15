const base=(Bun.env.CHECKOUT_URL||"https://consecom-checkout-production.up.railway.app").replace(/\/$/,"");
const steps=[];
const record=(name,ok,details)=>steps.push({name,ok,details});

async function request(path,options={}){
 const response=await fetch(base+path,{redirect:"manual",signal:AbortSignal.timeout(10000),...options});
 return {status:response.status,contentType:response.headers.get("content-type"),text:await response.text()};
}

try{
 const home=await request("/");
 record("checkout-page",home.status===200&&home.text.includes("Escolha seu pacote"),home.status);

 const health=await request("/healthz");
 const healthBody=JSON.parse(health.text);
 record("health",health.status===200&&healthBody.ok===true,healthBody);

 const status=await request("/api/status");
 const statusBody=JSON.parse(status.text);
 record("configuration-status",status.status===200&&statusBody.configured===healthBody.checkoutReady,statusBody);

 const crossOrigin=await request("/api/start",{
  method:"POST",
  headers:{"Content-Type":"application/json","Origin":"https://example.invalid"},
  body:"{}"
 });
 record("cross-origin-rejected",crossOrigin.status===403,crossOrigin.status);

 const unsigned=await request("/webhooks/stripe",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:'{"type":"checkout.session.completed"}'
 });
 record("unsigned-webhook",healthBody.checkoutReady?unsigned.status===400:unsigned.status===200,unsigned.status);
}catch(error){
 record("exception",false,String(error).slice(0,240));
}

const failed=steps.filter(step=>!step.ok);
console.log("CHECKOUT_E2E "+JSON.stringify(steps));
if(failed.length)process.exitCode=1;
