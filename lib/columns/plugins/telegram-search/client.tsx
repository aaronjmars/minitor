"use client";

import { Eye, Send } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type TGSearchConfig, type TGSearchMeta } from "./plugin";

function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000)
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function ConfigForm({ value, onChange }: ConfigFormProps<TGSearchConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="tg-channels">Channels</Label>
        <Input
          id="tg-channels"
          placeholder="durov, telegram, @anothername"
          value={value.channels}
          onChange={(e) => onChange({ ...value, channels: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Public channel handles — comma- or space-separated. <code>@</code> and{" "}
          <code>t.me/</code> prefixes are stripped.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="tg-q">Keyword or URL</Label>
        <Input
          id="tg-q"
          placeholder="anthropic.com, claude code, https://..."
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to see every recent post from these channels.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label>Match mode</Label>
        <Select
          value={value.matchMode}
          onValueChange={(v) =>
            onChange({ ...value, matchMode: v as TGSearchConfig["matchMode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keyword">Keyword (auto-detects URLs)</SelectItem>
            <SelectItem value="url">URL / domain only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<TGSearchMeta>) {
  const m = item.meta;
  const channel = m?.channel ?? item.author.handle ?? "";
  const channelTitle = m?.channelTitle ?? item.author.name;
  const views = m?.views;

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
          style={{ backgroundColor: "rgba(34, 158, 217, 0.18)" }}
        >
          <Send className="size-3 text-[#229ED9]" />
          @{channel}
        </span>
        {channelTitle && channelTitle !== channel && (
          <span className="truncate text-foreground/80">{channelTitle}</span>
        )}
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">
          <RelativeTime date={item.createdAt} addSuffix />
        </span>
      </div>
      <p className="mt-1 line-clamp-6 text-[13.5px] leading-snug text-foreground whitespace-pre-line break-words">
        {item.content}
      </p>
      {typeof views === "number" && views > 0 && (
        <div className="mt-2 flex items-center gap-1 text-[11.5px] text-muted-foreground">
          <Eye className="size-3.5" />
          <span className="tabular-nums">{compact(views)}</span>
        </div>
      )}
    </a>
  );
}

export const column = defineColumnUI<TGSearchConfig, TGSearchMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
