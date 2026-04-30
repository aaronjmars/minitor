import { z } from "zod";
import { Newspaper } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({});

export type ToutiaoConfig = z.infer<typeof schema>;

export interface ToutiaoMeta {
  kind: "newsnow";
  platform: string;
  platformLabel: string;
  rank: number;
  info?: string;
}

export const meta: PluginMeta<ToutiaoConfig, ToutiaoMeta> = {
  id: "toutiao",
  label: "Toutiao",
  description:
    '"Today\'s Headlines" — an algorithmic news aggregator (also ByteDance).',
  icon: Newspaper,
  accent: "#fc4f4f",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: () => "Toutiao",
  capabilities: { paginated: true },
};
