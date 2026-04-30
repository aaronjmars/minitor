import { z } from "zod";
import { Hash } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
});

export type FCConfig = z.infer<typeof schema>;

export interface FCMeta {
  likes: number;
  recasts: number;
  replies: number;
  followers: number;
  powerBadge: boolean;
  channelId?: string;
  channelName?: string;
  fid?: number;
  isFarcaster: true;
}

export const meta: PluginMeta<FCConfig, FCMeta> = {
  id: "farcaster",
  label: "Farcaster",
  description: "Search Farcaster casts. Use @handle or from:handle for a user's latest posts.",
  icon: Hash,
  accent: "#7c65c1",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const q = c.query.trim();
    return q ? `Farcaster · ${q}` : "Farcaster · Search";
  },
  // No strict env requirement — falls back to Neynar's public NEYNAR_API_DOCS
  // demo key when NEYNAR_API_KEY is unset (rate-limited but functional).
  capabilities: { paginated: true },
};
