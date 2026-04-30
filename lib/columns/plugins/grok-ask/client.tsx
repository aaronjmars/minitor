"use client";

import { ExternalLink, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RelativeTime } from "@/components/relative-time";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type GrokAskConfig, type GrokAskMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<GrokAskConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="grok-prompt">Prompt</Label>
      <div className="rounded-2xl border border-border bg-surface/60 p-2 transition-colors focus-within:border-foreground/30">
        <Textarea
          id="grok-prompt"
          rows={4}
          placeholder="What's the latest reaction to GPT-5.5? What are people saying about Cursor vs Claude Code this week?"
          value={value.prompt}
          onChange={(e) => onChange({ prompt: e.target.value })}
          className="min-h-0 resize-none border-0 bg-transparent p-1 text-[14px] leading-snug shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Grok will search X and the web, then answer each refresh. One answer per
        refresh; older answers stack below.
      </p>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<GrokAskMeta>) {
  const m = item.meta;
  const citations = m?.citations ?? [];
  const promptStr = m?.prompt ?? null;

  return (
    <article className="border-b border-border px-3.5 py-3.5">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium ring-1 ring-black/5"
          style={{ backgroundColor: "rgba(192, 133, 50, 0.18)", color: "#7a5320" }}
        >
          <Sparkles className="size-3" />
          Grok
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">
          <RelativeTime date={item.createdAt} addSuffix />
        </span>
      </div>

      {promptStr && (
        <p
          className="mt-1.5 text-[11.5px] italic text-muted-foreground line-clamp-2"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          “{promptStr}”
        </p>
      )}

      <p
        className="mt-2 font-serif text-[15.5px] leading-[1.45] text-foreground whitespace-pre-wrap break-words"
        style={{ fontFeatureSettings: '"cswh" 1' }}
      >
        {item.content}
      </p>

      {citations.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {citations.slice(0, 6).map((url) => {
            let host = url;
            try {
              host = new URL(url).hostname.replace(/^www\./, "");
            } catch {}
            return (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/50 px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-[oklab(0.263084_-0.00230259_0.0124794_/_0.22)] hover:text-[color:var(--brand-hover)]"
              >
                <ExternalLink className="size-2.5" />
                <span className="max-w-[140px] truncate">{host}</span>
              </a>
            );
          })}
        </div>
      )}
    </article>
  );
}

export const column = defineColumnUI<GrokAskConfig, GrokAskMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
