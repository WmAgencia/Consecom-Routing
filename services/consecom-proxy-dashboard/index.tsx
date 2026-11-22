// HTTPS base URL accepted for a provider: public host only, no credentials, query or fragment.
// WHATWG URL keeps IPv6 literals wrapped in brackets, so strip them before checking.
export function publicHttpsBase(raw) {
  try {
    const parsed = new URL(String(raw || "").trim());
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) return null;
    if (/^\d+$/.test(host) || /^0x/i.test(host)) return null; // numeric IPv4 forms
    if (host.includes(":")) {
      // "::" covers ::, ::1, IPv4-mapped addresses and the deprecated IPv4-compatible range.
      if (host.startsWith("::") || /^(fc|fd|fe[89ab])/.test(host)) return null;
      return parsed.href.replace(/\/+$/, "");
    }
    const parts = host.split(".");
    if (parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part))) {
      const [a, b] = parts.map(Number);
      if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)) return null;
    }
    return parsed.href.replace(/\/+$/, "");
  } catch {
    return null;
  }
}
if (import.meta.main) (async function panelServer() {
  const { SQL } = await import("bun");
  const sql = new SQL(Bun.env.DATABASE_URL);
  const proxy = Bun.env.LITELLM_URL || "http://litellm.railway.internal:4000";
  const masterKey = Bun.env.LITELLM_MASTER_KEY || "";
  const adminEmail = (Bun.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const passwordHash = Bun.env.ADMIN_PASSWORD_HASH || "";
  const sessionSecret = Bun.env.SESSION_SECRET || "";
  const publicOrigin = Bun.env.PUBLIC_ORIGIN || "https://consecom-proxy-dashboard-production.up.railway.app";
  const proxyPublicUrl = (Bun.env.PUBLIC_API_URL || "https://litellm-production-90c2f4f8.up.railway.app").replace(/\/$/, "");
  const { pbkdf2Sync, createHmac, randomBytes, randomUUID } = await import("node:crypto");
  const failedLogins = new Map();
  const port = Number(Bun.env.PORT || 3000);
  if (!Bun.env.DATABASE_URL || !masterKey || !adminEmail || !passwordHash || !sessionSecret) throw new Error("Missing required credentials");
  await sql`CREATE TABLE IF NOT EXISTS consecom_proxy_panel_settings (
    id integer PRIMARY KEY,
    window_limit_usd double precision NOT NULL DEFAULT 20,
    monthly_limit_usd double precision NOT NULL DEFAULT 100,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`;
  await sql`INSERT INTO consecom_proxy_panel_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
  await sql`ALTER TABLE consecom_proxy_panel_settings ADD COLUMN IF NOT EXISTS usd_brl_rate double precision NOT NULL DEFAULT 5.6512`;
  await sql`ALTER TABLE consecom_users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1`;
  // Owner account is migrated once; subsequent deployments must not reset credentials.
  await sql`INSERT INTO consecom_tenants(id,slug,name) VALUES (${randomUUID()},'consecom-master','Consecom Brasil - Administração') ON CONFLICT(slug) DO NOTHING`;
  const masterTenants=await sql`SELECT id FROM consecom_tenants WHERE slug='consecom-master' LIMIT 1`;
  await sql`INSERT INTO consecom_users(id,tenant_id,email,display_name,password_hash,role) VALUES (${randomUUID()},${masterTenants[0].id},${adminEmail},'Administrador Consecom',${passwordHash},'admin') ON CONFLICT(email) DO NOTHING`;
  function safeEqual(a, b) {
    const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
    let diff = x.length ^ y.length;
    for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
    return diff === 0;
  }


  function signedSession(user) {
    const payload=Buffer.from(JSON.stringify({id:user.id,email:user.email,version:2,sv:user.sessionVersion,exp:Date.now()+12*60*60*1000})).toString("base64url");
    const signature=createHmac("sha256",sessionSecret).update(payload).digest("base64url");
    return payload+"."+signature;
  }
  function sessionCookie(value,maxAge=43200) {
    return "consecom_session="+value+"; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age="+maxAge;
  }
  async function getSession(req){
    const pair=(req.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("consecom_session="));
    if(!pair)return null;
    try{
      const value=pair.slice("consecom_session=".length);
      const dot=value.lastIndexOf(".");
      if(dot<1)return null;
      const payload=value.slice(0,dot);
      const sig=value.slice(dot+1);
      const expected=createHmac("sha256",sessionSecret).update(payload).digest("base64url");
      if(!safeEqual(sig,expected))return null;
      const data=JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
      if(data.version!==2||typeof data.id!=="string"||!Number.isFinite(data.exp)||data.exp<=Date.now())return null;
      const rows=await sql`SELECT id,tenant_id AS "tenantId",email,display_name AS name,role,is_active AS active,session_version AS "sessionVersion" FROM consecom_users WHERE id=${data.id} AND NOT EXISTS(SELECT 1 FROM consecom_tenants t WHERE t.id=consecom_users.tenant_id AND t.slug LIKE 'client-%') LIMIT 1`;
      const user=rows[0];
      if(!user||!user.active||user.email!==data.email||user.sessionVersion!==data.sv)return null;
      return {...user,isAdmin:user.role==="admin"};
    }catch{return null}
  }
  function verifyPassword(provided,hash){
    if(typeof provided!=="string"||provided.length>500||typeof hash!=="string")return false;
    const parts=hash.split("$");
    if(parts.length!==4||parts[0]!=="pbkdf2_sha256")return false;
    const rounds=Number(parts[1]);
    if(!Number.isInteger(rounds)||rounds<100000||rounds>1000000)return false;
    const derived=pbkdf2Sync(provided,Buffer.from(parts[2],"hex"),rounds,32,"sha256").toString("hex");
    return safeEqual(derived,parts[3]);
  }
  function hashPassword(value){
    const salt=randomBytes(16).toString("hex");
    const rounds=250000;
    return "pbkdf2_sha256$"+rounds+"$"+salt+"$"+pbkdf2Sync(value,Buffer.from(salt,"hex"),rounds,32,"sha256").toString("hex");
  }
  function randomPassword(){
    return randomBytes(18).toString("base64url");
  }
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "Referrer-Policy": "no-referrer" };
  const response = (payload, code = 200) => new Response(JSON.stringify(payload, (_k, v) => typeof v === "bigint" ? Number(v) : v), { status: code, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" } });
  async function upstream(path, method = "GET", data) {
    const r = await fetch(proxy + path, { method, headers: { Authorization: "Bearer " + masterKey, "Content-Type": "application/json" }, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(18000) });
    let j = {};
    try { j = await r.json(); } catch {}
    if (!r.ok) throw new Error("LiteLLM: " + (j?.error?.message || j?.detail?.error || j?.detail || "HTTP " + r.status).toString().slice(0, 280));
    return j;
  }
  function n(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
  async function settings() {
    const rows = await sql`SELECT window_limit_usd AS "windowUsd", monthly_limit_usd AS "monthlyUsd", usd_brl_rate AS "usdBrlRate" FROM consecom_proxy_panel_settings WHERE id=1`;
    return { windowUsd: n(rows[0]?.windowUsd) || 20, monthlyUsd: n(rows[0]?.monthlyUsd) || 100, usdBrlRate: n(rows[0]?.usdBrlRate) || 5.6512 };
  }

  const commercialPackages = Object.freeze([{id:"trial-10m",name:"Teste · 10 milhões",tokens:10000000,priceBrl:9.99,apiUsd:0.10},{id:"50m",name:"50 milhões",tokens:50000000,priceBrl:29.99,apiUsd:0.50},{id:"100m",name:"100 milhões",tokens:100000000,priceBrl:52.99,apiUsd:1.00},{id:"250m",name:"250 milhões",tokens:250000000,priceBrl:109.99,apiUsd:2.50},{id:"500m",name:"500 milhões",tokens:500000000,priceBrl:184.99,apiUsd:5.00},{id:"750m",name:"750 milhões",tokens:750000000,priceBrl:249.99,apiUsd:7.50},{id:"1b",name:"1 bilhão",tokens:1000000000,priceBrl:199.99,apiUsd:10.00}]);
  async function overview(days,viewer) {
    const [total, window, month, models, keys, daily, recent, config] = await Promise.all([
      sql`SELECT COUNT(*)::int AS requests,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,
        COALESCE(SUM(GREATEST(counted_tokens-output_tokens,0)),0)::bigint AS input,
        COALESCE(SUM(output_tokens),0)::bigint AS output,
        COALESCE(SUM(cache_read_tokens),0)::bigint AS "cacheRead",
        COALESCE(SUM(cache_write_tokens),0)::bigint AS "cacheWrite",
        COALESCE(SUM(reasoning_tokens),0)::bigint AS reasoning,
        COALESCE(SUM(spend),0)::double precision AS cost,
        COUNT(*) FILTER (WHERE status='success')::int AS success,
        COUNT(*) FILTER (WHERE status='failure')::int AS failed,
        COUNT(*) FILTER (WHERE counted_tokens>0 AND spend=0)::int AS unpriced
      FROM consecom_usage_accounted WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=api_key AND assigned.owner_user_id=${viewer.id})) AND time >= (NOW() AT TIME ZONE 'UTC') - (${days}::numeric * INTERVAL '1 day')`,
      sql`SELECT COUNT(*)::int AS requests,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,COALESCE(SUM(spend),0)::double precision AS cost,COUNT(*) FILTER (WHERE counted_tokens>0 AND spend=0)::int AS unpriced FROM consecom_usage_accounted WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=api_key AND assigned.owner_user_id=${viewer.id})) AND time >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '5 hours'`,
      sql`SELECT COUNT(*)::int AS requests,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,COALESCE(SUM(spend),0)::double precision AS cost,COUNT(*) FILTER (WHERE counted_tokens>0 AND spend=0)::int AS unpriced FROM consecom_usage_accounted WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=api_key AND assigned.owner_user_id=${viewer.id})) AND time >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')`,
      sql`SELECT COALESCE(NULLIF(model_group,''),NULLIF(model,''),'Sem modelo') AS name,COUNT(*)::int AS requests,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,COALESCE(SUM(cache_read_tokens),0)::bigint AS "cacheRead",COALESCE(SUM(cache_write_tokens),0)::bigint AS "cacheWrite",COALESCE(SUM(spend),0)::double precision AS cost FROM consecom_usage_accounted WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=api_key AND assigned.owner_user_id=${viewer.id})) AND time >= (NOW() AT TIME ZONE 'UTC') - (${days}::numeric * INTERVAL '1 day') GROUP BY 1 ORDER BY requests DESC LIMIT 12`,
      sql`SELECT api_key AS id,COUNT(*)::int AS requests,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,COALESCE(SUM(cache_read_tokens),0)::bigint AS "cacheRead",COALESCE(SUM(cache_write_tokens),0)::bigint AS "cacheWrite",COALESCE(SUM(spend),0)::double precision AS cost FROM consecom_usage_accounted WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=api_key AND assigned.owner_user_id=${viewer.id})) AND time >= (NOW() AT TIME ZONE 'UTC') - (${days}::numeric * INTERVAL '1 day') GROUP BY 1 ORDER BY requests DESC LIMIT 250`,
      sql`SELECT TO_CHAR(time,'YYYY-MM-DD') AS day,COUNT(*)::int AS requests,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,COALESCE(SUM(spend),0)::double precision AS cost FROM consecom_usage_accounted WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=api_key AND assigned.owner_user_id=${viewer.id})) AND time >= (NOW() AT TIME ZONE 'UTC') - (${days}::numeric * INTERVAL '1 day') GROUP BY 1 ORDER BY 1 ASC`,
      sql`SELECT a.time,COALESCE(NULLIF(v.key_alias,''),NULLIF(v.key_name,''),'Chave não identificada') AS key,
        COALESCE(NULLIF(a.model_group,''),NULLIF(a.model,''),'Desconhecido') AS model,
        a.counted_tokens AS tokens,GREATEST(a.counted_tokens-a.output_tokens,0) AS input,a.output_tokens AS output,
        a.cache_read_tokens AS "cacheRead",a.cache_write_tokens AS "cacheWrite",a.reasoning_tokens AS reasoning,
        a.spend AS cost,a.status AS status,
        CASE WHEN COALESCE(l.api_base,'') ILIKE '%deepseek%' THEN 'Consecom AI' WHEN COALESCE(l.api_base,'') ILIKE '%opencode%' THEN 'OpenCode' ELSE COALESCE(l.custom_llm_provider,'Desconhecido') END AS provider
        FROM consecom_usage_accounted a JOIN "LiteLLM_SpendLogs" l ON a.request_id=l.request_id LEFT JOIN "LiteLLM_VerificationToken" v ON a.api_key=v.token WHERE (${viewer.isAdmin} OR EXISTS(SELECT 1 FROM consecom_key_owners assigned WHERE assigned.key_token=a.api_key AND assigned.owner_user_id=${viewer.id})) ORDER BY a.time DESC LIMIT 75`,
      settings()
    ]);
    return { rangeDays: days, total:total[0],window:window[0],month:month[0],models,byKey:keys,daily,recent,settings:config,generatedAt:new Date().toISOString(),baseUrl:proxyPublicUrl,costNotice:"O consumo considera entrada, saída e cache sem duplicação. Valores de terceiros dependem dos registros enviados pelo provedor." };
  }
  async function listKeys(viewer) {
    const rate=(await settings()).usdBrlRate;
    const rows = await sql`SELECT v.token AS id, COALESCE(NULLIF(v.key_alias,''),NULLIF(v.key_name,''),'Sem nome') AS name, v.models, v.spend, v.total_spend AS "totalSpend", v.max_budget AS "maxBudget", v.budget_duration AS "budgetDuration", v.blocked, v.metadata, v.created_at AS "createdAt", v.last_active AS "lastActive", v.expires, v.rpm_limit AS "rpmLimit", v.tpm_limit AS "tpmLimit", v.tpd_limit AS "tpdLimit",
    COALESCE(usage.tokens,0)::bigint AS "lifetimeTokens",COALESCE(usage.request_count,0)::bigint AS "lifetimeRequests",COALESCE(usage.cache_read,0)::bigint AS "lifetimeCacheRead",COALESCE(usage.cache_write,0)::bigint AS "lifetimeCacheWrite",COALESCE(usage.output,0)::bigint AS "lifetimeOutput",COALESCE(usage.reasoning,0)::bigint AS "lifetimeReasoning", owner.owner_user_id AS "ownerUserId", assigned.display_name AS "ownerName"
    FROM "LiteLLM_VerificationToken" v
    LEFT JOIN (
      SELECT api_key,COALESCE(SUM(counted_tokens),0)::bigint AS tokens,COUNT(*)::bigint AS request_count,COALESCE(SUM(cache_read_tokens),0)::bigint AS cache_read,COALESCE(SUM(cache_write_tokens),0)::bigint AS cache_write,COALESCE(SUM(output_tokens),0)::bigint AS output,COALESCE(SUM(reasoning_tokens),0)::bigint AS reasoning
      FROM consecom_usage_accounted WHERE api_key IS NOT NULL GROUP BY api_key
    ) usage ON usage.api_key=v.token
    LEFT JOIN consecom_key_owners owner ON owner.key_token=v.token
    LEFT JOIN consecom_users assigned ON assigned.id=owner.owner_user_id
    WHERE (${viewer.isAdmin} OR owner.owner_user_id=${viewer.id})
    ORDER BY v.created_at DESC LIMIT 300`;
    return rows.map(r => {
      const meta=(r.metadata && typeof r.metadata==="object" && !Array.isArray(r.metadata))?r.metadata:{};
      const tokenLimit=meta.consecom_total_token_limit==null?null:Number(meta.consecom_total_token_limit);
      const brl=meta.consecom_budget_brl==null?(r.maxBudget==null?null:Math.round(n(r.maxBudget)*rate*100)/100):Number(meta.consecom_budget_brl);
      const fx=n(meta.consecom_budget_fx)||rate;
      return {
        id:r.id,name:r.name,ownerUserId:r.ownerUserId||null,ownerName:r.ownerName||null,models:Array.isArray(r.models)?r.models:[],spend:n(r.spend),totalSpend:n(r.totalSpend),maxBudget:r.maxBudget==null?null:n(r.maxBudget),
        budgetDuration:r.budgetDuration,blocked:Boolean(r.blocked),createdAt:r.createdAt,lastActive:r.lastActive,expires:r.expires,
        lifetimeTokens:Number(r.lifetimeTokens),lifetimeRequests:Number(r.lifetimeRequests),lifetimeCacheRead:Number(r.lifetimeCacheRead),lifetimeCacheWrite:Number(r.lifetimeCacheWrite),lifetimeOutput:Number(r.lifetimeOutput),lifetimeReasoning:Number(r.lifetimeReasoning),
        totalTokenLimit:Number.isFinite(tokenLimit)&&tokenLimit>0?tokenLimit:null,
        budgetBrl:Number.isFinite(brl)&&brl>0?brl:null,
        spentBrl:n(r.totalSpend)*fx,exchangeRate:fx,
        quotaAutoBlocked:meta.consecom_quota_auto_blocked===true,
        keyHint:"••••"+String(r.id).slice(-6)
      };
    });
  }

  async function resolveKeyOwner(optionalId,viewer){
    if(!optionalId)return {id:viewer.id,tenantId:viewer.tenantId};
    const rows=await sql`SELECT u.id,u.tenant_id AS "tenantId" FROM consecom_users u WHERE u.id=${optionalId} AND u.role='employee' AND u.is_active=true AND NOT EXISTS(SELECT 1 FROM consecom_tenants t WHERE t.id=u.tenant_id AND t.slug LIKE 'client-%') LIMIT 1`;
    return rows[0]||null;
  }
  const html = String.raw`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Consecom AI | Controle de Inferência</title><meta name="theme-color" content="#f6f7f9"><style>
:root{font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#141923;background:#f6f7f9;font-size:14px}
*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}
.layout{min-height:100vh;display:flex}.aside{width:236px;background:#fff;border-right:1px solid #e9eaf0;display:flex;flex-direction:column;padding:26px 16px;position:sticky;top:0;height:100vh;flex-shrink:0}
.brand{display:flex;align-items:center;gap:10px;padding:0 12px;margin-bottom:44px}.logo{width:34px;height:34px;border-radius:11px;background:#f56d24;color:#fff;font-weight:900;display:grid;place-items:center;font-size:17px;box-shadow:0 5px 12px #f56d2438}.brand b{font-size:14px;letter-spacing:.7px}.brand small{display:block;font-size:10px;color:#87909b;margin-top:2px;letter-spacing:1px;font-weight:600}
.nav-label{color:#9a9fa8;font-weight:700;font-size:10px;letter-spacing:1.5px;padding:0 14px;margin-bottom:12px}.nav{display:flex;flex-direction:column;gap:5px}.nav button{border:0;background:none;color:#66717e;text-align:left;padding:12px 15px;border-radius:9px;display:flex;align-items:center;gap:12px;font-weight:600;font-size:13px}.nav button.active{background:#fff1e7;color:#e96018}.nav button:hover{background:#f6f7f9}.nav button.active:hover{background:#fff1e7}.nav .ic{font-size:17px;width:20px;text-align:center}.aside-bottom{margin-top:auto;padding:16px 13px 0;border-top:1px solid #eef0f3;font-size:11px;color:#929aa5;line-height:1.6}
main{flex:1;min-width:0;padding:30px 37px 55px;max-width:1680px;margin:0 auto}.top{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:30px}.eyebrow{color:#9b9fa8;font-size:11px;text-transform:uppercase;letter-spacing:1.6px;font-weight:800;margin-bottom:6px}h1{font-size:27px;letter-spacing:-1px;margin:0;font-weight:760}.desc{color:#9299a5;font-size:13px;margin:8px 0 0}.top-right{display:flex;align-items:center;gap:10px}.live{display:flex;align-items:center;gap:7px;color:#21885b;font-size:12px;font-weight:600;background:#eaf8f0;border:1px solid #d4eddf;padding:10px 12px;border-radius:8px}.live:before{content:"";background:#22a66d;width:7px;height:7px;border-radius:50%}
.btn{border:1px solid #e2e5ea;border-radius:9px;background:white;color:#313a46;padding:10px 15px;font-weight:650;display:inline-flex;gap:8px;align-items:center;justify-content:center}.btn:hover{background:#f8f8fa}.btn-primary{background:#f56d24;border-color:#f56d24;color:white;box-shadow:0 5px 12px #f56d241f}.btn-primary:hover{background:#e45e18}.btn-danger{color:#d24941;border-color:#f2d7d3}.btn-sm{padding:7px 10px;font-size:12px}.period{display:flex;background:#eef0f3;padding:4px;border-radius:10px;gap:2px}.period button{background:none;border:0;padding:8px 11px;border-radius:7px;color:#78828e;font-weight:650;font-size:12px}.period button.on{background:white;color:#202834;box-shadow:0 2px 5px #0000000b}
.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}.card{background:#fff;border:1px solid #eaecf0;border-radius:14px;padding:21px;box-shadow:0 2px 10px #242d3804}.metric-title{font-size:12px;color:#838d99;font-weight:650;display:flex;justify-content:space-between}.metric-title span{background:#f5f6f8;color:#929aa5;padding:5px 7px;border-radius:7px}.value{font-weight:780;font-size:28px;letter-spacing:-1.1px;margin:14px 0 5px}.caption{color:#9aa2ac;font-size:11px;line-height:1.5}.section-grid{display:grid;grid-template-columns:1.8fr 1fr;gap:16px;margin-top:16px}.section-grid.equal{grid-template-columns:1fr 1fr}.section-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:19px}.section-head h3{margin:0;font-size:15px;letter-spacing:-.3px}.muted{font-size:11px;color:#979faa}.chart{height:205px;display:flex;align-items:flex-end;gap:9px;padding-top:12px;overflow:hidden}.chart .bar-wrap{flex:1;min-width:8px;display:flex;align-items:center;flex-direction:column;justify-content:end;height:100%;gap:9px}.chart .bar{width:100%;max-width:36px;background:#f8b388;border-radius:5px 5px 0 0;min-height:3px;transition:.25s}.chart .bar:hover{background:#f56d24}.chart .bar-label{font-size:10px;color:#9ea6b1;white-space:nowrap}
.bar-meter{height:9px;width:100%;background:#f0f1f4;border-radius:50px;overflow:hidden}.bar-meter>span{display:block;height:100%;background:#f56d24;border-radius:50px;transition:width .3s}.progress-stats{display:flex;justify-content:space-between;margin-top:10px;font-size:12px}.progress-stats strong{font-size:18px}.progress-block+.progress-block{margin-top:22px;padding-top:18px;border-top:1px solid #eef0f3}.pill{display:inline-block;border-radius:30px;padding:5px 9px;font-size:11px;font-weight:750;background:#f4f5f8;color:#697586}.pill.green{background:#e9f8f0;color:#21865b}.pill.red{background:#fff0ee;color:#c85b4d}.pill.orange{background:#fff1e6;color:#da702a}
.note{border:1px solid #f5e0c5;background:#fffaf3;border-radius:11px;padding:13px 15px;color:#906437;font-size:12px;line-height:1.6;margin-top:16px}.note svg{vertical-align:middle}
.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}th{font-weight:700;font-size:11px;color:#969eaa;padding:12px 10px;border-bottom:1px solid #ecedf1;text-transform:uppercase;letter-spacing:.45px;white-space:nowrap}td{padding:14px 10px;border-bottom:1px solid #f0f1f4;color:#374150;font-size:12px;vertical-align:middle}tr:last-child td{border-bottom:0}td b{font-weight:700;color:#202834}.name-row{display:flex;align-items:center;gap:10px}.key-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#fff2e8;color:#e97026;font-size:17px;flex-shrink:0}
.tool-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:17px}.search{width:270px;max-width:100%;border:1px solid #e5e7ed;border-radius:9px;background:white;padding:10px 13px;outline:none}.search:focus,.field:focus{border-color:#f8a174;box-shadow:0 0 0 3px #f56d2412}.hidden{display:none!important}.view{animation:fade .2s ease}@keyframes fade{from{opacity:.5;transform:translateY(5px)}to{opacity:1;transform:none}}
.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.field-group{display:flex;flex-direction:column;gap:7px}.field-label{font-weight:700;color:#4c5865;font-size:12px}.field{width:100%;background:#fff;border:1px solid #e3e6ed;padding:11px 12px;border-radius:9px;outline:none}.form-hint{font-size:11px;color:#939ba7;line-height:1.5}.model-select{display:flex;flex-wrap:wrap;gap:9px;margin-top:4px}.model-choice{border:1px solid #e5e6eb;border-radius:8px;padding:8px 11px;font-size:12px;color:#4a5665;display:inline-flex;gap:6px;align-items:center}
dialog{border:0;border-radius:17px;width:min(520px,calc(100vw - 28px));box-shadow:0 25px 75px #13203644;padding:28px;color:#1e2835}dialog::backdrop{background:#10172399;backdrop-filter:blur(4px)}dialog h2{margin:0 0 7px;font-size:21px;letter-spacing:-.6px}dialog p{color:#86919e;font-size:12px;line-height:1.6}dialog .actions{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}.secret{width:100%;padding:13px;border-radius:9px;background:#f6f7f9;border:1px dashed #e2e5e9;word-break:break-all;font-family:ui-monospace,monospace;font-size:12px;color:#293342}.danger-note{color:#aa503b}
.toast{position:fixed;right:25px;bottom:22px;background:#1b2530;color:white;padding:14px 18px;border-radius:10px;box-shadow:0 10px 25px #0002;max-width:350px;font-size:13px;z-index:20}
.section-hint{font-size:12px;color:#8c97a4;line-height:1.6;margin-top:2px}.empty{text-align:center;color:#a5acb7;padding:38px 10px;font-size:13px}
@media(max-width:1180px){.cards{grid-template-columns:repeat(2,1fr)}.section-grid{grid-template-columns:1fr}}@media(max-width:780px){.aside{position:fixed;bottom:0;top:auto;width:100%;height:auto;flex-direction:row;padding:7px;background:#fff;z-index:5;border-top:1px solid #e6e7ea;border-right:0}.brand,.nav-label,.aside-bottom{display:none}.nav{flex-direction:row;width:100%;justify-content:space-between}.nav button{font-size:10px;padding:9px 8px;gap:3px;flex-direction:column}.nav .ic{font-size:18px}main{padding:22px 15px 90px}.top{align-items:flex-start;flex-direction:column}.top-right{width:100%;justify-content:space-between}.cards{gap:10px}.card{padding:15px}.value{font-size:23px}.section-grid.equal{grid-template-columns:1fr}.form-grid{grid-template-columns:1fr}}
</style></head><body><div class="layout">
<aside class="aside"><div class="brand"><div class="logo">C</div><div><b>CONSECOM AI</b><small>PROXY MANAGER</small></div></div><div class="nav-label">PAINEL DE CONTROLE</div><nav class="nav">
<button data-view="overview" class="active"><span class="ic">◫</span> Visão geral</button><button data-view="keys"><span class="ic">⚿</span> API Keys</button><button data-view="providers" class="admin-only"><span class="ic">⬡</span> Provedores</button><button data-view="requests"><span class="ic">≡</span> Requisições</button><button data-view="settings" class="admin-only"><span class="ic">⚙</span> Configurações</button><button data-view="employees" class="admin-only"><span class="ic">♙</span> Funcionários</button><button data-view="account"><span class="ic">◉</span> Minha conta</button>
</nav><div class="aside-bottom">CONSECOM AI PROXY<br>Analytics • LiteLLM • Railway<br><span id="lastSync">Aguardando sincronização</span></div></aside>
<main><header class="top"><div><div class="eyebrow">CONSECOM / INTELIGÊNCIA ARTIFICIAL</div><h1 id="heading">Visão geral</h1><p id="subtitle" class="desc">Controle de consumo, custos e acesso às suas APIs.</p></div><div class="top-right"><span class="live">Proxy ativo</span><span class="pill" id="currentUserRole">Carregando conta</span><div class="period" id="period"><button data-days="1">24h</button><button data-days="7" class="on">7 dias</button><button data-days="30">30 dias</button></div><button class="btn" id="logoutBtn">Sair</button></div></header>
<div id="view-overview" class="view">
<div class="cards">
<div class="card"><div class="metric-title">Requisições <span>↗</span></div><div class="value" id="reqCount">—</div><div class="caption" id="reqCaption">No período selecionado</div></div>
<div class="card"><div class="metric-title">Total de tokens <span>◇</span></div><div class="value" id="tokenCount">—</div><div class="caption" id="tokensCaption">Entrada + saída</div></div>
<div class="card"><div class="metric-title">Custo contabilizado <span>$</span></div><div class="value" id="costCount">—</div><div class="caption">Pelo LiteLLM • USD</div></div>
<div class="card"><div class="metric-title">Taxa de sucesso <span>✓</span></div><div class="value" id="successCount">—</div><div class="caption" id="failedCaption">Requisições finalizadas</div></div>
</div>
<div class="section-grid"><div class="card"><div class="section-head"><h3>Atividade no período</h3><span class="muted">Requisições por dia</span></div><div class="chart" id="activityChart"><div class="empty">Carregando dados...</div></div></div>
<div class="card"><div class="section-head"><h3>Limites de referência</h3><span class="pill orange">Estimativa interna</span></div>
<div class="progress-block"><div class="metric-title">Janela móvel de 5 horas</div><div class="progress-stats"><strong id="windowCost">—</strong><span id="windowLimit">—</span></div><div class="bar-meter"><span id="windowBar" style="width:0"></span></div><div class="caption" style="margin-top:8px" id="windowPct">—</div></div>
<div class="progress-block"><div class="metric-title">Mês atual</div><div class="progress-stats"><strong id="monthCost">—</strong><span id="monthLimit">—</span></div><div class="bar-meter"><span id="monthBar" style="width:0"></span></div><div class="caption" style="margin-top:8px" id="monthPct">—</div></div></div></div>
<div class="section-grid equal">
<div class="card"><div class="section-head"><h3>Consumo por modelo</h3><span class="muted">Distribuição de requisições</span></div><div class="table-wrap"><table><thead><tr><th>Modelo</th><th>Chamadas</th><th>Tokens</th><th>Custo</th></tr></thead><tbody id="modelTable"><tr><td colspan="4" class="empty">Carregando...</td></tr></tbody></table></div></div>
<div class="card"><div class="section-head"><h3>Maiores consumidores</h3><span class="muted">API Keys</span></div><div class="table-wrap"><table><thead><tr><th>Chave</th><th>Chamadas</th><th>Tokens</th></tr></thead><tbody id="keySummary"><tr><td colspan="3" class="empty">Carregando...</td></tr></tbody></table></div></div></div>
<div class="note" id="costWarning">Os valores exibidos são dados do proxy. O saldo real de franquias de provedores externos precisa de integração própria e não está sendo consultado.</div></div>
<div id="view-keys" class="view hidden"><div class="tool-row"><div><h3 style="margin:0 0 4px">Gerenciar chaves</h3><span class="section-hint">Uma chave individual para cada colaborador ou aplicativo.</span></div><button class="btn btn-primary admin-only" id="createOpen">+ Nova API Key</button></div>
<div class="card"><div class="table-wrap"><table><thead><tr><th>Identificação / responsável</th><th>Chamadas</th><th>Tokens</th><th>Custo</th><th>Orçamento total</th><th>Limite de tokens</th><th>Situação</th><th>Ações</th></tr></thead><tbody id="keysTable"><tr><td colspan="8" class="empty">Carregando...</td></tr></tbody></table></div></div>
<div class="note">As chaves são criadas no LiteLLM e funcionam na Base URL do proxy. Uma nova chave é exibida apenas no momento da criação. A chave administrativa original nunca aparece aqui.</div></div>
<div id="view-requests" class="view hidden"><div class="tool-row"><div><h3 style="margin:0 0 4px">Histórico de requisições</h3><span class="section-hint">Últimas 75 chamadas registradas. Sem expor conteúdo das mensagens.</span></div><input id="requestFilter" class="search" placeholder="Filtrar por modelo, chave ou provedor..."></div>
<div class="card"><div class="table-wrap"><table><thead><tr><th>Data e hora</th><th>Chave</th><th>Modelo</th><th>Provedor</th><th>Entrada</th><th>Cache lido</th><th>Cache criado</th><th>Saída</th><th>Raciocínio*</th><th>Total</th><th>USD</th><th>Status</th></tr></thead><tbody id="requestsTable"><tr><td colspan="9" class="empty">Carregando...</td></tr></tbody></table></div></div></div>
<div id="view-providers" class="view hidden">
<div class="tool-row"><div><h3 style="margin:0 0 4px">Provedores de inferência</h3><span class="section-hint">Cadastre um provedor externo, sua Base URL e credenciais. O acesso dos funcionários continua pela API do Consecom Proxy.</span></div>
<button class="btn btn-primary" id="providerOpen">+ Adicionar provedor</button></div>
<div class="card"><div class="table-wrap"><table><thead><tr><th>Provedor</th><th>Modelo no proxy</th><th>API upstream</th><th>Credencial</th><th>Chamadas</th><th>Tokens</th><th>Operações</th></tr></thead><tbody id="providersTable"><tr><td colspan="7" class="empty">Carregando provedores...</td></tr></tbody></table></div></div>
<div class="note">As chaves dos provedores não ficam disponíveis para leitura depois de salvas. Esta tela mostra configurações registradas no LiteLLM, não a disponibilidade ou saldo real das franquias. Para conectar assinaturas de terceiros, confirme que o plano permite o acesso pela API e uso em equipe.</div></div>

<div id="view-employees" class="view hidden">
<div class="tool-row"><div><h3 style="margin:0 0 4px">Contas de funcionários</h3><span class="section-hint">Cada colaborador acessa somente as chaves atribuídas a ele e seu próprio consumo. A administração tem acesso global.</span></div><button class="btn btn-primary" id="employeeOpen">+ Novo funcionário</button></div>
<div class="card"><div class="table-wrap"><table><thead><tr><th>Funcionário</th><th>Conta</th><th>API keys atribuídas</th><th>Status</th><th>Ações</th></tr></thead><tbody id="employeesTable"><tr><td colspan="5" class="empty">Carregando usuários...</td></tr></tbody></table></div></div>
<div class="note">Ao desativar um funcionário, sua sessão é invalidada e suas chaves atribuídas são bloqueadas. Reativar a conta não desbloqueia automaticamente as chaves.</div>
</div>
<div id="view-account" class="view hidden">
<div class="section-grid equal">
<div class="card"><div class="section-head"><h3>Meu acesso</h3></div><div class="field-group"><span class="field-label">Conta</span><div class="secret" id="myAccountName">Carregando...</div></div><div class="field-group" style="margin-top:14px"><span class="field-label">E-mail</span><div class="secret" id="myAccountEmail">Carregando...</div></div>
<div class="field-group" style="margin-top:14px"><span class="field-label">Base URL da API</span><div class="secret" id="myApiUrl">Carregando...</div><button class="btn" id="copyMyApi" type="button" style="margin-top:8px">Copiar Base URL</button></div>
<div class="field-group" style="margin-top:14px"><span class="field-label">Claude Code (formato Anthropic)</span><div class="secret" id="myAnthropicUrl">Carregando...</div><button class="btn" id="copyMyAnthropic" type="button" style="margin-top:8px">Copiar URL Anthropic</button></div>
</div>
<div class="card"><div class="section-head"><h3>Alterar minha senha</h3></div><form id="accountPasswordForm"><div class="field-group"><label class="field-label">Senha atual</label><input class="field" id="passwordOld" type="password" autocomplete="current-password" required></div><div class="field-group" style="margin-top:15px"><label class="field-label">Nova senha</label><input class="field" id="passwordNew" type="password" minlength="10" maxlength="150" autocomplete="new-password" required></div><div class="field-group" style="margin-top:15px"><label class="field-label">Confirmar nova senha</label><input class="field" id="passwordConfirm" type="password" minlength="10" autocomplete="new-password" required></div><button class="btn btn-primary" type="submit" style="margin-top:18px">Atualizar senha</button></form><p class="section-hint" style="margin-top:13px">Após a alteração, você precisará entrar novamente.</p></div>
</div></div>
<div id="view-settings" class="view hidden"><div class="section-grid equal"><div class="card"><div class="section-head"><h3>Limites de referência</h3></div><p class="section-hint">Use os valores da sua franquia como referência visual. Estes limites não alteram as franquias do OpenCode nem impedem gastos no provedor de inferência.</p><form id="settingsForm" style="margin-top:18px"><div class="field-group"><label class="field-label" for="windowInput">Valor de referência da janela de 5h (US$)</label><input id="windowInput" class="field" type="number" min=".01" max="100000" step=".01" value="20" required></div><div class="field-group" style="margin-top:15px"><label class="field-label" for="monthInput">Valor de referência mensal (US$)</label><input id="monthInput" class="field" type="number" min=".01" max="1000000" step=".01" value="100" required></div><div class="field-group" style="margin-top:15px"><label class="field-label" for="usdBrlRate">Cotação USD/BRL para orçamentos em reais</label><input id="usdBrlRate" class="field" type="number" min="1" max="20" step=".0001" value="5.6512" required><span class="form-hint">Cotação fixa por chave, aplicada ao salvar. Não altera limites já cadastrados.</span></div><button class="btn btn-primary" style="margin-top:20px" type="submit">Salvar referência</button></form></div>
<div class="card"><div class="section-head"><h3>Informações da API</h3></div><div class="field-group"><span class="field-label">Base URL (Claude Code)</span><div class="secret" id="baseUrl"></div></div><p class="section-hint" style="margin-top:18px">Os custos são os valores registrados pelo LiteLLM. Se não houver tarifa configurada para um modelo, os valores podem ficar zerados, mesmo com consumo real no provedor.</p><a class="btn" href="https://litellm-production-90c2f4f8.up.railway.app/ui" rel="noopener noreferrer" target="_blank">Administração avançada do LiteLLM ↗</a></div></div></div>
</main></div>

<dialog id="employeeModal"><h2>Criar conta de funcionário</h2><p>O acesso é individual. Uma senha temporária será gerada e exibida somente uma vez.</p>
<form id="employeeForm"><div class="field-group"><label class="field-label" for="employeeName">Nome</label><input class="field" id="employeeName" minlength="2" maxlength="90" placeholder="Nome do colaborador" required></div>
<div class="field-group" style="margin-top:15px"><label class="field-label" for="employeeEmail">E-mail</label><input class="field" id="employeeEmail" type="email" maxlength="240" placeholder="colaborador@empresa.com" required></div>
<div class="actions"><button class="btn" type="button" id="employeeCancel">Cancelar</button><button class="btn btn-primary" type="submit" id="employeeSubmit">Criar conta</button></div></form></dialog>
<dialog id="employeeCredentialsModal"><h2>Conta criada</h2><p>Copie os dados de acesso para entregar ao funcionário por um canal privado.</p>
<div class="field-group"><label class="field-label">E-mail</label><div class="secret" id="employeeCreatedEmail"></div><button class="btn" id="copyEmployeeEmail" type="button">Copiar e-mail</button></div>
<div class="field-group" style="margin-top:14px"><label class="field-label">Senha temporária</label><div class="secret" id="employeeCreatedPassword"></div><button class="btn btn-primary" id="copyEmployeePassword" type="button">Copiar senha</button></div>
<div class="actions"><button class="btn" id="employeeCredentialsClose" type="button">Concluir</button></div></dialog>
<dialog id="createModal"><h2>Criar API Key</h2><p>Configure, se desejar, um limite acumulado de tokens e um orçamento total em reais.</p>
<form id="keyForm">
<div class="field-group"><label class="field-label" for="commercialPackage">Pacote comercial</label><select class="field" id="commercialPackage"><option value="">Configuração manual</option><option value="trial-10m">Teste · 10 milhões — R$ 9,99 (US$ 0,10 de API)</option><option value="50m">50 milhões — R$ 29,99 (US$ 0,50 de API)</option><option value="100m">100 milhões — R$ 52,99 (US$ 1,00 de API)</option><option value="250m">250 milhões — R$ 109,99 (US$ 2,50 de API)</option><option value="500m">500 milhões — R$ 184,99 (US$ 5,00 de API)</option><option value="750m">750 milhões — R$ 249,99 (US$ 7,50 de API)</option><option value="1b">1 bilhão — R$ 199,99 (US$ 10,00 de API)</option></select><span class="form-hint">O limite do pacote é financeiro (USD). Os tokens reais variam conforme o modelo e o uso. A seleção não processa pagamento.</span></div>
<div class="field-group"><label class="field-label" for="keyName">Nome da chave</label><input id="keyName" class="field" minlength="2" maxlength="80" placeholder="Ex.: Funcionário João" required></div>
<div class="form-grid" style="margin-top:16px">
<div class="field-group"><label class="field-label" for="keyTotalTokens">Limite total de tokens</label><input id="keyTotalTokens" class="field" type="number" min="1" max="100000000000000" step="1" placeholder="Sem limite"><span class="form-hint">Total acumulado, não por dia.</span></div>
<div class="field-group"><label class="field-label" for="keyBudgetBrl">Orçamento total (R$)</label><input id="keyBudgetBrl" class="field" type="number" min="0.01" max="10000000" step=".01" placeholder="Sem teto"><span class="form-hint">Valor total, sem renovação mensal.</span></div></div>
<div class="field-group" style="margin-top:15px"><label class="field-label" for="keyOwner">Responsável pela chave</label><select id="keyOwner" class="field"><option value="">Administração Consecom</option></select></div><div class="field-group" style="margin-top:15px"><label class="field-label" for="keyDuration">Validade da chave</label><select id="keyDuration" class="field"><option value="">Sem expiração</option><option value="30d">30 dias</option><option value="90d">90 dias</option><option value="365d">1 ano</option></select></div>
<p class="section-hint" style="margin:12px 0">O teto de tokens é monitorado periodicamente e pode ser ultrapassado por chamadas simultâneas. O orçamento em reais é convertido para USD na configuração.</p>
<div class="actions"><button type="button" class="btn" id="keyCancel">Cancelar</button><button type="submit" class="btn btn-primary" id="createSubmit">Criar chave</button></div></form></dialog>
<dialog id="editKeyModal"><h2>Editar API Key</h2><p>Defina os limites totais, sem gerar uma nova chave. O histórico de utilização será preservado.</p>
<form id="editKeyForm">
<div class="field-group"><label class="field-label" for="editKeyName">Nome da chave</label><input class="field" id="editKeyName" minlength="2" maxlength="80" required></div>
<div class="form-grid" style="margin-top:16px">
<div class="field-group"><label class="field-label" for="editKeyTotalTokens">Limite total de tokens</label><input class="field" id="editKeyTotalTokens" type="number" min="1" max="100000000000000" step="1" placeholder="Sem limite"><span class="form-hint" id="editKeyUsage">Consumo acumulado: —</span></div>
<div class="field-group"><label class="field-label" for="editKeyBudgetBrl">Orçamento total em reais (R$)</label><input class="field" id="editKeyBudgetBrl" type="number" min="0.01" max="10000000" step=".01" placeholder="Sem teto"><span class="form-hint" id="editKeyBudgetSpent">Custo contabilizado: —</span></div>
</div>
<div class="field-group" style="margin-top:16px"><label class="field-label" for="editKeyOwner">Responsável pela chave</label><select id="editKeyOwner" class="field"><option value="">Administração Consecom</option></select></div><div class="field-group" style="margin-top:16px"><label class="field-label" for="editKeyStatus">Situação</label><select class="field" id="editKeyStatus"><option value="active">Ativa</option><option value="blocked">Bloqueada</option></select></div>
<p class="section-hint" style="margin:13px 0 0">Deixe em branco para não definir um teto. O monitor de tokens verifica o consumo periodicamente; orçamentos utilizam a cotação definida nas configurações.</p>
<div class="actions"><button class="btn" type="button" id="editKeyCancel">Cancelar</button><button class="btn btn-primary" id="editKeySave" type="submit">Salvar alterações</button></div></form></dialog>
<dialog id="secretModal"><h2>API Key criada</h2><p>Configure no Claude Code a Base URL abaixo e a sua nova API key. A chave só será exibida integralmente agora.</p>
<div class="field-group" style="margin-top:19px"><label class="field-label">Base URL do Consecom Proxy</label><div id="secretBaseUrl" class="secret"></div><button type="button" class="btn" id="copyBaseUrl">Copiar Base URL</button></div>
<div class="field-group" style="margin-top:17px"><label class="field-label">API key gerada</label><div id="secretValue" class="secret"></div><button type="button" class="btn btn-primary" id="copySecret">Copiar API key</button></div>
<p class="danger-note">Não compartilhe a chave publicamente. O endereço é o do gateway, e não o endereço deste painel.</p><div class="actions"><button class="btn" id="secretClose">Concluir</button></div></dialog>
<dialog id="providerModal"><h2 id="providerModalTitle">Adicionar provedor</h2><p>Informe os dados da API que disponibiliza o modelo. As credenciais serão armazenadas no LiteLLM e não poderão ser consultadas novamente por este painel.</p>
<form id="providerForm"><div class="field-group"><label class="field-label" for="providerName">Nome do provedor</label><input class="field" id="providerName" maxlength="90" placeholder="Ex.: OpenCode Go - equipe" required></div>
<div class="field-group" style="margin-top:13px"><label class="field-label" for="providerProtocol">Formato da API</label><select class="field" id="providerProtocol"><option value="openai">Compatível com OpenAI</option><option value="anthropic">Compatível com Anthropic</option></select></div>
<div class="field-group" style="margin-top:13px"><label class="field-label" for="providerUrl">Base URL do provedor</label><input class="field" id="providerUrl" type="url" placeholder="https://api.seuprovedor.com/v1" required></div>
<div class="field-group" style="margin-top:13px"><label class="field-label" for="providerApiKey">API key do provedor</label><input class="field" id="providerApiKey" type="password" autocomplete="off" placeholder="Cole sua credencial aqui"><span class="form-hint" id="providerKeyHint">Será mantida em segredo.</span></div>
<div class="form-grid" style="margin-top:13px"><div class="field-group"><label class="field-label" for="providerModel">ID do modelo no provedor</label><input class="field" id="providerModel" placeholder="modelo-da-api" required></div>
<div class="field-group"><label class="field-label" for="providerAlias">Nome público do modelo no proxy</label><input class="field" id="providerAlias" placeholder="consecom-modelo" required><span class="form-hint">Usado pelas API keys geradas neste painel.</span></div></div>
<div class="form-grid" style="margin-top:13px"><div class="field-group"><label class="field-label" for="providerInputPrice">Entrada US$/1M tokens (opcional)</label><input class="field" id="providerInputPrice" type="number" min="0" step=".000001" placeholder="Ex.: 0.15"></div>
<div class="field-group"><label class="field-label" for="providerOutputPrice">Saída US$/1M tokens (opcional)</label><input class="field" id="providerOutputPrice" type="number" min="0" step=".000001" placeholder="Ex.: 0.60"></div></div>
<div class="actions"><button type="button" class="btn" id="providerCancel">Cancelar</button><button class="btn btn-primary" type="submit" id="providerSubmit">Salvar provedor</button></div></form></dialog>
<div id="toast" class="toast hidden"></div>
<script>
var state={days:7,view:'overview',overview:null,keys:[],models:[],providers:[],proxyBaseUrl:"",editingProvider:null,editingKey:null,viewer:null,employees:[],busy:false};var $=id=>document.getElementById(id);
function esc(t){return String(t==null?'':t).replace(/deepseek/gi,'Consecom AI').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function number(v){return Number(v||0).toLocaleString('pt-BR')}
function compact(v){return Intl.NumberFormat('pt-BR',{notation:'compact',maximumFractionDigits:2}).format(Number(v||0))}
function usd(v){return 'US$ '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:4})}
function datefmt(v){if(!v)return '—';var d=new Date(v);return isNaN(d)?'—':d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
function toast(msg){$('toast').textContent=msg;$('toast').classList.remove('hidden');setTimeout(()=>$('toast').classList.add('hidden'),4500)}
async function api(path,opts){var r=await fetch(path,{headers:{'Content-Type':'application/json'},cache:'no-store',...opts});var json=await r.json().catch(()=>({}));if(!r.ok)throw Error(json.error||'HTTP '+r.status);return json}
function pct(part,total){return total>0?Math.round(part/total*1000)/10:0}
function renderOverview(){var a=state.overview;if(!a)return;var t=a.total,w=a.window,m=a.month,s=a.settings;
$('reqCount').textContent=number(t.requests);$('reqCaption').textContent=number(t.failed)+' falhas registradas';$('tokenCount').textContent=compact(t.tokens);$('tokensCaption').textContent=compact(t.input)+' entrada (inclui '+compact(t.cacheRead)+' de cache lido e '+compact(t.cacheWrite)+' gravado) / '+compact(t.output)+' saída; '+compact(t.reasoning)+' raciocínio já incluído na saída';$('costCount').textContent=usd(t.cost);$('successCount').textContent=t.requests?pct(t.success,t.requests).toLocaleString('pt-BR')+'%':'—';$('failedCaption').textContent=number(t.success)+' requisições bem-sucedidas';
var unpriced=Number(t.unpriced||0)+Number(w.unpriced||0)+Number(m.unpriced||0);$('costWarning').textContent=unpriced>0?'Atenção: existem '+number(t.unpriced)+' chamadas neste período com tokens, mas custo US$ 0 no LiteLLM. Os custos e percentuais de limite podem estar subestimados. Esta régua NÃO é o saldo oficial do OpenCode Go.':'Os custos e limites exibidos são calculados pelos registros do proxy. A janela de 5h é móvel. Eles NÃO representam o saldo real de uma assinatura OpenCode Go, que exige integração própria.';
[['window',w,s.windowUsd],['month',m,s.monthlyUsd]].forEach(function(x){var k=x[0],val=x[1],lim=x[2],p=pct(val.cost,lim);$(k+'Cost').textContent=usd(val.cost);$(k+'Limit').textContent='de '+usd(lim);$(k+'Bar').style.width=Math.min(p,100)+'%';$(k+'Pct').textContent=number(val.requests)+' requisições • '+(val.unpriced?'custo incompleto • ':'')+p.toLocaleString('pt-BR')+'% da referência configurada';});
$('windowInput').value=s.windowUsd;$('monthInput').value=s.monthlyUsd;$('usdBrlRate').value=s.usdBrlRate;
var max=Math.max(1,...a.daily.map(x=>Number(x.requests||0)));$('activityChart').innerHTML=a.daily.length?a.daily.map(function(v){return '<div class="bar-wrap" title="'+esc(v.day+' • '+number(v.requests)+' chamadas')+'"><div class="bar" style="height:'+Math.max(3,Math.round(Number(v.requests)/max*165))+'px"></div><div class="bar-label">'+esc(v.day.slice(5))+'</div></div>'}).join(''):'<div class="empty">Nenhuma requisição no período.</div>';
$('modelTable').innerHTML=a.models.length?a.models.map(function(v){return '<tr><td><b>'+esc(v.name)+'</b></td><td>'+number(v.requests)+'</td><td title="Cache lido: '+number(v.cacheRead)+' | Cache criado: '+number(v.cacheWrite)+'">'+compact(v.tokens)+'</td><td>'+usd(v.cost)+'</td></tr>'}).join(''):'<tr><td colspan="4" class="empty">Nenhum modelo utilizado.</td></tr>';
var km={};state.keys.forEach(function(k){km[k.id]=k.name});$('keySummary').innerHTML=a.byKey.length?a.byKey.slice(0,8).map(function(v){return '<tr><td><b>'+esc(km[v.id]||'Chave não identificada')+'</b></td><td>'+number(v.requests)+'</td><td>'+compact(v.tokens)+'</td></tr>'}).join(''):'<tr><td colspan="3" class="empty">Sem consumo registrado.</td></tr>';
}
function brl(v){return Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:2})}
function renderKeys(){
 var m={};(state.overview?.byKey||[]).forEach(function(v){m[v.id]=v});
 $('keysTable').innerHTML=state.keys.length?state.keys.map(function(k){
  var x=m[k.id]||{},badge=k.blocked?'<span class="pill '+(k.quotaAutoBlocked?'orange':'red')+'">'+(k.quotaAutoBlocked?'Tokens esgotados':'Bloqueada')+'</span>':'<span class="pill green">Ativa</span>';
  var tokLimit=k.totalTokenLimit==null?'Sem limite':compact(k.totalTokenLimit);
  var tokProgress='<div class="caption">'+compact(k.lifetimeTokens)+' usados'+(k.totalTokenLimit!=null?' · '+Math.min(100,pct(k.lifetimeTokens,k.totalTokenLimit)).toLocaleString('pt-BR')+'%':'')+'</div><div class="caption" title="Cache e raciocínio já estão incluídos no total">'+compact(k.lifetimeCacheRead)+' cache lido · '+compact(k.lifetimeCacheWrite)+' cache criado · '+compact(k.lifetimeOutput)+' saída</div>';
  var budget=k.budgetBrl==null?'Sem teto':brl(k.budgetBrl);
  var budgetProgress=k.budgetBrl==null?'':('<div class="caption">'+brl(k.spentBrl)+' contabilizados</div>');
  return '<tr><td><div class="name-row"><span class="key-icon">⚿</span><div><b>'+esc(k.name)+'</b><div class="caption">'+esc(k.keyHint)+' • '+datefmt(k.createdAt)+'</div><div class="caption">'+esc(k.ownerName||'Administração Consecom')+'</div></div></div></td>'+
   '<td>'+number(x.requests)+'</td><td>'+compact(k.lifetimeTokens)+'</td><td>'+brl(k.spentBrl)+'</td>'+
   '<td>'+budget+budgetProgress+'</td><td>'+tokLimit+tokProgress+'</td><td>'+badge+'</td>'+
   (state.viewer?.isAdmin?'<td><div style="display:flex;gap:7px;flex-wrap:wrap"><button class="btn btn-sm" data-edit-key="'+esc(k.id)+'">Editar</button><button class="btn btn-sm btn-danger" data-revoke="'+esc(k.id)+'">Revogar</button></div></td></tr>':'<td><span class="caption">Somente leitura</span></td></tr>');
 }).join(''):'<tr><td colspan="8" class="empty">Nenhuma chave cadastrada.</td></tr>';
 document.querySelectorAll('[data-edit-key]').forEach(b=>b.onclick=()=>openKeyEditor(b.dataset.editKey));
 document.querySelectorAll('[data-revoke]').forEach(b=>b.onclick=()=>revoke(b.dataset.revoke));
}
function renderRequests(){var rows=state.overview?.recent||[],q=$('requestFilter').value.toLowerCase().trim();rows=rows.filter(v=>!q||[v.key,v.model,v.provider,v.status].join(' ').toLowerCase().includes(q));$('requestsTable').innerHTML=rows.length?rows.map(function(v){return '<tr><td>'+datefmt(v.time)+'</td><td><b>'+esc(v.key)+'</b></td><td>'+esc(v.model)+'</td><td>'+esc(v.provider)+'</td><td>'+number(v.input)+'</td><td>'+number(v.cacheRead)+'</td><td>'+number(v.cacheWrite)+'</td><td>'+number(v.output)+'</td><td>'+number(v.reasoning)+'</td><td><b>'+number(v.tokens)+'</b></td><td>'+usd(v.cost)+'</td><td><span class="pill '+(v.status==='success'?'green':'red')+'">'+esc(v.status||'—')+'</span></td></tr>'}).join(''):'<tr><td colspan="12" class="empty">Nenhuma requisição encontrada.</td></tr>'}
async function refresh(){
 if(state.busy)return;state.busy=true;
 try{
  if(!state.viewer){
   const me=await api('/api/me');state.viewer=me.user;
   const admin=!!state.viewer.isAdmin;
   document.querySelectorAll('.admin-only').forEach(el=>el.classList.toggle('hidden',!admin));
   $('currentUserRole').textContent=(admin?'Administrador: ':'Funcionário: ')+state.viewer.name;
   $('myAccountName').textContent=state.viewer.name;$('myAccountEmail').textContent=state.viewer.email;
  }
  const admin=!!state.viewer.isAdmin;
  const data=await Promise.all([
   api('/api/overview?days='+state.days),api('/api/keys'),
   admin?api('/api/providers'):Promise.resolve({providers:[]}),
   admin?api('/api/employees'):Promise.resolve({employees:[]})
  ]);
  state.overview=data[0];state.proxyBaseUrl=data[0].baseUrl||'';
  state.keys=data[1].keys||[];
  state.providers=data[2].providers||[];state.employees=data[3].employees||[];
  renderOverview();renderKeys();renderRequests();renderProviders();renderEmployees();
  $('baseUrl').textContent=state.proxyBaseUrl;
  $('myApiUrl').textContent=state.proxyBaseUrl;
  $('myAnthropicUrl').textContent=state.proxyBaseUrl+'/anthropic';
  $('lastSync').textContent='Sincronizado às '+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
 }catch(e){
  if(String(e.message).includes('Sessão expirada')){window.location.assign('/login');return}
  toast('Falha de sincronização: '+e.message)
 }finally{state.busy=false}
}
function employeeOptions(selected){
 return '<option value="">Administração Consecom</option>'+state.employees.filter(x=>x.active||x.id===selected).map(x=>'<option value="'+esc(x.id)+'"'+(x.id===selected?' selected':'')+'>'+esc(x.name+' — '+x.email)+'</option>').join('');
}
function renderEmployees(){
 $('employeesTable').innerHTML=state.employees.length?state.employees.map(u=>'<tr>'+
  '<td><b>'+esc(u.name)+'</b></td><td>'+esc(u.email)+'</td><td>'+number(u.keyCount)+'</td>'+
  '<td><span class="pill '+(u.active?'green':'red')+'">'+(u.active?'Ativa':'Inativa')+'</span></td>'+
  '<td><button class="btn btn-sm" data-reset="'+esc(u.id)+'">Redefinir senha</button> '+
  '<button class="btn btn-sm '+(u.active?'btn-danger':'')+'" data-toggle="'+esc(u.id)+'">'+(u.active?'Desativar':'Reativar')+'</button></td></tr>').join(''):
  '<tr><td colspan="5" class="empty">Nenhum funcionário cadastrado.</td></tr>';
 document.querySelectorAll('[data-reset]').forEach(el=>el.onclick=()=>resetEmployee(el.dataset.reset));
 document.querySelectorAll('[data-toggle]').forEach(el=>el.onclick=()=>toggleEmployee(el.dataset.toggle));
}
function showEmployeeCredentials(email,password){
 $('employeeCreatedEmail').textContent=email;$('employeeCreatedPassword').textContent=password;$('employeeCredentialsModal').showModal();
}
async function resetEmployee(id){
 const employee=state.employees.find(x=>x.id===id);
 if(!employee||!confirm('Redefinir senha de '+employee.name+'?'))return;
 try{const r=await api('/api/employees/reset-password',{method:'POST',body:JSON.stringify({id})});showEmployeeCredentials(employee.email,r.initialPassword)}catch(e){toast(e.message)}
}
async function toggleEmployee(id){
 const u=state.employees.find(x=>x.id===id);
 if(!u||!confirm((u.active?'Desativar':'Reativar')+' '+u.name+'?'))return;
 try{await api('/api/employees/status',{method:'POST',body:JSON.stringify({id,active:!u.active})});toast('Situação atualizada');refresh()}catch(e){toast(e.message)}
}
$('employeeOpen').onclick=()=>{$('employeeForm').reset();$('employeeModal').showModal()};
$('employeeCancel').onclick=()=>$('employeeModal').close();
$('employeeForm').onsubmit=async ev=>{
 ev.preventDefault();$('employeeSubmit').disabled=true;
 try{const r=await api('/api/employees/create',{method:'POST',body:JSON.stringify({name:$('employeeName').value.trim(),email:$('employeeEmail').value.trim()})});
 $('employeeModal').close();showEmployeeCredentials(r.employee.email,r.initialPassword);refresh()}
 catch(e){toast('Erro ao criar usuário: '+e.message)}finally{$('employeeSubmit').disabled=false}
};
$('employeeCredentialsClose').onclick=()=>{$('employeeCredentialsModal').close();$('employeeCreatedPassword').textContent='';$('employeeCreatedEmail').textContent=''};
$('copyEmployeeEmail').onclick=()=>navigator.clipboard.writeText($('employeeCreatedEmail').textContent).then(()=>toast('E-mail copiado')).catch(()=>toast('Falha ao copiar'));
$('copyEmployeePassword').onclick=()=>navigator.clipboard.writeText($('employeeCreatedPassword').textContent).then(()=>toast('Senha copiada')).catch(()=>toast('Falha ao copiar'));
$('copyMyApi').onclick=()=>navigator.clipboard.writeText($('myApiUrl').textContent).then(()=>toast('Base URL copiada')).catch(()=>toast('Falha ao copiar'));
$('copyMyAnthropic').onclick=()=>navigator.clipboard.writeText($('myAnthropicUrl').textContent).then(()=>toast('URL Anthropic copiada')).catch(()=>toast('Falha ao copiar'));
$('accountPasswordForm').onsubmit=async ev=>{
 ev.preventDefault();
 if($('passwordNew').value!==$('passwordConfirm').value){toast('As senhas não coincidem');return}
 try{await api('/api/account/password',{method:'POST',body:JSON.stringify({currentPassword:$('passwordOld').value,newPassword:$('passwordNew').value})});
 window.location.assign('/login')}
 catch(e){toast('Erro ao alterar senha: '+e.message)}
};
function renderProviders(){
 var usage=state.overview?.models||[];
 $('providersTable').innerHTML=state.providers.length?state.providers.map(function(pr){
  var row=usage.find(x=>x.name===pr.alias)||{};
  return '<tr><td><div class="name-row"><span class="key-icon">⬡</span><div><b>'+esc(pr.name)+'</b><div class="caption">'+esc(pr.protocol==='anthropic'?'Formato Anthropic':'Formato OpenAI')+'</div></div></div></td>'+
  '<td><b>'+esc(pr.alias)+'</b><div class="caption">'+esc(pr.model)+'</div></td>'+
  '<td><span title="'+esc(pr.baseUrl)+'">'+esc(pr.baseUrl.length>49?pr.baseUrl.slice(0,46)+'...':pr.baseUrl)+'</span></td>'+
  '<td><span class="pill '+(pr.credentialConfigured?'green':'orange')+'">'+(pr.credentialConfigured?'Configurada':'Não informada')+'</span></td>'+
  '<td>'+number(row.requests||0)+'</td><td>'+compact(row.tokens||0)+'</td>'+
  '<td><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn btn-sm" data-edit-provider="'+esc(pr.id)+'">Editar</button><button class="btn btn-sm btn-danger" data-remove-provider="'+esc(pr.id)+'">Remover</button></div></td></tr>';
 }).join(''):'<tr><td colspan="7" class="empty">Nenhum provedor configurado.</td></tr>';
 document.querySelectorAll('[data-edit-provider]').forEach(b=>b.onclick=()=>openProvider(b.dataset.editProvider));
 document.querySelectorAll('[data-remove-provider]').forEach(b=>b.onclick=()=>deleteProvider(b.dataset.removeProvider));
}
function openProvider(id){
 var pr=state.providers.find(x=>x.id===id)||null;state.editingProvider=pr?.id||null;
 $('providerForm').reset();
 $('providerModalTitle').textContent=pr?'Editar provedor':'Adicionar provedor';
 $('providerName').value=pr?.name||'';
 $('providerProtocol').value=pr?.protocol||'openai';
 $('providerUrl').value=pr?.baseUrl||'';
 $('providerModel').value=pr?.model||'';
 $('providerAlias').value=pr?.alias||'';
 $('providerAlias').readOnly=!!pr;
 $('providerApiKey').required=!pr;
 $('providerApiKey').value='';
 $('providerKeyHint').textContent=pr?'Deixe em branco para manter a API key atual.':'Digite a API key do seu provedor.';
 $('providerInputPrice').value=pr?.inputPrice??'';
 $('providerOutputPrice').value=pr?.outputPrice??'';
 $('providerSubmit').textContent=pr?'Salvar alterações':'Salvar provedor';
 $('providerModal').showModal();
}
async function deleteProvider(id){
 var pr=state.providers.find(x=>x.id===id);
 if(!pr||!confirm('Remover o provedor "'+pr.name+'" e o modelo "'+pr.alias+'"? As chaves que dependem deste modelo poderão parar de funcionar.'))return;
 try{await api('/api/providers/delete',{method:'POST',body:JSON.stringify({id})});toast('Provedor removido');refresh();}catch(e){toast('Falha ao remover: '+e.message)}
}
$('providerOpen').onclick=()=>openProvider(null);
$('providerCancel').onclick=()=>$('providerModal').close();
$('providerForm').onsubmit=async function(ev){
 ev.preventDefault();
 var data={id:state.editingProvider,name:$('providerName').value.trim(),protocol:$('providerProtocol').value,baseUrl:$('providerUrl').value.trim(),apiKey:$('providerApiKey').value,model:$('providerModel').value.trim(),alias:$('providerAlias').value.trim(),inputPrice:$('providerInputPrice').value===''?null:Number($('providerInputPrice').value),outputPrice:$('providerOutputPrice').value===''?null:Number($('providerOutputPrice').value)};
 $('providerSubmit').disabled=true;
 try{
  await api(state.editingProvider?'/api/providers/update':'/api/providers/create',{method:'POST',body:JSON.stringify(data)});
  $('providerModal').close();$('providerApiKey').value='';toast('Provedor salvo com sucesso');refresh();
 }catch(e){toast('Não foi possível salvar: '+e.message)}
 finally{$('providerSubmit').disabled=false}
};

function switchView(v){state.view=v;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));['overview','keys','providers','requests','settings','employees','account'].forEach(n=>$('view-'+n).classList.toggle('hidden',n!==v));$('heading').textContent={overview:'Visão geral',keys:'Gerenciar API Keys',providers:'Provedores de inferência',requests:'Histórico de requisições',settings:'Configurações',employees:'Funcionários',account:'Minha conta'}[v];$('subtitle').textContent={overview:'Acompanhe a utilização da sua infraestrutura de IA em tempo real.',keys:'Crie, nomeie, limite e revogue chaves com segurança.',providers:'Configure credenciais, modelos e URLs externas de inferência.',requests:'Explore modelos, tokens, custo e histórico das chamadas.',settings:'Personalize os limites visuais e acesse sua API.',employees:'Gerencie os acessos individuais.',account:'Perfil e segurança da sua conta.'}[v];$('period').classList.toggle('hidden',v==='settings')}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>switchView(b.dataset.view));document.querySelectorAll('[data-days]').forEach(b=>b.onclick=function(){state.days=Number(b.dataset.days);document.querySelectorAll('[data-days]').forEach(x=>x.classList.toggle('on',x===b));refresh()});$('logoutBtn').onclick=async function(){try{await fetch('/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',credentials:'same-origin'});}finally{window.location.assign('/login')}};$('requestFilter').oninput=renderRequests;

function openKeyEditor(id){
 var k=state.keys.find(x=>x.id===id);if(!k){toast('Chave não encontrada');return}
 state.editingKey=id;$('editKeyForm').reset();
 $('editKeyName').value=k.name||'';
 $('editKeyTotalTokens').value=k.totalTokenLimit??'';
 $('editKeyBudgetBrl').value=k.budgetBrl??'';
 $('editKeyUsage').textContent='Consumo acumulado: '+number(k.lifetimeTokens)+' tokens';
 $('editKeyBudgetSpent').textContent='Custo contabilizado: '+brl(k.spentBrl);
 $('editKeyStatus').value=k.blocked&&!k.quotaAutoBlocked?'blocked':'active';$('editKeyOwner').innerHTML=employeeOptions(k.ownerUserId);$('editKeyOwner').value=k.ownerUserId||'';
 $('editKeyModal').showModal();
}
$('editKeyCancel').onclick=()=>$('editKeyModal').close();
$('editKeyForm').onsubmit=async function(ev){
 ev.preventDefault();
 var data={id:state.editingKey,name:$('editKeyName').value.trim(),
   totalTokens:$('editKeyTotalTokens').value===''?null:Number($('editKeyTotalTokens').value),
   budgetBrl:$('editKeyBudgetBrl').value===''?null:Number($('editKeyBudgetBrl').value),
   blocked:$('editKeyStatus').value==='blocked',ownerUserId:$('editKeyOwner').value||null};
 $('editKeySave').disabled=true;
 try{await api('/api/keys/update',{method:'POST',body:JSON.stringify(data)});$('editKeyModal').close();state.editingKey=null;toast('Limites totais salvos');await refresh();}
 catch(e){toast('Falha ao editar: '+e.message)}finally{$('editKeySave').disabled=false}
};
$('commercialPackage').onchange=function(){var isPack=!!this.value;$('keyTotalTokens').disabled=isPack;$('keyBudgetBrl').disabled=isPack;if(isPack){$('keyTotalTokens').value='';$('keyBudgetBrl').value=''}else{$('keyTotalTokens').value='';$('keyBudgetBrl').value=''}};
$('createOpen').onclick=function(){$('keyForm').reset();$('keyTotalTokens').disabled=false;$('keyBudgetBrl').disabled=false;$('keyOwner').innerHTML=employeeOptions(null);$('createModal').showModal()};
$('keyCancel').onclick=()=>$('createModal').close();
$('keyForm').onsubmit=async function(ev){
 ev.preventDefault();
 var name=$('keyName').value.trim(),duration=$('keyDuration').value;
 var totalTokens=$('keyTotalTokens').value===''?null:Number($('keyTotalTokens').value);
 var budgetBrl=$('keyBudgetBrl').value===''?null:Number($('keyBudgetBrl').value),packageId=$('commercialPackage').value;
 $('createSubmit').disabled=true;
 try{
  var r=await api('/api/keys/create',{method:'POST',body:JSON.stringify({name,totalTokens,budgetBrl,packageId,duration,ownerUserId:$('keyOwner').value||null})});
  $('createModal').close();$('secretValue').textContent=r.key;$('secretBaseUrl').textContent=r.baseUrl||state.proxyBaseUrl;
  $('secretModal').showModal();refresh();
 }catch(e){toast('Erro ao criar: '+e.message)}finally{$('createSubmit').disabled=false}
};
$('copyBaseUrl').onclick=async()=>{try{await navigator.clipboard.writeText($('secretBaseUrl').textContent);toast('Base URL copiada')}catch{toast('Selecione e copie manualmente')}};$('copySecret').onclick=async()=>{try{await navigator.clipboard.writeText($('secretValue').textContent);toast('Chave copiada')}catch{toast('Selecione e copie manualmente')}};$('secretClose').onclick=function(){$('secretModal').close();$('secretValue').textContent='';$('secretBaseUrl').textContent=''};
async function revoke(id){var k=state.keys.find(x=>x.id===id);if(!k||!confirm('Revogar permanentemente a chave "'+k.name+'"? Ela deixará de funcionar imediatamente.'))return;try{await api('/api/keys/revoke',{method:'POST',body:JSON.stringify({id})});toast('Chave revogada');refresh()}catch(e){toast('Erro ao revogar: '+e.message)}}
$('settingsForm').onsubmit=async function(ev){ev.preventDefault();try{await api('/api/settings',{method:'POST',body:JSON.stringify({windowUsd:Number($('windowInput').value),monthlyUsd:Number($('monthInput').value),usdBrlRate:Number($('usdBrlRate').value)})});toast('Referências atualizadas');refresh()}catch(e){toast('Erro: '+e.message)}};
refresh();setInterval(refresh,5000);window.addEventListener('focus',refresh);
</script></body></html>`;

  const decodedHtml = html.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)));

  const loginHtml = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f7f8fa"><title>Entrar | Consecom AI Proxy</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f8fa;color:#1b2430;min-height:100vh;display:grid;place-items:center;padding:28px 16px}
