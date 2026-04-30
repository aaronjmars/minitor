import { z } from "zod";
import { Zap } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import {
  PLATFORM_LABELS,
  type NewsNowPlatform,
} from "@/lib/integrations/newsnow";

const PLATFORMS = [
  "weibo",
  "zhihu",
  "douyin",
  "bilibili-hot-search",
  "toutiao",
  "baidu",
  "tieba",
  "wallstreetcn-hot",
  "cls-hot",
  "thepaper",
  "ifeng",
] as const satisfies readonly NewsNowPlatform[];

export const PLATFORM_ORDER: readonly NewsNowPlatform[] = PLATFORMS;

export const schema = z.object({
  platform: z.enum(PLATFORMS).default("weibo"),
});

export type NewsNowConfig = z.infer<typeof schema>;

export interface NewsNowMeta {
  kind: "newsnow";
  platform: NewsNowPlatform;
  platformLabel: string;
  rank: number;
  info?: string;
}

export const meta: PluginMeta<NewsNowConfig, NewsNowMeta> = {
  id: "newsnow",
  label: "China · Hot",
  description: "Trending boards across Weibo, Zhihu, Douyin, Baidu, B 站, …",
  icon: Zap,
  accent: "#dc2626",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => `Hot · ${PLATFORM_LABELS[c.platform] ?? "China"}`,
};
