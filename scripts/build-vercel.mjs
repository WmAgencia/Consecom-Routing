import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "services/consecom-landing-v3/index.tsx");
const outputPath = resolve(root, "dist");
const source = await readFile(sourcePath, "utf8");
const hero = await readFile(resolve(root, "services/consecom-landing-v3/hero-v8.html"), "utf8");
const trial = await readFile(resolve(root, "services/consecom-landing-v3/trial-v8.html"), "utf8");
const styles = await readFile(resolve(root, "services/consecom-landing-v3/v8.css"), "utf8");
const heroArtwork = await readFile(resolve(root, "assets/consecom-hero-smoke-v2.png"));
const match = source.match(/^const html=("(?:[^"\\]|\\.)*");/s);

if (!match) {
  throw new Error(`Unable to extract the landing page HTML from ${sourcePath}`);
}

let html = JSON.parse(match[1]);
const previousHero = /<section class="reference-hero (?:exact-reference-hero|cc-scene)"[\s\S]*?<\/section><\/div>/;
if (!previousHero.test(html)) {
  throw new Error("Landing hero replacement target not found: refusing to publish the old hero");
}
html = html
  .replace(previousHero, `${hero.trim()}</div>`)
  .replace(/<script>\(\(\)=>\{const scene=document.getElementById\('cloud-scene'\)[\s\S]*?<\/script>/g, "")
  .replace(/<div class="section-heading ref-plan-title">[\s\S]*?<div class="pricegrid">\s*<article class="plan ref-trial">[\s\S]*?<\/article>/, trial.trim())
  .replace("</style>", `${styles}\n</style>`);

if (!html.includes('class="cc-hero"') || !html.includes('cc-hero-number-right') || !html.includes('11,3x') || !html.includes('cc-hero-clouds')) {
  throw new Error("Cloud Code hero post-build validation failed");
}

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
await writeFile(resolve(outputPath, "index.html"), html);
await writeFile(resolve(outputPath, "consecom-hero-smoke-v2.png"), heroArtwork);
await writeFile(
  resolve(outputPath, "healthz.json"),
  `${JSON.stringify({ ok: true, service: "consecom-routing", platform: "vercel" })}\n`,
);

console.log(`Vercel output generated at ${outputPath}`);