.shell{width:min(420px,100%)}.brand{display:flex;align-items:center;justify-content:center;gap:11px;margin-bottom:35px}.mark{height:44px;width:44px;border-radius:13px;display:grid;place-items:center;background:#f46b23;color:#fff;font-weight:800;font-size:22px;box-shadow:0 6px 20px #f46b2330}.brand b{font-size:17px;letter-spacing:.5px}.brand small{font-size:11px;color:#89929e;display:block;margin-top:3px;letter-spacing:1px}
.card{background:white;border:1px solid #e8eaef;border-radius:17px;padding:35px 34px;box-shadow:0 12px 46px #26384c0d}h1{font-size:25px;letter-spacing:-.8px;margin:0 0 8px;font-weight:750}p{margin:0 0 28px;color:#87919e;font-size:13px;line-height:1.6}
label{display:block;font-size:12px;font-weight:700;color:#4d5968;margin:0 0 8px}.field{width:100%;outline:none;border:1px solid #dfe3e9;padding:12px 13px;border-radius:9px;font-size:14px;color:#1b2430;background:#fff;transition:.15s}.field:focus{border-color:#f49d68;box-shadow:0 0 0 3px #f46b2317}.group{margin-bottom:18px}
button{width:100%;padding:13px;border:0;background:#f46b23;color:white;font-size:14px;font-weight:700;border-radius:9px;cursor:pointer;margin-top:8px;box-shadow:0 4px 12px #f46b231c}button:disabled{opacity:.65;cursor:wait}button:hover{background:#e55c17}
.error{display:none;margin:0 0 16px;padding:12px 13px;color:#b53e38;background:#fff0ee;border:1px solid #f1d4d1;border-radius:8px;font-size:12px}.foot{text-align:center;color:#a0a7b0;font-size:11px;margin-top:25px}
@media(max-width:470px){.card{padding:27px 23px}.brand{margin-bottom:24px}}
</style></head><body><div class="shell"><div class="brand"><div class="mark">C</div><div><b>CONSECOM AI</b><small>PROXY MANAGER</small></div></div>
<section class="card"><h1>Acessar painel</h1><p>Faça login para gerenciar suas API keys, acompanhar tokens, requisições e custos.</p><div class="error" role="alert" id="error"></div>
<form id="login"><div class="group"><label for="email">E-mail</label><input class="field" name="email" type="email" id="email" autocomplete="username" placeholder="seu@email.com" required autofocus></div>
<div class="group"><label for="password">Senha</label><input class="field" name="password" type="password" id="password" autocomplete="current-password" required></div>
<button id="submit" type="submit">Entrar no painel</button></form></section>
<div class="foot">Consecom Brasil · Acesso administrativo protegido</div></div>
<script>
document.getElementById("login").addEventListener("submit",async function(e){
e.preventDefault();const b=document.getElementById("submit"),er=document.getElementById("error");
er.style.display="none";b.disabled=true;b.textContent="Autenticando...";
try{const r=await fetch("/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"same-origin",body:JSON.stringify({email:document.getElementById("email").value,password:document.getElementById("password").value})});if(!r.ok){const detail=await r.json().catch(()=>({}));throw Error(r.status===401?"E-mail ou senha inválidos.":(detail.error||"Falha ao autenticar. Tente novamente."));}window.location.replace("/");}
catch(x){er.textContent=x.message||"Não foi possível entrar.";er.style.display="block";b.disabled=false;b.textContent="Entrar no painel";}
});
</script></body></html>`;

  Bun.serve({
    hostname: "0.0.0.0", port,
    async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname === "/healthz") return response({ ok: true, service: "consecom-proxy-panel" });
      if (u.pathname === "/login" && req.method === "GET") {
        if(await getSession(req))return Response.redirect(new URL("/",req.url),303);
        return new Response(loginHtml,{headers:{...headers,"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'"}});
      }

      if (u.pathname === "/auth/login" && req.method === "POST") {
        if(req.headers.get("origin") && req.headers.get("origin")!==publicOrigin)return response({error:"Origem inválida"},403);
        if(!req.headers.get("content-type")?.includes("application/json"))return response({error:"Formato inválido"},415);
        const ip=(req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim().slice(0,90);
        const now=Date.now(),old=failedLogins.get(ip);
        if(old&&old.count>=7&&old.until>now)return response({error:"Muitas tentativas. Tente mais tarde."},429);
        if(failedLogins.size>2000)failedLogins.clear();
        let input={};
        try{const body=await req.text();if(body.length>2048)return response({error:"Solicitação inválida"},400);input=JSON.parse(body)}catch{return response({error:"Solicitação inválida"},400)}
        const email=String(input.email||"").trim().toLowerCase();
        const password=typeof input.password==="string"?input.password:"";
        const rows=await sql`SELECT id,email,display_name AS name,password_hash AS "passwordHash",role,is_active AS active,session_version AS "sessionVersion" FROM consecom_users WHERE email=${email} AND NOT EXISTS(SELECT 1 FROM consecom_tenants t WHERE t.id=consecom_users.tenant_id AND t.slug LIKE 'client-%') LIMIT 1`;
        const user=rows[0];
        const valid=user&&user.active&&verifyPassword(password,user.passwordHash);
        if(!valid){
          const tries=old&&old.until>now?old.count+1:1;
          failedLogins.set(ip,{count:tries,until:now+15*60*1000});
          return response({error:"E-mail ou senha inválidos"},401);
        }
        failedLogins.delete(ip);
        return new Response(JSON.stringify({ok:true,role:user.role}),{status:200,headers:{...headers,"Content-Type":"application/json; charset=utf-8","Set-Cookie":sessionCookie(signedSession(user))}});
      }
      if (u.pathname === "/auth/logout" && req.method === "POST") {
        if(req.headers.get("origin") && req.headers.get("origin")!==publicOrigin)return response({error:"Origem inválida"},403);
        return new Response(JSON.stringify({ok:true}),{headers:{...headers,"Content-Type":"application/json; charset=utf-8","Set-Cookie":sessionCookie("",0)}});
      }
      const viewer=await getSession(req);
      if (!viewer) {
        if(u.pathname.startsWith("/api/"))return response({error:"Sessão expirada. Faça login novamente."},401);
        return Response.redirect(new URL("/login",publicOrigin),302);
      }
      if (["POST","PUT","PATCH","DELETE"].includes(req.method)) {
        const origin = req.headers.get("origin");
        if (origin && origin !== publicOrigin) return response({ error: "Origem não permitida" }, 403);
        if (!req.headers.get("content-type")?.includes("application/json")) return response({ error: "Apenas JSON" }, 415);
      }
      if (u.pathname === "/" && req.method === "GET") return new Response(decodedHtml, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'" } });
      if(!viewer.isAdmin && (
        u.pathname.startsWith("/api/providers") ||
        u.pathname==="/api/settings" ||
        u.pathname.startsWith("/api/employees") ||
        (u.pathname.startsWith("/api/keys/") && u.pathname!=="/api/keys")
      ))return response({error:"Acesso restrito ao administrador"},403);
      try {

        if (u.pathname==="/api/me" && req.method==="GET"){
          return response({user:{id:viewer.id,name:viewer.name,email:viewer.email,role:viewer.role,isAdmin:viewer.isAdmin}});
        }
        if (u.pathname==="/api/employees" && req.method==="GET"){
          const users=await sql`SELECT u.id,u.display_name AS name,u.email,u.is_active AS active,u.created_at AS "createdAt",
            COUNT(k.key_token)::int AS "keyCount" FROM consecom_users u LEFT JOIN consecom_key_owners k ON k.owner_user_id=u.id
            WHERE u.role='employee' AND NOT EXISTS(SELECT 1 FROM consecom_tenants t WHERE t.id=u.tenant_id AND t.slug LIKE 'client-%')
            GROUP BY u.id ORDER BY u.created_at DESC LIMIT 250`;
          return response({employees:users});
        }
        if (u.pathname==="/api/employees/create" && req.method==="POST"){
          const raw=await req.text();if(raw.length>3000)return response({error:"Solicitação muito grande"},413);
          const b=JSON.parse(raw);
          const email=String(b.email||"").trim().toLowerCase();
          const name=String(b.name||"").trim();
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>240||name.length<2||name.length>90||/[\x00-\x1f]/.test(name))return response({error:"Nome ou e-mail inválidos"},400);
          const dup=await sql`SELECT 1 FROM consecom_users WHERE email=${email} LIMIT 1`;
          if(dup.length)return response({error:"Este e-mail já está cadastrado"},409);
          const tenantId=randomUUID(),userId=randomUUID(),password=randomPassword();
          await sql`INSERT INTO consecom_tenants(id,slug,name) VALUES (${tenantId},${"employee-"+userId},${name})`;
          await sql`INSERT INTO consecom_users(id,tenant_id,email,display_name,password_hash,role) VALUES(${userId},${tenantId},${email},${name},${hashPassword(password)},'employee')`;
          return response({ok:true,employee:{id:userId,email,name,role:"employee"},initialPassword:password});
        }
        if (u.pathname==="/api/employees/status" && req.method==="POST"){
          const raw=await req.text();if(raw.length>2000)return response({error:"Solicitação muito grande"},413);
          const b=JSON.parse(raw),id=String(b.id||""),active=b.active;
          if(typeof active!=="boolean")return response({error:"Situação inválida"},400);
          const rows=await sql`SELECT u.id FROM consecom_users u WHERE u.id=${id} AND u.role='employee' AND NOT EXISTS(SELECT 1 FROM consecom_tenants t WHERE t.id=u.tenant_id AND t.slug LIKE 'client-%') LIMIT 1`;
          if(!rows.length)return response({error:"Funcionário não encontrado"},404);
          if(!active){
            const keys=await sql`SELECT key_token FROM consecom_key_owners WHERE owner_user_id=${id}`;
            for(const key of keys)await upstream("/key/update","POST",{key:key.key_token,blocked:true});
          }
          await sql`UPDATE consecom_users SET is_active=${active},session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=${id} AND role='employee'`;
          return response({ok:true,active});
        }
        if(u.pathname==="/api/employees/reset-password" && req.method==="POST"){
          const raw=await req.text();if(raw.length>2000)return response({error:"Solicitação muito grande"},413);
          const id=String(JSON.parse(raw).id||"");
          const check=await sql`SELECT u.id FROM consecom_users u WHERE u.id=${id} AND u.role='employee' AND NOT EXISTS(SELECT 1 FROM consecom_tenants t WHERE t.id=u.tenant_id AND t.slug LIKE 'client-%') LIMIT 1`;
          if(!check.length)return response({error:"Funcionário não encontrado"},404);
          const password=randomPassword();
          await sql`UPDATE consecom_users SET password_hash=${hashPassword(password)},session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=${id}`;
          return response({ok:true,initialPassword:password});
        }
        if(u.pathname==="/api/account/password" && req.method==="POST"){
          const raw=await req.text();if(raw.length>4000)return response({error:"Solicitação muito grande"},413);
          const b=JSON.parse(raw),oldPassword=String(b.currentPassword||""),newPassword=String(b.newPassword||"");
          if(newPassword.length<10||newPassword.length>150)return response({error:"A nova senha deve ter de 10 a 150 caracteres"},400);
          const rows=await sql`SELECT password_hash AS hash FROM consecom_users WHERE id=${viewer.id} LIMIT 1`;
          if(!rows.length||!verifyPassword(oldPassword,rows[0].hash))return response({error:"Senha atual incorreta"},401);
          await sql`UPDATE consecom_users SET password_hash=${hashPassword(newPassword)},session_version=session_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=${viewer.id}`;
          return response({ok:true,loginRequired:true});
        }
        if (u.pathname === "/api/overview" && req.method === "GET") {
          const d = Number(u.searchParams.get("days") || 7);
          return response(await overview([1,7,30].includes(d) ? d : 7,viewer));
        }
        if (u.pathname === "/api/keys" && req.method === "GET") return response({ keys: await listKeys(viewer) });
        if (u.pathname === "/api/models" && req.method === "GET") {
          const models = await upstream("/v1/models");
          return response({ models: [...new Set((models.data || []).map(x => String(x.id || "")).filter(Boolean))] });
        }

        if (u.pathname === "/api/providers" && req.method === "GET") {
          const result = await upstream("/model/info");
          const entries = Array.isArray(result.data) ? result.data : [];
          const providers = entries.map((item) => {
            const params = item.litellm_params || {};
            const meta = item.model_info || {};
            const upstreamModel = String(params.model || "");
            const rawUrl = String(params.api_base || "");
            let name = String(meta.consecom_provider_name || "").trim();
            if (!name) { try { name = new URL(rawUrl).hostname; } catch { name = String(item.model_name || "Provedor"); } }
            const kind = String(meta.consecom_provider_type || (upstreamModel.startsWith("anthropic/") ? "anthropic" : "openai"));
            return {
              id: String(meta.id || ""),
              name, alias: String(item.model_name || ""),
              baseUrl: rawUrl,
              model: upstreamModel.replace(/^(openai|anthropic|custom_openai)\//, ""),
              protocol: kind,
              credentialConfigured: Boolean(params.api_key),
              managed: Boolean(meta.consecom_panel_managed),
              inputPrice: meta.consecom_input_price_per_million == null ? null : Number(meta.consecom_input_price_per_million),
              outputPrice: meta.consecom_output_price_per_million == null ? null : Number(meta.consecom_output_price_per_million)
            };
          }).filter(x=>x.id && x.alias);
          return response({providers, generatedAt:new Date().toISOString()});
        }
        if (u.pathname === "/api/providers/create" && req.method === "POST") {
          const raw = await req.text();
          if(raw.length>12000)return response({error:"Solicitação muito grande"},413);
          const body=JSON.parse(raw);
          const name=typeof body.name==="string"?body.name.trim():"";
          const alias=typeof body.alias==="string"?body.alias.trim():"";
          const model=typeof body.model==="string"?body.model.trim():"";
          const apiKey=typeof body.apiKey==="string"?body.apiKey.trim():"";
          const kind=body.protocol==="anthropic"?"anthropic":"openai";
          const priceIn=body.inputPrice==null||body.inputPrice===""?null:Number(body.inputPrice);
          const priceOut=body.outputPrice==null||body.outputPrice===""?null:Number(body.outputPrice);
          if(name.length<2||name.length>90||/[\x00-\x1f]/.test(name))return response({error:"Nome inválido"},400);
          if(!/^[A-Za-z0-9][A-Za-z0-9._-]{1,100}$/.test(alias))return response({error:"O nome público do modelo precisa conter apenas letras, números, ponto, hífen ou sublinhado"},400);
          if(!model||model.length>150||/[\x00-\x20]/.test(model))return response({error:"Identificador do modelo inválido"},400);
          if(apiKey.length<8||apiKey.length>4000||apiKey.startsWith("os.environ/"))return response({error:"Informe uma API key válida do provedor"},400);
          if((priceIn!==null&&(!Number.isFinite(priceIn)||priceIn<0||priceIn>100000))||(priceOut!==null&&(!Number.isFinite(priceOut)||priceOut<0||priceOut>100000)))return response({error:"Tarifa por milhão inválida"},400);
          const baseUrl=publicHttpsBase(body.baseUrl);
          if(!baseUrl)return response({error:"Informe uma Base URL HTTPS pública válida, sem usuário, senha ou parâmetros"},400);
          const available=await upstream("/model/info");
          if((available.data||[]).some(m=>m.model_name===alias))return response({error:"Já existe um modelo com esse nome. Use um alias diferente."},409);
          const litellmParams={model:(kind==="anthropic"?"anthropic/":"openai/")+model,api_base:baseUrl,api_key:apiKey};
          const modelInfo={consecom_provider_name:name,consecom_provider_type:kind,consecom_panel_managed:true};
          if(priceIn!==null){modelInfo.input_cost_per_token=priceIn/1000000;modelInfo.consecom_input_price_per_million=priceIn;}
          if(priceOut!==null){modelInfo.output_cost_per_token=priceOut/1000000;modelInfo.consecom_output_price_per_million=priceOut;}
          const created=await upstream("/model/new","POST",{model_name:alias,litellm_params:litellmParams,model_info:modelInfo});
          return response({ok:true,id:created.model_id||created.id||null,name,alias});
        }
        if (u.pathname === "/api/providers/update" && req.method === "POST") {
          const raw=await req.text();
          if(raw.length>12000)return response({error:"Solicitação muito grande"},413);
          const b=JSON.parse(raw);
          const id=String(b.id||"");
          const models=await upstream("/model/info");
          const found=(models.data||[]).find(x=>String(x.model_info?.id||"")===id);
          if(!found)return response({error:"Provedor não encontrado"},404);
          const name=String(b.name||"").trim();
          const model=String(b.model||"").trim();
          const kind=b.protocol==="anthropic"?"anthropic":"openai";
          if(name.length<2||name.length>90||!model||model.length>150||/[\x00-\x20]/.test(model))return response({error:"Nome ou identificador de modelo inválido"},400);
          const baseUrl=publicHttpsBase(b.baseUrl);
          if(!baseUrl)return response({error:"Base URL HTTPS inválida"},400);
          const update={model:(kind==="anthropic"?"anthropic/":"openai/")+model,api_base:baseUrl};
          if(typeof b.apiKey==="string"&&b.apiKey.trim()){
            if(b.apiKey.trim().length<8||b.apiKey.length>4000||b.apiKey.startsWith("os.environ/"))return response({error:"API key inválida"},400);
            update.api_key=b.apiKey.trim();
          }
          const info={consecom_provider_name:name,consecom_provider_type:kind,consecom_panel_managed:true};
          for(const [field,prop] of [["inputPrice","input_cost_per_token"],["outputPrice","output_cost_per_token"]]){
            if(b[field]!==undefined&&b[field]!==null&&b[field]!==""){
              const v=Number(b[field]);if(!Number.isFinite(v)||v<0||v>100000)return response({error:"Tarifa inválida"},400);
              info[prop]=v/1000000;
              info["consecom_"+(field==="inputPrice"?"input":"output")+"_price_per_million"]=v;
            }
          }
          await upstream("/model/"+encodeURIComponent(id)+"/update","PATCH",{litellm_params:update,model_info:info});
          return response({ok:true});
        }
        if (u.pathname === "/api/providers/delete" && req.method === "POST") {
          const raw=await req.text();if(raw.length>1000)return response({error:"Solicitação grande"},413);
          const id=String(JSON.parse(raw).id||"");
          const known=await upstream("/model/info");
          if(!(known.data||[]).some(x=>String(x.model_info?.id||"")===id))return response({error:"Provedor não encontrado"},404);
          await upstream("/model/delete","POST",{id});
          return response({ok:true});
        }
        if (u.pathname === "/api/keys/create" && req.method === "POST") {
          const raw = await req.text();
          if (raw.length > 6000) return response({ error: "Solicitação muito grande" }, 413);
          const body = JSON.parse(raw);
          const name = typeof body.name === "string" ? body.name.trim() : "";
          if (name.length < 2 || name.length > 80 || /[\x00-\x1f]/.test(name)) return response({ error: "Nome inválido (2 a 80 caracteres)" }, 400);
          const dup = await sql`SELECT 1 FROM "LiteLLM_VerificationToken" WHERE key_alias=${name} LIMIT 1`;
          if (dup.length) return response({ error: "Já existe uma chave com esse nome" }, 409);
          // An empty LiteLLM models list grants access to all current and future models at the key level.
          // Ignore any client-supplied model restriction; the panel always provisions all models.
          const opt = { key_alias:name, models:[], metadata:{source:"consecom-panel"}, budget_duration:null };
          const pack=body.packageId?commercialPackages.find(x=>x.id===body.packageId):null;
          if(body.packageId&&!pack)return response({error:"Pacote inválido"},400);
          const fx=(await settings()).usdBrlRate;
          if(!pack && body.totalTokens!=null && body.totalTokens!==""){
            const cap=Number(body.totalTokens);
            if(!Number.isSafeInteger(cap)||cap<1||cap>100000000000000)return response({error:"Limite total de tokens inválido"},400);
            opt.metadata.consecom_total_token_limit=cap;
            opt.metadata.consecom_quota_auto_blocked=false;
          }
          if(pack){
            opt.max_budget=pack.apiUsd;
            opt.metadata.consecom_package_id=pack.id;
            opt.metadata.consecom_package_name=pack.name;
            opt.metadata.consecom_package_price_brl=pack.priceBrl;
            opt.metadata.consecom_package_tokens_advertised=pack.tokens;
            opt.metadata.consecom_total_token_limit=pack.tokens;
            opt.metadata.consecom_quota_auto_blocked=false;
            opt.metadata.consecom_package_api_usd=pack.apiUsd;
            opt.metadata.consecom_budget_brl=Math.round(pack.apiUsd*fx*100)/100;
            opt.metadata.consecom_budget_fx=fx;
          }else if(body.budgetBrl!=null && body.budgetBrl!==""){
            const brl=Number(body.budgetBrl);
            if(!Number.isFinite(brl)||brl<0.01||brl>10000000)return response({error:"Orçamento total em reais inválido"},400);
            opt.max_budget=Math.round((brl/fx)*1000000)/1000000;
            opt.metadata.consecom_budget_brl=brl;
            opt.metadata.consecom_budget_fx=fx;
          }
          if (body.duration && ["30d","90d","365d"].includes(body.duration)) opt.duration = body.duration;

          const owner=await resolveKeyOwner(body.ownerUserId,viewer);
          if(!owner)return response({error:"Funcionário inválido ou inativo"},400);
          const result=await upstream("/key/generate","POST",opt);
          const newRow=await sql`SELECT token FROM "LiteLLM_VerificationToken" WHERE key_alias=${name} ORDER BY created_at DESC LIMIT 1`;
          if(!newRow.length){
            await upstream("/key/delete","POST",{keys:[result.key]});
            return response({error:"Falha ao registrar a chave. Operação revertida."},500);
          }
          try{
            await sql`INSERT INTO consecom_key_owners(key_token,owner_user_id,tenant_id) VALUES(${newRow[0].token},${owner.id},${owner.tenantId})`;
          }catch(err){
            await upstream("/key/delete","POST",{keys:[result.key]});
            throw err;
          }
          return response({ok:true,key:result.key,alias:name,baseUrl:proxyPublicUrl,ownerUserId:owner.id});

        }


        if (u.pathname === "/api/keys/update" && req.method === "POST") {
          const raw=await req.text();if(raw.length>6000)return response({error:"Solicitação muito grande"},413);
          const b=JSON.parse(raw);
          const id=typeof b.id==="string"?b.id:"";
          if(!id||id.length>300)return response({error:"Identificador inválido"},400);
          const previous=await sql`SELECT token,key_alias,metadata,blocked,budget_duration FROM "LiteLLM_VerificationToken" WHERE token=${id} LIMIT 1`;
          if(!previous.length)return response({error:"API key não encontrada"},404);
          const name=typeof b.name==="string"?b.name.trim():"";
          if(name.length<2||name.length>80||/[\x00-\x1f]/.test(name))return response({error:"Nome inválido"},400);
          const dup=await sql`SELECT 1 FROM "LiteLLM_VerificationToken" WHERE key_alias=${name} AND token<>${id} LIMIT 1`;
          if(dup.length)return response({error:"Já existe outra chave com esse nome"},409);
          const metadata={...(previous[0].metadata&&typeof previous[0].metadata==="object"?previous[0].metadata:{})};
          const tokens=b.totalTokens===null||b.totalTokens===""?null:Number(b.totalTokens);
          if(tokens!==null&&(!Number.isSafeInteger(tokens)||tokens<1||tokens>100000000000000))return response({error:"Limite total de tokens inválido"},400);
          const brl=b.budgetBrl===null||b.budgetBrl===""?null:Number(b.budgetBrl);
          if(brl!==null&&(!Number.isFinite(brl)||brl<0.01||brl>10000000))return response({error:"Orçamento em reais inválido"},400);
          const fx=(await settings()).usdBrlRate;
          if(tokens===null){delete metadata.consecom_total_token_limit;}
          else metadata.consecom_total_token_limit=tokens;
          if(brl===null){delete metadata.consecom_budget_brl;delete metadata.consecom_budget_fx;}
          else{metadata.consecom_budget_brl=brl;metadata.consecom_budget_fx=fx;}
          const used=await sql`SELECT COALESCE(SUM(counted_tokens),0)::bigint AS tokens FROM consecom_usage_accounted WHERE api_key=${id}`;
          const exhausted=tokens!==null&&Number(used[0]?.tokens||0)>=tokens;
          const isManualBlock=b.blocked===true;
          metadata.consecom_quota_auto_blocked=exhausted&&!isManualBlock;
          const update={key:id,key_alias:name,metadata,
            rpm_limit:null,tpm_limit:null,tpd_limit:null,
            max_budget:brl===null?null:Math.round((brl/fx)*1000000)/1000000,
            budget_duration:null,
            blocked:isManualBlock||exhausted};
          await upstream("/key/update","POST",update);

          if(Object.prototype.hasOwnProperty.call(b,"ownerUserId")){
            if(!b.ownerUserId){
              await sql`DELETE FROM consecom_key_owners WHERE key_token=${id}`;
            }else{
              const owner=await resolveKeyOwner(String(b.ownerUserId),viewer);
              if(!owner)return response({error:"Funcionário inválido ou inativo"},400);
              await sql`INSERT INTO consecom_key_owners(key_token,owner_user_id,tenant_id)
                VALUES(${id},${owner.id},${owner.tenantId})
                ON CONFLICT(key_token) DO UPDATE SET owner_user_id=EXCLUDED.owner_user_id,tenant_id=EXCLUDED.tenant_id`;
            }
          }
          return response({ok:true,tokenLimit:tokens,budgetBrl:brl,spentTokens:Number(used[0]?.tokens||0),blocked:update.blocked});
        }
        if (u.pathname === "/api/keys/revoke" && req.method === "POST") {
          const body = JSON.parse((await req.text()).slice(0, 3000));
          const id = typeof body.id === "string" ? body.id : "";
          const found = await sql`SELECT 1 FROM "LiteLLM_VerificationToken" WHERE token=${id} LIMIT 1`;
          if (!found.length) return response({ error: "Chave não encontrada" }, 404);
          await upstream("/key/delete", "POST", { keys: [id] });
          await sql`DELETE FROM consecom_key_owners WHERE key_token=${id}`;
          return response({ ok: true });
        }
        if (u.pathname === "/api/settings" && req.method === "POST") {
          const body = JSON.parse((await req.text()).slice(0, 3000));
          const w = Number(body.windowUsd), m = Number(body.monthlyUsd), fx = Number(body.usdBrlRate);
          if (!Number.isFinite(w) || !Number.isFinite(m) || w < .01 || m < .01 || w > 100000 || m > 1000000 || !Number.isFinite(fx) || fx<1 || fx>20) return response({ error: "Valores inválidos" }, 400);
          await sql`UPDATE consecom_proxy_panel_settings SET window_limit_usd=${w},monthly_limit_usd=${m},usd_brl_rate=${fx},updated_at=CURRENT_TIMESTAMP WHERE id=1`;
          return response({ ok: true, settings: await settings() });
        }
        return response({ error: "Rota não encontrada" }, 404);
      } catch (e) {
        console.error("Panel request error:", String(e?.message || e).slice(0, 200));
        return response({ error: "Não foi possível concluir: " + String(e?.message || e).slice(0, 150) }, 500);
      }
    }
  });
  console.log("Consecom proxy manager running on port " + port);
})().catch(e=>{console.error('Panel fatal:',e.message);process.exit(1)});
