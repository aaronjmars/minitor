"use client";

import { ExternalLink } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type BingConfig, type BingMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<BingConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="bing-q">Search query</Label>
      <Input
        id="bing-q"
        placeholder="claude code, &quot;prediction markets&quot;, hyperstition…"
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Backed by Bing News RSS — keyless. Quotes pin exact phrases.
      </p>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<BingMeta>) {
  const source = item.meta?.source ?? "";
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
          style={{ backgroundColor: "rgba(91, 141, 239, 0.18)" }}
        >
          Web
        </span>
        {source && <span className="truncate">{source}</span>}
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">
          <RelativeTime date={item.createdAt} addSuffix />
        </span>
        <ExternalLink className="ml-auto size-3 text-muted-foreground/50" />
      </div>
      <h3
        className="mt-1 font-serif text-[16px] leading-[1.3] text-foreground break-words transition-colors group-hover/item:text-[color:var(--brand-hover)]"
        style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
      >
        {item.content.split("\n\n")[0]}
      </h3>
      {item.content.includes("\n\n") && (
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground break-words">
          {item.content.split("\n\n").slice(1).join("\n\n")}
        </p>
      )}
    </a>
  );
}

export const column = defineColumnUI<BingConfig, BingMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
