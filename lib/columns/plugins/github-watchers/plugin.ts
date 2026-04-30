import { z } from "zod";
import { Star } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { GHWatcherItemMeta } from "@/lib/integrations/github";

export const schema = z.object({
  repo: z.string().default(""),
  mode: z.enum(["stars", "forks", "both"]).default("both"),
});

export type GHWatchersConfig = z.infer<typeof schema>;

export type GHWatchersMeta = GHWatcherItemMeta;

const MODE_LABEL: Record<GHWatchersConfig["mode"], string> = {
  stars: "Stars",
  forks: "Forks",
  both: "Stars & forks",
};

export const meta: PluginMeta<GHWatchersConfig, GHWatchersMeta> = {
  id: "github-watchers",
  label: "GitHub watchers",
  description: "Latest stargazers and forks for a GitHub repo.",
  icon: Star,
  accent: "#f5a623",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const r = c.repo.trim();
    return r ? `${MODE_LABEL[c.mode]} · ${r}` : `GitHub · ${MODE_LABEL[c.mode]}`;
  },
  capabilities: {
    paginated: true,
    rateLimitHint:
      "60 req/hr without GITHUB_TOKEN, 5000 with. Token also unlocks GraphQL for newest-first stargazers.",
  },
};
