import { z } from "zod";
import { AtSign } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";

export const schema = z.object({
  handle: z.string().default(""),
});

export type XMentionsConfig = z.infer<typeof schema>;

export const meta: PluginMeta<XMentionsConfig, TweetMeta> = {
  id: "x-mentions",
  label: "X · Mentions",
  description: "X posts mentioning a specific @handle.",
  icon: AtSign,
  accent: "#1d9bf0",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.handle.trim()
      ? `@${c.handle.replace(/^@/, "")} mentions`
      : "X · Mentions",
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
