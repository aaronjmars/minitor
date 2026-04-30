import { z } from "zod";
import { Globe } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type WebSearchConfig = z.infer<typeof schema>;

export interface WebSearchMeta {
  source: string;
  kind: "web" | "news";
}

export const meta: PluginMeta<WebSearchConfig, WebSearchMeta> = {
  id: "web-search",
  label: "Web · Search",
  description: "Latest web results matching a query.",
  icon: Globe,
  accent: "#9fbbe0",
  category: "ai",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `Web · ${c.query.trim()}` : "Web · Search",
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
