import { z } from "zod";
import { Tag } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  repo: z.string().default(""),
  includePrereleases: z.boolean().default(true),
});

export type GHReleasesConfig = z.infer<typeof schema>;

export interface GHReleasesMeta {
  kind?: "release";
  repo?: string;
  tag?: string;
  prerelease?: boolean;
}

export const meta: PluginMeta<GHReleasesConfig, GHReleasesMeta> = {
  id: "github-releases",
  label: "GitHub releases",
  description: "Latest releases for a GitHub repo, newest first.",
  icon: Tag,
  accent: "#22c55e",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const r = c.repo.trim();
    return r ? `Releases · ${r}` : "GitHub · Releases";
  },
  capabilities: {
    paginated: true,
    rateLimitHint: "60 req/hr without GITHUB_TOKEN, 5000 with.",
  },
};
