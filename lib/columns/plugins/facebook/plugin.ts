import { z } from "zod";
import { ThumbsUp } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type FacebookConfig = z.infer<typeof schema>;

export interface FacebookMeta {
  source: string;
  kind: "web" | "news";
}

export const meta: PluginMeta<FacebookConfig, FacebookMeta> = {
  id: "facebook",
  label: "Facebook mentions",
  description:
    "Watch public Facebook posts and pages for mentions of a keyword or URL.",
  icon: ThumbsUp,
  accent: "#1877F2",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `Facebook · ${c.query.trim()}` : "Facebook mentions",
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
