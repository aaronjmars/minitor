import { z } from "zod";
import { CircleDot } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type GHIssuesConfig = z.infer<typeof schema>;

export interface GHIssuesMeta {
  kind: "pr" | "issue";
  repo?: string;
  number?: number;
  state?: string;
  comments?: number;
}

export const meta: PluginMeta<GHIssuesConfig, GHIssuesMeta> = {
  id: "github-issues",
  label: "GitHub PRs",
  description: "Search GitHub pull requests and issues with full query syntax.",
  icon: CircleDot,
  accent: "#26251e",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const q = c.query.trim();
    return q ? `Issues · ${q}` : "GitHub · Issues";
  },
  capabilities: {
    paginated: true,
    rateLimitHint: "60 req/hr without GITHUB_TOKEN, 5000 with",
  },
};
