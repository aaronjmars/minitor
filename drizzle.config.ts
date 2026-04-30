import type { Config } from "drizzle-kit";

const url = (process.env.DATABASE_URL ?? "").trim();

// drizzle-kit's `generate` doesn't need credentials; `studio` does. Pass a
// dummy URL when DATABASE_URL is missing so `generate` works in the local
// PGlite default — `studio` will surface the missing var if you run it.
export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url || "postgres://placeholder@localhost/placeholder",
  },
  strict: true,
} satisfies Config;
