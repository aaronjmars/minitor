import { z } from "zod";
import { PlaySquare } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  mode: z.enum(["search", "channel", "playlist"]).default("search"),
  query: z.string().default(""),
  order: z.enum(["date", "relevance", "viewCount", "rating"]).default("date"),
  channel: z.string().default(""),
  playlist: z.string().default(""),
});

export type YTConfig = z.infer<typeof schema>;

export interface YTMeta {
  kind: "youtube";
  videoId?: string;
  channelId?: string;
  channelTitle?: string;
  thumbnail?: string;
  duration?: string;
  views?: number;
  likes?: number;
}

export const meta: PluginMeta<YTConfig, YTMeta> = {
  id: "youtube",
  label: "YouTube",
  description: "Search videos, watch a channel, or follow a playlist.",
  icon: PlaySquare,
  accent: "#ff0000",
  category: "video",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    if (c.mode === "channel") {
      const ch = c.channel.trim().replace(/^@/, "");
      return ch ? `YouTube · @${ch}` : "YouTube · Channel";
    }
    if (c.mode === "playlist") {
      return c.playlist.trim()
        ? `YouTube · ${c.playlist.trim().slice(0, 14)}…`
        : "YouTube · Playlist";
    }
    return c.query.trim() ? `YouTube · ${c.query.trim()}` : "YouTube · Search";
  },
  // Only Search mode actually paginates server-side; Channel/Playlist modes
  // return no nextCursor so the card naturally hides Load more there.
  // No strict requiresEnv: Channel + Playlist modes are keyless (Atom feeds).
  // Only Search needs YOUTUBE_API_KEY — the ConfigForm flags it inline there.
  capabilities: {
    paginated: true,
    rateLimitHint: "Channel/Playlist are keyless. Search needs YOUTUBE_API_KEY (~100/day free).",
  },
};
