import { z } from "zod";
import { Sparkles } from "lucide-react";
import type { PluginMeta } from "@/lib/columns/types";

export const schema = z.object({
  prompt: z.string().default(""),
});

export type GrokAskConfig = z.infer<typeof schema>;

export interface GrokAskMeta {
  isGrok: true;
  prompt: string;
  citations: string[];
}

export const meta: PluginMeta<GrokAskConfig, GrokAskMeta> = {
  id: "grok-ask",
  label: "Grok · Ask",
  description:
    "Ask Grok a question with live X + web search. Fresh answer each refresh.",
  icon: Sparkles,
  accent: "#c08532",
  category: "ai",
  schema,
  defaultConfig: schema.parse({}),
  defaultTitle: (c) =>
    c.prompt.trim()
      ? `Ask · ${c.prompt.slice(0, 32)}${c.prompt.length > 32 ? "…" : ""}`
      : "Grok · Ask",
  capabilities: { requiresEnv: ["XAI_API_KEY"] },
};
