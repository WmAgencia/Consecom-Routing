import { SQL } from "bun";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const databaseUrl = Bun.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL ausente");

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
const db = new SQL(databaseUrl);

await db`CREATE TABLE IF NOT EXISTS consecom_schema_migrations (
  name text PRIMARY KEY,
  checksum text NOT NULL,
  applied_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();
let applied = 0;
let skipped = 0;

for (const name of files) {
  const sql = await readFile(join(migrationsDir, name), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const previous = await db`SELECT checksum FROM consecom_schema_migrations WHERE name=${name}`;
  if (previous.length) {
    if (previous[0].checksum !== checksum) {
      throw new Error(`Migração ${name} já aplicada com conteúdo diferente; crie um novo arquivo em vez de editar este.`);
    }
    skipped++;
    continue;
  }
  // Cada arquivo contém exatamente uma instrução, por isso não há divisão de statements.
  await db.unsafe(sql);
  await db`INSERT INTO consecom_schema_migrations(name,checksum) VALUES(${name},${checksum})`;
  applied++;
  console.log("APPLIED " + name);
}

await db.close();
console.log("MIGRATIONS " + JSON.stringify({ applied, skipped, total: files.length }));
