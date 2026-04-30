import { z } from "zod";
import { Video } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({});

export type DouyinHotConfig = z.infer<typeof schema>;

export interface DouyinHotMeta {
  kind: "newsnow";
  platform: string;
  platformLabel: string;
  rank: number;
  info?: string;
}

export const meta: PluginMeta<DouyinHotConfig, DouyinHotMeta> = {
  id: "douyin-hot",
  label: "Douyin · Hot",
  description:
    "The original Chinese version of TikTok (same company, ByteDance, but a separate app for the domestic market).",
  icon: Video,
  accent: "#161823",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: () => "Douyin · Hot",
  capabilities: { paginated: true },
};
