import { readFile, readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = neon(url);

const dir = join(__dirname, "..", "drizzle");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

if (files.length === 0) {
  console.log("No migration files found in ./drizzle");
  process.exit(0);
}

for (const file of files) {
  const full = join(dir, file);
  const contents = await readFile(full, "utf8");
  console.log(`\n--- Applying ${file} ---`);
  const statements = contents
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    process.stdout.write(`  • ${stmt.split("\n")[0].slice(0, 80)}... `);
    try {
      await sql.query(stmt);
      console.log("ok");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        console.log("already exists");
      } else {
        console.log("FAILED");
        console.error(msg);
        process.exit(1);
      }
    }
  }
}
console.log("\nDone.");
