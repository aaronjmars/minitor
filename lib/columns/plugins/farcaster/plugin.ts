import { z } from "zod";
import { Hash } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  mode: z.enum(["user", "search"]).default("user"),
  username: z.string().default(""),
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
  description: "Casts by a user, or search across Farcaster (via Neynar).",
  icon: Hash,
  accent: "#7c65c1",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    if (c.mode === "search") {
      const q = c.query.trim();
      return q ? `Farcaster · ${q}` : "Farcaster · Search";
    }
    const u = c.username.trim().replace(/^@/, "");
    return u ? `Farcaster · @${u}` : "Farcaster · User";
  },
  capabilities: { requiresEnv: ["NEYNAR_API_KEY"] },
};
