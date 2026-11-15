import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname.replace(/^\/(.:\/)/, "$1");
const services = [
  "consecom-checkout",
  "consecom-checkout-e2e-temporary",
  "consecom-landing-v3",
  "consecom-ai-portal",
  "consecom-branded-api",
  "consecom-smart-api",
  "consecom-token-quota-monitor",
  "consecom-proxy-dashboard",
];

const failures = [];
const requiredRootFiles = [
  ".env.example",
  ".gitignore",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "README.md",
  "SECURITY.md",
  "docs/ARCHITECTURE.md",
  "docs/DEPLOYMENT.md",
  "docs/ENVIRONMENT.md",
  "docs/INCIDENTS.md",
  "docs/OPERATIONS.md",
];

for (const file of requiredRootFiles) {
  if (!existsSync(join(root, file))) failures.push(`Arquivo essencial ausente: ${file}`);
}

for (const service of services) {
  for (const file of ["index.tsx", "package.json", "Dockerfile", "railway.json"]) {
    const path = join(root, "services", service, file);
    if (!existsSync(path)) failures.push(`Arquivo ausente: services/${service}/${file}`);
  }
}

for (const path of files(root)) {
  const relativePath=relative(root,path).replaceAll("\\","/");
  if((relativePath===".env"||relativePath.startsWith(".env."))&&relativePath!==".env.example"){
    failures.push(`Arquivo de ambiente não permitido: ${relativePath}`);
  }
  if(path.endsWith(".json")){
    try{JSON.parse(readFileSync(path,"utf8"))}
    catch{failures.push(`JSON inválido: ${relativePath}`)}
  }
}

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) => {
    if (item.name === ".git" || item.name === "node_modules") return [];
    const path = join(dir, item.name);
    return item.isDirectory() ? files(path) : [path];
  });
}

const secretPatterns = [
  /sk_live_[A-Za-z0-9_-]{12,}/,
  /sk_test_[A-Za-z0-9_-]{12,}/,
  /whsec_[A-Za-z0-9_-]{12,}/,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

for (const path of files(root)) {
  if (statSync(path).size > 2_000_000) continue;
  let content;
  try { content = readFileSync(path, "utf8"); } catch { continue; }
  for (const pattern of secretPatterns) {
    if (pattern.test(content)) failures.push(`Possível segredo em ${relative(root, path)} (${pattern})`);
  }
}

const publicCopy=[
  join(root,"README.md"),
  join(root,"docs","BRANDING.md"),
];
const internalProviderNames=/\b(deepseek|puter|openrouter|poyo)\b/i;
for(const path of publicCopy){
  if(internalProviderNames.test(readFileSync(path,"utf8"))){
    failures.push(`Fornecedor interno citado em comunicação pública: ${relative(root,path)}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Estrutura e verificação de segredos concluídas.");

