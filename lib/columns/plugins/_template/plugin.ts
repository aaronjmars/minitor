// _template — copy this folder, rename to your column id, and rewrite the
// three files. The aggregator registries (`lib/columns/registry.ts` and
// `lib/columns/server-registry.ts`) need one import + one array entry each.
// _template is NOT registered, so it never ships to users.

import { z } from "zod";
import { Sparkles } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

// 1. Define the config shape with Zod. `.default()` on every field means the
//    schema also produces the initial config via `schema.parse({})`.
export const schema = z.object({
  query: z.string().default(""),
  // Add more fields as needed. Use z.enum, z.boolean, z.object, ...
});

export type TemplateConfig = z.infer<typeof schema>;

// 2. Declare the shape of your `item.meta`. The renderer gets a typed
//    `FeedItem<TemplateMeta>` so it doesn't need runtime type guards.
export interface TemplateMeta {
  source: string;
}

// 3. Static metadata. The id MUST be unique across all plugins. The icon is
//    any LucideIcon. Capabilities are optional but worth setting:
//      - paginated: server returns `nextCursor` and UI shows Load more
//      - requiresEnv: env vars the server fetcher needs (UI surfaces them)
//      - rateLimitHint: free-form, shown to user before they create the column
export const meta: PluginMeta<TemplateConfig, TemplateMeta> = {
  id: "_template",
  label: "Template",
  description: "An example plugin showing the contract end-to-end.",
  icon: Sparkles,
  accent: "#888888",
  category: "other",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => (c.query.trim() ? `Template · ${c.query}` : "Template"),
  capabilities: {
    // paginated: true,
    // requiresEnv: ["MY_API_KEY"],
    // rateLimitHint: "60 calls/hour",
    // refreshIntervalHintMs: 5 * 60_000,
  },
};
