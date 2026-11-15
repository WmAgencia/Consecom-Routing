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
for (const service of services) {
  for (const file of ["index.tsx", "package.json", "Dockerfile", "railway.json"]) {
    const path = join(root, "services", service, file);
    if (!existsSync(path)) failures.push(`Arquivo ausente: services/${service}/${file}`);
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

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Estrutura e verificação de segredos concluídas.");

