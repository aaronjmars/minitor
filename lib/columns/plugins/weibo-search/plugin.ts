import { z } from "zod";
import { MessageSquare } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { WeiboSearchMeta } from "@/lib/integrations/weibo";

export const schema = z.object({
  query: z.string().default(""),
});

export type WeiboSearchConfig = z.infer<typeof schema>;

export type { WeiboSearchMeta };

export const meta: PluginMeta<WeiboSearchConfig, WeiboSearchMeta> = {
  id: "weibo-search",
  label: "Weibo · Search",
  description: "Watch Weibo (微博) for posts mentioning a keyword or URL.",
  icon: MessageSquare,
  accent: "#e6162d",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `微博 · ${c.query.trim()}` : "Weibo · Search",
  capabilities: {
    rateLimitHint:
      "m.weibo.cn is fronted by CN-only infrastructure — requests from non-CN egress IPs may return empty results or rate-limit. Best run from a Chinese region.",
  },
};
