import { z } from "zod";
import { Cloud } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  mode: z.enum(["search", "author"]).default("search"),
  query: z.string().default(""),
  handle: z.string().default(""),
});

export type BlueskyConfig = z.infer<typeof schema>;

export interface BlueskyMeta {
  likes: number;
  reposts: number;
  replies: number;
  postUrl: string;
}

export const meta: PluginMeta<BlueskyConfig, BlueskyMeta> = {
  id: "bluesky",
  label: "Bluesky",
  description:
    "Latest posts from Bluesky — keyword search or by author handle. Keyless via the public AppView.",
  icon: Cloud,
  accent: "#0085ff",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    if (c.mode === "author") {
      const h = c.handle.trim().replace(/^@/, "");
      return h ? `Bluesky · @${h}` : "Bluesky · Author";
    }
    const q = c.query.trim();
    return q ? `Bluesky · ${q}` : "Bluesky · Search";
  },
  capabilities: { paginated: true },
};
