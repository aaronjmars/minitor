import { z } from "zod";
import { PlaySquare } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { AppReviewMeta } from "@/lib/integrations/app-reviews";

export const schema = z.object({
  appId: z.string().default(""),
  country: z.string().default("us"),
});

export type PlayReviewsConfig = z.infer<typeof schema>;

export type PlayReviewsItemMeta = AppReviewMeta;

export const meta: PluginMeta<PlayReviewsConfig, PlayReviewsItemMeta> = {
  id: "play-reviews",
  label: "Google Play reviews",
  description: "Latest Google Play (Android) reviews for an app, via the public store endpoint.",
  icon: PlaySquare,
  accent: "#34a853",
  category: "other",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const id = c.appId.trim();
    return id ? `Play · ${id}` : "Google Play reviews";
  },
  capabilities: {
    paginated: true,
    rateLimitHint: "Public Google Play store endpoint — no key required.",
  },
};
