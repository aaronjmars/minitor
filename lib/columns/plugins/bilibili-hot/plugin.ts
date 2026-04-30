import { z } from "zod";
import { Tv2 } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({});

export type BilibiliHotConfig = z.infer<typeof schema>;

export interface BilibiliHotMeta {
  kind: "newsnow";
  platform: string;
  platformLabel: string;
  rank: number;
  info?: string;
}

export const meta: PluginMeta<BilibiliHotConfig, BilibiliHotMeta> = {
  id: "bilibili-hot",
  label: "Bilibili · Hot",
  description:
    "Video-sharing site that started with anime/gaming, now a huge general-purpose video platform especially popular with younger users.",
  icon: Tv2,
  accent: "#fb7299",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: () => "Bilibili · Hot",
  capabilities: { paginated: true },
};
