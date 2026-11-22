
const upstreamBase=(Bun.env.LITELLM_URL || "http://litellm.railway.internal:4000").replace(/\/+$/,"");
const master=Bun.env.LITELLM_MASTER_KEY || "";
const port=Number(Bun.env.PORT||3000);
// The signal aborts the response body too, so this ceiling bounds a whole streamed turn.
// 120 s cut legitimate Claude Code generations; 15 min keeps a hard stop without interrupting them.
const CONSECOM_UPSTREAM_TIMEOUT_MS=900000;
const CONSECOM_MODEL_PROFILES=Object.freeze({"claude-sonnet-5-5":{"requested":"low","effective":"low","real":"deepseek-flash"},"claude-opus-5":{"requested":"low","effective":"low","real":"deepseek-flash"},"claude-fable-5":{"requested":"low","effective":"low","real":"deepseek-v4-pro"},"claude-opus-5-5":{"requested":"medium","effective":"high","real":"deepseek-flash"},"claude-fable-5-2":{"requested":"high","effective":"high","real":"deepseek-flash"},"claude-fable-5-1":{"requested":"high","effective":"high","real":"deepseek-v4-pro"}});
const CONSECOM_DISCOVERY_PROFILES=Object.freeze([{"publicId":"consecom-claude-sonnet-5-5","canonical":"claude-sonnet-5-5","display":"Sonnet 5.5","desc":"Mais eficiente para tarefas do dia a dia","default":"low"},{"publicId":"consecom-claude-fable-5-1","canonical":"claude-fable-5-1","display":"Fable 5.1","desc":"Para programação e trabalhos que exigem raciocínio avançado","default":"high"},{"publicId":"consecom-claude-fable-5-2","canonical":"claude-fable-5-2","display":"Fable 5.2","desc":"Para desafios complexos e tarefas de alta exigência","default":"high"},{"publicId":"consecom-claude-opus-5-5","canonical":"claude-opus-5-5","display":"Opus 5.5","desc":"Mais eficiente para programação e tarefas do dia a dia","default":"medium"},{"publicId":"consecom-claude-fable-5","canonical":"claude-fable-5","display":"Fable 5","desc":"Para trabalhos ambiciosos que exigem maior capacidade","default":"low"},{"publicId":"consecom-claude-opus-5","canonical":"claude-opus-5","display":"Opus 5","desc":"Equilíbrio entre velocidade e capacidade para tarefas cotidianas","default":"low"}]);
const CONSECOM_PUBLIC_MODELS=Object.freeze(Object.fromEntries(CONSECOM_DISCOVERY_PROFILES.map(p=>[p.publicId,p.canonical])));
const CONSECOM_PROFILE_BY_CANONICAL=Object.freeze(Object.fromEntries(CONSECOM_DISCOVERY_PROFILES.map(p=>[p.canonical,p])));
const CONSECOM_EFFORT_LEVELS=["low","medium","high","xhigh","max"];
function consecomModelInfo(original,profile){
 const levels=Object.fromEntries(CONSECOM_EFFORT_LEVELS.map(level=>[level,{supported:true}]));
 return {...original,id:profile.canonical,type:"model",display_name:profile.display,description:profile.desc,
   created_at:original.created_at||"2026-11-14T00:00:00Z",
   capabilities:{...(original.capabilities||{}),effort:{...(original.capabilities?.effort||{}),supported:true,...levels},
     thinking:{supported:true,types:{adaptive:{supported:true},enabled:{supported:true},disabled:{supported:true}}}},
   effort:{supported_levels:CONSECOM_EFFORT_LEVELS,default_level:profile.default},
   default_effort:profile.default
 };
}
function resolveConsecomEffort(profile,raw){
 const value=typeof raw==="string"?raw.toLowerCase().trim():profile.requested;
 const normalized=value==="minimal"?"low":value==="ultra"||value==="ultrahigh"||value==="ultra-high"||value==="ultra_high"?"max":value;
 const chosen=CONSECOM_EFFORT_LEVELS.includes(normalized)?normalized:profile.requested;
 if(profile.real==="deepseek-v4-pro"&&profile.requested==="high"&&chosen==="low")return "medium";
 if(profile.real==="deepseek-flash"&&profile.requested==="medium"&&["xhigh","max"].includes(chosen))return "high";
 if(chosen==="low")return "low";
 if(chosen==="medium")return "high";
 if(chosen==="high")return "high";
 return "max";
}
const QUOTA_MESSAGE="Limite total de tokens esgotado. Esta API key atingiu o limite configurado. Solicite ao administrador do Consecom AI Proxy um aumento de franquia para continuar.";
const jsonHeaders={"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"};
const CONSECOM_INFERENCE_PATHS=Object.freeze(["/v1/messages","/messages","/v1/chat","/chat","/v1/completions","/completions","/v1/responses","/responses","/v1/embeddings","/embeddings","/v1/images","/images","/v1/models","/models","/v1/audio","/audio","/v1/rerank","/rerank"]);
// Public surface: inference-compatible routes only. LiteLLM's UI, health probes and management
// endpoints (key/model/user/team/organization/config/spend) are never reachable through this gateway.
function isAllowed(path){
 if(path==="/healthz")return true;
 return CONSECOM_INFERENCE_PATHS.some(base=>path===base||path.startsWith(base+"/"));
}
function publicResponse(payload,status){
 return new Response(JSON.stringify(payload),{status,headers:jsonHeaders});
}
async function getQuotaReason(token){
 if(!master || !token || token.length>400 || !token.startsWith("sk-")) return null;
 try{
  const r=await fetch(upstreamBase+"/key/info?key="+encodeURIComponent(token),{
   headers:{"Authorization":"Bearer "+master},
   signal:AbortSignal.timeout(3500)
  });
  if(!r.ok)return null;
  const j=await r.json();
  const k=j.info||j.key_info||j;
  const md=k.metadata||{};
  const cap=Number(md.consecom_total_token_limit);
  if(k.blocked===true && md.consecom_quota_auto_blocked===true && Number.isFinite(cap) && cap>0){
   return {reason:"token_limit_exceeded",limit:cap};
  }
 }catch{}
 return null;
}
function forwardHeaders(req){
 const headers=new Headers(req.headers);
 for(const h of ["host","content-length","connection","transfer-encoding","x-forwarded-host","x-forwarded-proto","x-forwarded-port"]) headers.delete(h);
 headers.set("x-forwarded-host",new URL(req.url).host);
 headers.set("x-forwarded-proto","https");
 return headers;
}
function responseHeaders(src,requestUrl){
 const headers=new Headers(src);
 for(const h of ["connection","transfer-encoding","keep-alive"]) headers.delete(h);
 const location=headers.get("location");
 if(location && requestUrl){
   try{
     const parsed=new URL(location,upstreamBase);
     if(parsed.origin===new URL(upstreamBase).origin){
       headers.set("location",new URL(parsed.pathname+parsed.search+parsed.hash,"https://"+requestUrl.host).toString());
     }
   }catch{}
 }
 return headers;
}
Bun.serve({
 hostname:"0.0.0.0",port,
 async fetch(req){
  const requestUrl=new URL(req.url);
  if(requestUrl.pathname==="/healthz")return publicResponse({ok:true,service:"consecom-quota-aware-gateway"},200);
  const isAnthropicAlias=requestUrl.pathname==="/anthropic"||requestUrl.pathname.startsWith("/anthropic/");
  const targetPath=isAnthropicAlias?(requestUrl.pathname.slice("/anthropic".length)||"/"):requestUrl.pathname;
  if(!isAllowed(targetPath)){
    console.warn("CONSECOM_BLOCKED_PATH",req.method,String(targetPath).slice(0,120));
    return publicResponse({error:{message:"Rota não encontrada",type:"not_found_error"}},404);
  }
  const target=upstreamBase+targetPath+requestUrl.search;
  const outgoingHeaders=forwardHeaders(req);
  let body=(req.method==="GET"||req.method==="HEAD")?undefined:req.body;
  let routedProfile=null;
  if(req.method==="POST" && targetPath==="/v1/messages" && req.headers.get("content-type")?.includes("application/json")){
    try{
      const data=await req.json();
      if(typeof data?.model==="string" && CONSECOM_PUBLIC_MODELS[data.model])data.model=CONSECOM_PUBLIC_MODELS[data.model];
      const p=CONSECOM_MODEL_PROFILES[data?.model]||null;
      const forced=["tool","any"].includes(data?.tool_choice?.type);
      const hasUnreasonedToolUse=Array.isArray(data?.messages)&&data.messages.some(m=>m.role==="assistant"&&Array.isArray(m.content)&&m.content.some(v=>v.type==="tool_use")&&!m.content.some(v=>v.type==="thinking"));
      const isDeepSeekModel=typeof data?.model==="string"&&(data.model.startsWith("deepseek")||p!==null||["claude-sonnet-5-5"].includes(data.model));
      const mustDisableThinking=isDeepSeekModel&&(forced||hasUnreasonedToolUse);
      if(mustDisableThinking){
        data.thinking={type:"disabled"};
        if(data.output_config&&typeof data.output_config==="object"){
          delete data.output_config.effort;
          if(Object.keys(data.output_config).length===0)delete data.output_config;
        }
      }else if(p && data.thinking?.type!=="disabled"){
        const requested=typeof data.output_config?.effort==="string"?data.output_config.effort:null;
        const effort=resolveConsecomEffort(p,requested);
        data.thinking={type:"enabled"};
        data.output_config={...(data.output_config&&typeof data.output_config==="object"?data.output_config:{}),effort};
      }
      if(p){
        routedProfile={model:data.model,upstream:p.real,requested:typeof data.output_config?.effort==="string"?data.output_config.effort:"disabled"};
      }
      body=JSON.stringify(data);
      outgoingHeaders.delete("content-length");
    }catch{
      return publicResponse({error:{message:"Corpo JSON inválido",type:"invalid_request_error"}},400);
    }
  }
  if(req.method==="POST" && targetPath==="/v1/chat/completions" && req.headers.get("content-type")?.includes("application/json")){
    try{
      const data=await req.json();
      if(typeof data?.model==="string"&&CONSECOM_PUBLIC_MODELS[data.model]){
        data.model=CONSECOM_PUBLIC_MODELS[data.model];
        body=JSON.stringify(data);
        outgoingHeaders.delete("content-length");
      }else body=JSON.stringify(data);
    }catch{return publicResponse({error:{message:"Corpo JSON inválido",type:"invalid_request_error"}},400);}
  }
  if(req.method==="GET"&&targetPath.startsWith("/v1/models/")){
    const modelId=decodeURIComponent(targetPath.slice("/v1/models/".length));
    const profile=CONSECOM_DISCOVERY_PROFILES.find(p=>p.publicId===modelId||p.canonical===modelId);
    if(profile){
      try{
        const permissionCheck=await fetch(upstreamBase+"/v1/models",{headers:outgoingHeaders,signal:AbortSignal.timeout(6000)});
        if(!permissionCheck.ok)return new Response(permissionCheck.body,{status:permissionCheck.status,headers:responseHeaders(permissionCheck.headers,requestUrl)});
        const found=await permissionCheck.json();
        const original=(found.data||[]).find(m=>m.id===profile.canonical);
        if(!original)return publicResponse({type:"error",error:{type:"not_found_error",message:"Modelo não autorizado"}},404);
        return new Response(JSON.stringify({...consecomModelInfo(original,profile),id:modelId}),{status:200,headers:jsonHeaders});
      }catch(err){return publicResponse({error:{type:"service_unavailable",message:"Falha na consulta de modelos"}},503);}
    }
  }
  let upstream;
  try{
   upstream=await fetch(target,{
    method:req.method,
    headers:outgoingHeaders,
    body,
    redirect:"manual",
    signal:AbortSignal.timeout(CONSECOM_UPSTREAM_TIMEOUT_MS)
   });
  }catch(err){
   return publicResponse({error:{message:"Provedor temporariamente indisponível",type:"service_unavailable",code:"upstream_unavailable"}},503);
  }
  if(req.method==="GET"&&targetPath==="/v1/models"&&upstream.ok){
    try{
      // Read once: the body cannot be consumed twice, and a non-standard 200 must still be relayed.
      const text=await upstream.text();
      const result=JSON.parse(text);
      if(Array.isArray(result.data)){
        const allowed=new Map(result.data.filter(x=>x&&typeof x.id==="string").map(x=>[x.id,x]));
        const discovery=CONSECOM_DISCOVERY_PROFILES.filter(p=>allowed.has(p.canonical)).map(p=>{
          const original=allowed.get(p.canonical);
          return consecomModelInfo(original,p);
        });
        const passthrough=[]; // Preserve legacy aliases for existing keys, but show only the six curated employee profiles.
        const unique=new Set();
        const enriched=[...discovery,...passthrough].filter(m=>{if(unique.has(m.id))return false;unique.add(m.id);return true;});
        const headers=responseHeaders(upstream.headers,requestUrl);
        for(const h of ["content-length","content-encoding","etag","last-modified"])headers.delete(h);
        headers.set("content-type","application/json; charset=utf-8");
        headers.set("cache-control","private, no-store");
        return new Response(JSON.stringify({...result,data:enriched}),{status:upstream.status,headers});
      }
      const headers=responseHeaders(upstream.headers,requestUrl);
      for(const h of ["content-length","content-encoding"])headers.delete(h);
      headers.set("content-type","application/json; charset=utf-8");
      return new Response(text,{status:upstream.status,headers});
    }catch(err){
      return publicResponse({error:{message:"Não foi possível ler a descoberta de modelos",type:"gateway_error"}},502);
    }
  }
  if(upstream.status===401 || upstream.status===403){
   const textBody=await upstream.text();
   let body={};
   try{body=JSON.parse(textBody)}catch{}
   const msg=String(body?.error?.message||body?.detail||body?.message||"");
   if(/key is blocked/i.test(msg)){
    const authorization=req.headers.get("authorization")||req.headers.get("x-litellm-api-key")||"";
    const token=authorization.replace(/^Bearer\s+/i,"").trim();
    const quota=await getQuotaReason(token);
    if(quota){
     const anthropic=/\/messages(?:\/|$)/.test(requestUrl.pathname);
     const error=anthropic?
      {type:"error",error:{type:"permission_error",message:QUOTA_MESSAGE,code:"token_limit_exceeded"}}:
      {error:{message:QUOTA_MESSAGE,type:"insufficient_quota",code:"token_limit_exceeded",param:null}};
     const headers={...jsonHeaders,"x-consecom-quota-reason":"token_limit_exceeded"};
     return new Response(JSON.stringify(error),{status:403,headers});
    }
   }
   const headers=responseHeaders(upstream.headers,requestUrl);
   headers.delete("content-length");
   return new Response(textBody,{status:upstream.status,headers});
  }
  const resultHeaders=responseHeaders(upstream.headers,requestUrl);
  if(routedProfile){
    resultHeaders.set("x-consecom-model",routedProfile.model);
    resultHeaders.set("x-consecom-upstream",routedProfile.upstream);
    resultHeaders.set("x-consecom-effort",routedProfile.requested);
  }
  if(req.method==="POST"&&targetPath==="/v1/messages"&&req.headers.get("content-type")?.includes("application/json")){
    // Non-sensitive public profile metadata; upstream routing still uses the registered LiteLLM alias.
    resultHeaders.set("x-consecom-routing","profiled");
  }
  return new Response(upstream.body,{status:upstream.status,headers:resultHeaders});
 }
});
console.log("Consecom quota-aware gateway started; upstream preserved");

