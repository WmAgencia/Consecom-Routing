import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "services/consecom-landing-v3/index.tsx");
const outputPath = resolve(root, "dist");
const source = await readFile(sourcePath, "utf8");
const hero = await readFile(resolve(root, "services/consecom-landing-v3/hero-v8.html"), "utf8");
const trial = await readFile(resolve(root, "services/consecom-landing-v3/trial-v8.html"), "utf8");
const styles = await readFile(resolve(root, "services/consecom-landing-v3/v8.css"), "utf8");
const match = source.match(/^const html=("(?:[^"\\]|\\.)*");/s);

if (!match) {
  throw new Error(`Unable to extract the landing page HTML from ${sourcePath}`);
}

let html = JSON.parse(match[1]);
html = html
  .replace(/<section class="reference-hero exact-reference-hero"[\s\S]*?<\/section><\/div>/, `${hero.trim()}</div>`)
  .replace(/<div class="section-heading ref-plan-title">[\s\S]*?<div class="pricegrid">\s*<article class="plan ref-trial">[\s\S]*?<\/article>/, trial.trim())
  .replace("</style>", `${styles}\n</style>`);

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
await writeFile(resolve(outputPath, "index.html"), html);
await writeFile(
  resolve(outputPath, "healthz.json"),
  `${JSON.stringify({ ok: true, service: "consecom-routing", platform: "vercel" })}\n`,
);

console.log(`Vercel output generated at ${outputPath}`);
