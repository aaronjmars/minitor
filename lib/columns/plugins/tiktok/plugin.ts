import { z } from "zod";
import { Music2 } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type TikTokConfig = z.infer<typeof schema>;

export interface TikTokMeta {
  source: "tiktok";
  username?: string;
  videoId?: string;
}

export const meta: PluginMeta<TikTokConfig, TikTokMeta> = {
  id: "tiktok",
  label: "TikTok",
  description: "Watch TikTok for videos mentioning a keyword or URL.",
  icon: Music2,
  accent: "#fe2c55",
  category: "video",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `TikTok · ${c.query.trim()}` : "TikTok",
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
