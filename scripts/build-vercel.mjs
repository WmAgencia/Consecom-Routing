import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "services/consecom-landing-v3/index.tsx");
const outputPath = resolve(root, "dist");
const source = await readFile(sourcePath, "utf8");
const match = source.match(/^const html=("(?:[^"\\]|\\.)*");/s);

if (!match) {
  throw new Error(`Unable to extract the landing page HTML from ${sourcePath}`);
}

const html = JSON.parse(match[1]);

await rm(outputPath, { recursive: true, force: true });
await mkdir(outputPath, { recursive: true });
await writeFile(resolve(outputPath, "index.html"), html);
await writeFile(
  resolve(outputPath, "healthz.json"),
  `${JSON.stringify({ ok: true, service: "consecom-routing", platform: "vercel" })}\n`,
);

console.log(`Vercel output generated at ${outputPath}`);
