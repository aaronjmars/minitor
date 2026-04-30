// Dedicated plugin (rather than a "prs" mode in github/) — that plugin already
// has 4 modes and a per-repo PR feed wants different fields and a focused form.

import { z } from "zod";
import { GitPullRequest } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  repo: z.string().default(""),
  state: z.enum(["open", "closed", "all"]).default("open"),
  sort: z.enum(["created", "updated"]).default("updated"),
});

export type GHPRConfig = z.infer<typeof schema>;

export interface GHPRMeta {
  number: number;
  state: "open" | "closed" | "merged";
  isDraft: boolean;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
  baseBranch: string;
  headBranch: string;
  commentsCount: number;
  repo: string;
  mergedAt?: string;
}

const STATE_LABEL: Record<GHPRConfig["state"], string> = {
  open: "open",
  closed: "closed",
  all: "all",
};

export const meta: PluginMeta<GHPRConfig, GHPRMeta> = {
  id: "github-prs",
  label: "GitHub PRs",
  description: "Latest pull requests on a specific GitHub repository.",
  icon: GitPullRequest,
  accent: "#26251e",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const repo = c.repo.trim();
    if (!repo) return "GitHub · PRs";
    return `PRs · ${repo}${c.state === "open" ? "" : ` (${STATE_LABEL[c.state]})`}`;
  },
  capabilities: {
    paginated: true,
    rateLimitHint: "60 req/hr without GITHUB_TOKEN, 5000 with",
  },
};
