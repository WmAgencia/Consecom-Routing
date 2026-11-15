
import { SQL } from "bun";
const db = new SQL(Bun.env.DATABASE_URL);
const base = Bun.env.LITELLM_URL;
const admin = Bun.env.LITELLM_MASTER_KEY;
if (!base || !admin || !Bun.env.DATABASE_URL) throw new Error("Monitor configuration incomplete");
const rows = await db`SELECT
 v.token AS id, v.blocked, v.metadata,
 COALESCE(u.tokens,0)::bigint AS tokens
 FROM "LiteLLM_VerificationToken" v
 LEFT JOIN (
  SELECT api_key, COALESCE(SUM(counted_tokens),0)::bigint AS tokens
  FROM consecom_usage_accounted WHERE counted_tokens>0 GROUP BY api_key
 ) u ON u.api_key=v.token
 WHERE (v.metadata->>'consecom_total_token_limit') IS NOT NULL
 LIMIT 1000`;
let checked=0, blocked=0, unblocked=0, failed=0;
for(const row of rows){
 checked++;
 const meta=row.metadata&&typeof row.metadata==="object"?row.metadata:{};
 const limit=Number(meta.consecom_total_token_limit);
 const tokens=Number(row.tokens);
 if(!Number.isFinite(limit)||limit<1||!Number.isFinite(tokens))continue;
 const exhausted=tokens>=limit;
 const shouldBlock=exhausted && !row.blocked;
 const shouldUnblock=!exhausted && row.blocked && meta.consecom_quota_auto_blocked===true;
 if(!shouldBlock&&!shouldUnblock)continue;
 const nextMeta={...meta,consecom_quota_auto_blocked:shouldBlock};
 try{
  const r=await fetch(base+"/key/update",{
   method:"POST",headers:{"Authorization":"Bearer "+admin,"Content-Type":"application/json"},
   body:JSON.stringify({key:row.id,blocked:shouldBlock,metadata:nextMeta}),
   signal:AbortSignal.timeout(12000)});
  if(!r.ok){failed++;continue;}
  if(shouldBlock)blocked++;else unblocked++;
 }catch{failed++}
}
await db.close();
console.log("QUOTA_MONITOR "+JSON.stringify({checked,blocked,unblocked,failed,frequency:"5min"}));

