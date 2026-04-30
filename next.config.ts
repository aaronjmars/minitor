import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships a WASM binary that the server bundler must leave external.
  // pg uses native bindings the same way.
  serverExternalPackages: ["@electric-sql/pglite", "pg", "pg-native"],
};

export default nextConfig;
