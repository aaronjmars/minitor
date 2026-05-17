import { z } from "zod";
import { Rocket } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  mode: z.enum(["today", "topic"]).default("today"),
  topic: z.string().default(""),
});

export type ProductHuntConfig = z.infer<typeof schema>;

export interface ProductHuntMeta {
  source: string;
  feedTitle?: string;
  slug?: string;
  productName?: string;
  tagline?: string;
}

export const meta: PluginMeta<ProductHuntConfig, ProductHuntMeta> = {
  id: "producthunt",
  label: "Product Hunt",
  description:
    "Today's Product Hunt launches — the full daily slate or an optional keyword filter across name, tagline, and description.",
  icon: Rocket,
  // Product Hunt's brand "Rocket" orange — the colour used on the .com header
  // and the official kit. Distinct from the existing palette: hacker-news
  // flame, substack orange #ff6719 (more muted), devto indigo #3b49df, npm
  // red #CB3837, pypi blue #3776AB, crates #DEA584.
  accent: "#DA552F",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) => {
    const topic = c.topic.trim();
    if (topic) {
      const first = topic
        .split(/[,;\s]+/)
        .map((t) => t.trim())
        .find(Boolean);
      return first ? `PH · ${first}` : "Product Hunt";
    }
    return "Product Hunt";
  },
  capabilities: { paginated: true },
};
