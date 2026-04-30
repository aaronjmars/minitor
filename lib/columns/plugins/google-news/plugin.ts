import { z } from "zod";
import { Megaphone } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  query: z.string().default(""),
  hl: z.string().default("en-US"),
  gl: z.string().default("US"),
});

export type GoogleNewsConfig = z.infer<typeof schema>;

export interface GoogleNewsMeta {
  source: string;
  feedTitle?: string;
}

export const meta: PluginMeta<GoogleNewsConfig, GoogleNewsMeta> = {
  id: "google-news",
  label: "Google News",
  description: "Search-driven news from Google's index (no key, RSS-backed).",
  icon: Megaphone,
  accent: "#9fc9a2",
  category: "news",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.query.trim() ? `Google · ${c.query.trim()}` : "Google News",
};
