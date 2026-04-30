import { z } from "zod";
import { Flame } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  language: z.string().default(""),
  period: z.enum(["day", "week", "month"]).default("week"),
});

export type GHTrendingConfig = z.infer<typeof schema>;

export interface GHTrendingMeta {
  repo: string;
  stars?: number;
  forks?: number;
  language?: string;
}

const PERIOD_LABEL: Record<GHTrendingConfig["period"], string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

export const meta: PluginMeta<GHTrendingConfig, GHTrendingMeta> = {
  id: "github-trending",
  label: "GitHub trending",
  description: "Trending repositories by stars over a recent window.",
  icon: Flame,
  accent: "#e88a4d",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const lang = c.language.trim() ? `${c.language.trim()} · ` : "";
    return `Trending · ${lang}${PERIOD_LABEL[c.period]}`;
  },
  capabilities: {
    paginated: true,
    rateLimitHint: "60 req/hr without GITHUB_TOKEN, 5000 with",
  },
};
