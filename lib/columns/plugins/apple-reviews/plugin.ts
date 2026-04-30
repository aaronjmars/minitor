import { z } from "zod";
import { Apple } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { AppReviewMeta } from "@/lib/integrations/app-reviews";

export const schema = z.object({
  appId: z.string().default(""),
  country: z.string().default("us"),
});

export type AppleReviewsConfig = z.infer<typeof schema>;

export type AppleReviewsItemMeta = AppReviewMeta;

export const meta: PluginMeta<AppleReviewsConfig, AppleReviewsItemMeta> = {
  id: "apple-reviews",
  label: "Apple reviews",
  description: "Latest App Store (iOS) reviews for an app, via Apple's public iTunes RSS.",
  icon: Apple,
  accent: "#007aff",
  category: "other",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const id = c.appId.trim();
    return id ? `App Store · ${id}` : "App Store reviews";
  },
  capabilities: {
    paginated: true,
    rateLimitHint: "Public iTunes RSS — no key required.",
  },
};
