import { z } from "zod";
import { Search } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { TweetMeta } from "@/lib/columns/shared/tweet-renderer";

export type { TweetMeta };

export const schema = z.object({
  query: z.string().default(""),
});

export type XSearchConfig = z.infer<typeof schema>;

export const meta: PluginMeta<XSearchConfig, TweetMeta> = {
  id: "x-search",
  label: "X · Search",
  description: "Monitor X posts matching a keyword, hashtag, or query operator.",
  icon: Search,
  accent: "#1d9bf0",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => (c.query.trim() ? `X · ${c.query.trim()}` : "X · Search"),
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
