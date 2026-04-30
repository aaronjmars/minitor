// Dedicated mention monitor for HN — separate from the existing hacker-news
// plugin so URL detection, comment scope, and date sort don't bloat that
// plugin's ConfigForm (which serves the front-page/Ask/Show/keyword UX).

import { z } from "zod";
import { Eye } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
  scope: z.enum(["all", "stories", "comments"]).default("all"),
  sort: z.enum(["relevance", "date"]).default("date"),
});

export type HNSearchConfig = z.infer<typeof schema>;

export interface HNSearchMeta {
  points: number;
  comments: number;
  commentsUrl: string;
  externalUrl?: string;
  kind: "story" | "comment";
  storyTitle?: string;
}

export const meta: PluginMeta<HNSearchConfig, HNSearchMeta> = {
  id: "hacker-news-search",
  label: "HN Mentions",
  description:
    "Watch Hacker News for keyword or URL mentions across stories and comments.",
  icon: Eye,
  accent: "#ff6600",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `HN watch · ${c.query.trim()}` : "HN watch",
  capabilities: { paginated: true },
};
