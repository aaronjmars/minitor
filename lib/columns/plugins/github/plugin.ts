import { z } from "zod";
import { GitGraph } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  mode: z.enum(["trending", "releases", "issues"]).default("trending"),
  language: z.string().default(""),
  period: z.enum(["day", "week", "month"]).default("week"),
  repo: z.string().default(""),
  query: z.string().default(""),
});

export type GHConfig = z.infer<typeof schema>;

export interface GHMeta {
  kind: "repo" | "release" | "pr" | "issue";
  repo?: string;
  stars?: number;
  forks?: number;
  language?: string;
  tag?: string;
  prerelease?: boolean;
  number?: number;
  state?: string;
  comments?: number;
}

const PERIOD_LABEL: Record<GHConfig["period"], string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

export const meta: PluginMeta<GHConfig, GHMeta> = {
  id: "github",
  label: "GitHub",
  description: "Trending repos, repo releases, or issue/PR search.",
  icon: GitGraph,
  accent: "#26251e",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    if (c.mode === "releases") {
      return c.repo.trim() ? `Releases · ${c.repo.trim()}` : "GitHub · Releases";
    }
    if (c.mode === "issues") {
      return c.query.trim() ? `Issues · ${c.query.trim()}` : "GitHub · Issues";
    }
    const lang = c.language.trim() ? `${c.language.trim()} · ` : "";
    return `Trending · ${lang}${PERIOD_LABEL[c.period]}`;
  },
  capabilities: { paginated: true, rateLimitHint: "60 unauthenticated GitHub API calls/hour" },
};
