"use client";

import { Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RelativeTime } from "@/components/relative-time";
import {
  PLATFORM_LABELS,
  type NewsNowPlatform,
} from "@/lib/integrations/newsnow";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import {
  meta,
  PLATFORM_ORDER,
  type NewsNowConfig,
  type NewsNowMeta,
} from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<NewsNowConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label>Platform</Label>
      <Select
        value={value.platform}
        onValueChange={(v) => onChange({ platform: v as NewsNowPlatform })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLATFORM_ORDER.map((p) => (
            <SelectItem key={p} value={p}>
              {PLATFORM_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Hot trending boards across the major Chinese internet platforms.
        Aggregated via the NewsNow public API (no key needed).
      </p>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<NewsNowMeta>) {
  const m = item.meta;
  const rank = m?.rank;
  const platformLabel = m?.platformLabel ?? item.author.name;
  const info = m?.info ?? "";

  const [title, ...rest] = item.content.split("\n\n");
  const description = rest.join("\n\n").trim();

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex items-start gap-2.5">
        {rank !== undefined && (
          <span
            className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums ring-1 ring-black/5"
            style={{
              backgroundColor:
                rank <= 3 ? "rgba(220, 38, 38, 0.18)" : "rgba(0, 0, 0, 0.05)",
              color: rank <= 3 ? "#dc2626" : "var(--muted-foreground)",
            }}
          >
            {rank}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
              style={{ backgroundColor: "rgba(220, 38, 38, 0.12)" }}
            >
              <Zap
                className="size-3"
                style={{ color: "#dc2626" }}
                strokeWidth={2.5}
              />
              {platformLabel}
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span className="tabular-nums">
              <RelativeTime date={item.createdAt} addSuffix />
            </span>
          </div>
          <h3
            className="mt-1 font-serif text-[16px] leading-[1.3] text-foreground break-words transition-colors group-hover/item:text-[color:var(--brand-hover)]"
            style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
          >
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground break-words">
              {description}
            </p>
          )}
          {info && !description && (
            <p className="mt-1 text-[11.5px] tabular-nums text-muted-foreground">
              {info}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export const column = defineColumnUI<NewsNowConfig, NewsNowMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
