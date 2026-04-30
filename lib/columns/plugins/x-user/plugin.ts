import { z } from "zod";
import { UserRound } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";

export const schema = z.object({
  handle: z.string().default(""),
});

export type XUserConfig = z.infer<typeof schema>;

export const meta: PluginMeta<XUserConfig, TweetMeta> = {
  id: "x-user",
  label: "X · User timeline",
  description: "Latest posts from a specific X user.",
  icon: UserRound,
  accent: "#1d9bf0",
  category: "social",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.handle.trim() ? `@${c.handle.replace(/^@/, "")}` : "X · User",
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
