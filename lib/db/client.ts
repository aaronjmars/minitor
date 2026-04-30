import "server-only";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import { PGlite } from "@electric-sql/pglite";
import * as schema from "@/lib/db/schema";

// `db` is the Drizzle client used by every server action / API route. The
// concrete driver is picked at module load based on DATABASE_URL:
//
//   - missing / "pglite" / "file:" / "memory:"  → PGlite (local file, default)
//   - host matches *.neon.tech                  → Neon HTTP driver
//   - any other postgres:// URL                  → node-postgres pool
//
// All three return a Drizzle DB whose call surface (.select / .insert /
// .execute / .update / .delete) is identical, so call sites stay driver-agnostic.

export const LOCAL_PGLITE_DIR = join(process.cwd(), ".minitor", "pgdata");

export type DatabaseKind = "pglite" | "neon" | "postgres";

export interface DatabaseConfig {
  kind: DatabaseKind;
  /** Path to the PGlite data directory (only set when kind === "pglite"). */
  pglitePath?: string;
  /** Connection string (only set when kind !== "pglite"). */
  url?: string;
}

export function resolveDatabaseConfig(
  rawUrl: string | undefined = process.env.DATABASE_URL,
): DatabaseConfig {
  const url = (rawUrl ?? "").trim();

  if (
    !url ||
    url.startsWith("pglite:") ||
    url.startsWith("file:") ||
    url.startsWith("memory:")
  ) {
    return { kind: "pglite", pglitePath: LOCAL_PGLITE_DIR };
  }

  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    // fall through to postgres branch — let the driver surface a real error
  }
  if (host.endsWith("neon.tech") || host.endsWith("neon.build")) {
    return { kind: "neon", url };
  }
  return { kind: "postgres", url };
}

const config = resolveDatabaseConfig();

// We declare `db` as the NodePg shape because it's the most permissive of the
// three concrete types (the call surface we use is identical across drivers).
type Db = ReturnType<typeof drizzleNodePg<typeof schema>>;

function buildDb(): Db {
  switch (config.kind) {
    case "pglite": {
      const client = new PGlite(config.pglitePath);
      return drizzlePglite(client, { schema }) as unknown as Db;
    }
    case "neon": {
      const sql = neon(config.url!);
      return drizzleNeonHttp(sql, { schema }) as unknown as Db;
    }
    case "postgres": {
      const pool = new Pool({ connectionString: config.url });
      return drizzleNodePg(pool, { schema });
    }
  }
}

export const db: Db = buildDb();
