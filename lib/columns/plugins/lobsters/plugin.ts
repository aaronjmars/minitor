import { z } from "zod";
import { Anchor } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  mode: z.enum(["hottest", "newest", "active", "tag"]).default("hottest"),
  tag: z.string().default(""),
});

export type LobstersConfig = z.infer<typeof schema>;

export interface LobstersMeta {
  score: number;
  comments: number;
  commentsUrl: string;
  externalUrl?: string;
  tags: string[];
}

const MODE_LABELS: Record<LobstersConfig["mode"], string> = {
  hottest: "Hottest",
  newest: "Newest",
  active: "Active",
  tag: "Tag",
};

export const meta: PluginMeta<LobstersConfig, LobstersMeta> = {
  id: "lobsters",
  label: "Lobsters",
  description:
    "Front page, newest, active discussions, or filter by tag (e.g. rust, ai, programming).",
  icon: Anchor,
  // Lobsters' brand colour — the lobster-claw red on lobste.rs/about.
  accent: "#ac130d",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.mode === "tag" && c.tag.trim()
      ? `Lobsters · t/${c.tag.trim()}`
      : `Lobsters · ${MODE_LABELS[c.mode]}`,
  capabilities: { paginated: true },
};
