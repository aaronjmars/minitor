import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const emptyModule = fileURLToPath(
  new URL("./test/stubs/empty-module.ts", import.meta.url),
);

export default defineConfig({
  resolve: {
    alias: [
      // Mirror the `@/*` path alias from tsconfig.json.
      { find: /^@\//, replacement: `${root}` },
      // Neutralize the RSC marker packages (see test/stubs/empty-module.ts).
      { find: /^server-only$/, replacement: emptyModule },
      { find: /^client-only$/, replacement: emptyModule },
    ],
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // The DB-backed round-trip test builds an isolated in-memory PGlite from
    // this URL. Every other test ignores it.
    env: { DATABASE_URL: "memory://" },
  },
});
