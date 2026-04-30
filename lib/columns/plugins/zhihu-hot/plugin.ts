import { z } from "zod";
import { MessageCircleQuestion } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({});

export type ZhihuHotConfig = z.infer<typeof schema>;

export interface ZhihuHotMeta {
  kind: "newsnow";
  platform: string;
  platformLabel: string;
  rank: number;
  info?: string;
}

export const meta: PluginMeta<ZhihuHotConfig, ZhihuHotMeta> = {
  id: "zhihu-hot",
  label: "Zhihu · Hot",
  description:
    "Q&A platform like Quora, known for longer, more in-depth discussions.",
  icon: MessageCircleQuestion,
  accent: "#0084ff",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: () => "Zhihu · Hot",
  capabilities: { paginated: true },
};
