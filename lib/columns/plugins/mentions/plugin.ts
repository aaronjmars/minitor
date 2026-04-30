import { z } from "zod";
import { Radar } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
  sources: z
    .object({
      hn: z.boolean().default(true),
      reddit: z.boolean().default(true),
      "google-news": z.boolean().default(true),
      "bing-news": z.boolean().default(false),
    })
    .default({
      hn: true,
      reddit: true,
      "google-news": true,
      "bing-news": false,
    }),
});

export type MentionsConfig = z.infer<typeof schema>;

export interface MentionsItemMeta {
  mentionSource: "hn" | "reddit" | "google-news" | "bing-news";
}

export const meta: PluginMeta<MentionsConfig, MentionsItemMeta> = {
  id: "mentions",
  label: "Mentions monitor",
  description: "Watch a query/domain across HN, Reddit, Google News, Bing.",
  icon: Radar,
  accent: "#c08532",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `Mentions · ${c.query.trim()}` : "Mentions monitor",
};
