import { z } from "zod";
import { Sparkles } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({});

export type WeiboHotConfig = z.infer<typeof schema>;

export interface WeiboHotMeta {
  kind: "newsnow";
  platform: string;
  platformLabel: string;
  rank: number;
  info?: string;
}

export const meta: PluginMeta<WeiboHotConfig, WeiboHotMeta> = {
  id: "weibo-hot",
  label: "Weibo · Hot",
  description:
    "China's biggest microblogging platform. Hot Search (微博热搜) is one of the most influential trending lists in China.",
  icon: Sparkles,
  accent: "#e6162d",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: () => "Weibo · Hot",
  capabilities: { paginated: true },
};
