import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root=dirname(dirname(fileURLToPath(import.meta.url)));
const servicesRoot=join(root,"services");
const outputRoot=join(root,".build-check");
const services=readdirSync(servicesRoot,{withFileTypes:true})
 .filter(entry=>entry.isDirectory())
 .map(entry=>entry.name)
 .sort();

rmSync(outputRoot,{recursive:true,force:true});
mkdirSync(outputRoot,{recursive:true});

function run(command,args,label){
 const result=spawnSync(command,args,{cwd:root,stdio:"inherit",shell:process.platform==="win32"});
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(`${label} falhou com código ${result.status}`);
}

try{
 for(const service of services){
  const entry=join(servicesRoot,service,"index.tsx");
  if(!existsSync(entry))throw new Error(`Entrada ausente: services/${service}/index.tsx`);
  run("bun",["build",entry,"--target=bun","--format=esm","--outdir",join(outputRoot,service)],`Build de ${service}`);
 }

 const python=process.platform==="win32"?"python":"python3";
 run(python,["-m","py_compile",join(root,"infra","litellm","startup.py")],"Validação do startup LiteLLM");
 console.log(`Validação concluída: ${services.length} serviços Bun e startup LiteLLM.`);
}finally{
 rmSync(outputRoot,{recursive:true,force:true});
}

