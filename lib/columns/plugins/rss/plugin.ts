import { z } from "zod";
import { Rss } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  url: z.string().default(""),
});

export type RssConfig = z.infer<typeof schema>;

export interface RssMeta {
  source: string;
  feedTitle?: string;
}

export const meta: PluginMeta<RssConfig, RssMeta> = {
  id: "rss",
  label: "RSS · Atom",
  description: "Any RSS or Atom feed — blogs, Substacks, RSSHub, alerts.",
  icon: Rss,
  accent: "#dfa88f",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const url = c.url.trim();
    if (!url) return "RSS";
    try {
      const host = new URL(url).hostname.replace(/^www\./, "");
      return `RSS · ${host}`;
    } catch {
      return "RSS";
    }
  },
};
