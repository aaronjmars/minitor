// Stub for `server-only` / `client-only` marker packages under vitest.
//
// Those packages resolve to a module that throws unless bundled with the
// correct React Server Components condition. Vitest doesn't set that condition,
// so importing anything server-only (e.g. `lib/db/client.ts`) would throw at
// import time. Aliasing them to this empty module in `vitest.config.ts` makes
// the marker a no-op in tests, which is exactly its runtime behaviour on the
// server.
export {};
