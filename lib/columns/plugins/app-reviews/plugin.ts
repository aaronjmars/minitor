import { z } from "zod";
import { Star } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  platform: z.enum(["app-store", "google-play", "both"]).default("app-store"),
  appId: z.string().default(""),
  country: z.string().default("us"),
});

export type AppReviewsConfig = z.infer<typeof schema>;

export interface AppReviewsItemMeta {
  rating: number;
  version?: string;
  country: string;
  platform: "app-store" | "google-play";
  title?: string;
  thumbsUp?: number;
}

export const meta: PluginMeta<AppReviewsConfig, AppReviewsItemMeta> = {
  id: "app-reviews",
  label: "App reviews",
  description: "Latest App Store and/or Google Play reviews for an app.",
  icon: Star,
  accent: "#f5a623",
  category: "other",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const id = c.appId.trim();
    if (!id) return "App reviews";
    const label =
      c.platform === "app-store"
        ? "App Store"
        : c.platform === "google-play"
          ? "Google Play"
          : "Reviews";
    return `${label} · ${id}`;
  },
  capabilities: {
    rateLimitHint:
      "App Store uses Apple's public RSS; Google Play uses the public store endpoint. No keys required.",
  },
};
