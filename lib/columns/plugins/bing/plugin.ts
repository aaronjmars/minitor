import { z } from "zod";
import { Globe } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type BingConfig = z.infer<typeof schema>;

export interface BingMeta {
  source: string;
  feedTitle?: string;
}

export const meta: PluginMeta<BingConfig, BingMeta> = {
  id: "bing",
  label: "Web search",
  description:
    "Search the web via Bing News (RSS, no key required).",
  icon: Globe,
  accent: "#5b8def",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `Web · ${c.query.trim()}` : "Web search",
  capabilities: { paginated: true },
};
