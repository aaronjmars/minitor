import { z } from "zod";
import { Send } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  channels: z.string().default(""),
  query: z.string().default(""),
  matchMode: z.enum(["keyword", "url"]).default("keyword"),
});

export type TGSearchConfig = z.infer<typeof schema>;

export interface TGSearchMeta {
  channel: string;
  channelTitle?: string;
  postId: string;
  views?: number;
}

export const meta: PluginMeta<TGSearchConfig, TGSearchMeta> = {
  id: "telegram-search",
  label: "Telegram mentions",
  description:
    "Watch public Telegram channels for keyword or URL mentions in their recent posts.",
  icon: Send,
  accent: "#229ED9",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const q = c.query.trim();
    return q ? `Telegram · ${q}` : "Telegram mentions";
  },
  capabilities: {
    rateLimitHint:
      "Scrapes public t.me/s/<channel> previews — recent posts only, no auth required.",
  },
};
