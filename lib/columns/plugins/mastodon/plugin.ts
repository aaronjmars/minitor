import { z } from "zod";
import { AtSign } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  instance: z.string().default("mastodon.social"),
  mode: z.enum(["hashtag", "author"]).default("hashtag"),
  query: z.string().default(""),
  handle: z.string().default(""),
});

export type MastodonConfig = z.infer<typeof schema>;

export interface MastodonMeta {
  favourites: number;
  reblogs: number;
  replies: number;
  followers: number;
  visibility: string;
  bot: boolean;
  isMastodon: true;
}

export const meta: PluginMeta<MastodonConfig, MastodonMeta> = {
  id: "mastodon",
  label: "Mastodon",
  description:
    "Public Mastodon timelines. Hashtag mode (any tag, keyless) or author mode (any user@server, keyless).",
  icon: AtSign,
  accent: "#6364ff",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    if (c.mode === "author") {
      const h = c.handle.trim();
      if (!h) return "Mastodon · Author";
      return `Mastodon · @${h.replace(/^@/, "")}`;
    }
    const q = c.query.trim().replace(/^#/, "");
    return q ? `Mastodon · #${q}` : "Mastodon · Hashtag";
  },
  capabilities: { paginated: true },
};
