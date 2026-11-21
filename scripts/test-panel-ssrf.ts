import { publicHttpsBase } from "../services/consecom-proxy-dashboard/index.tsx";

let failures = 0;
const check = (condition: boolean, label: string) => {
  if (condition) console.log("PASS " + label);
  else {
    failures++;
    console.error("FAIL " + label);
  }
};

const allowed = [
  "https://api.openai.com/v1",
  "https://api.deepseek.com",
  "https://example.com:8443/v1",
  "https://[2001:db8::1]/v1",
  "https://api.exemplo.com.br/v1/",
];
for (const url of allowed) check(publicHttpsBase(url) !== null, "aceita " + url);

const blocked = [
  "http://api.openai.com/v1",
  "https://localhost/v1",
  "https://127.0.0.1/v1",
  "https://127.1.2.3/v1",
  "https://10.0.0.5/v1",
  "https://172.16.0.1/v1",
  "https://172.31.255.255/v1",
  "https://192.168.0.1/v1",
  "https://100.64.0.1/v1",
  "https://169.254.169.254/latest/meta-data",
  "https://0.0.0.0/v1",
  "https://[::1]/v1",
  "https://[::]/v1",
  "https://[fd00::1]/v1",
  "https://[fe80::1]/v1",
  "https://[::ffff:127.0.0.1]/v1",
  "https://foo.internal/v1",
  "https://foo.local/v1",
  "https://user:pass@example.com/v1",
  "https://example.com/v1?x=1",
  "https://example.com/v1#x",
  "https://2130706433/v1",
];
for (const url of blocked) check(publicHttpsBase(url) === null, "bloqueia " + url);

check(publicHttpsBase("https://example.com/v1/") === "https://example.com/v1", "remove barras finais da Base URL");
check(publicHttpsBase("") === null, "rejeita valor vazio");

if (failures) {
  console.error(`\n${failures} verificação(ões) falharam`);
  process.exit(1);
}
console.log("\nSSRF do painel: todas as verificações aprovadas.");
