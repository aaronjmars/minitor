import { z } from "zod";
import { BookHeart } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type RednoteConfig = z.infer<typeof schema>;

export interface RednoteMeta {
  source: string;
  kind: "rednote";
}

export const meta: PluginMeta<RednoteConfig, RednoteMeta> = {
  id: "rednote",
  label: "Rednote · Mentions",
  description: "Latest Xiaohongshu (小红书) posts mentioning a keyword or URL.",
  icon: BookHeart,
  accent: "#ff2442",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `Rednote · ${c.query.trim()}` : "Rednote · Mentions",
  capabilities: {
    requiresEnv: ["XAI_API_KEY"],
    rateLimitHint:
      "Xiaohongshu has no public API. Results come from Grok web search scoped to xhs domains; coverage depends on what crawlers can index.",
  },
};
