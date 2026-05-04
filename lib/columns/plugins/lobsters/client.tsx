"use client";

import { ArrowBigUp, MessageSquareText } from "lucide-react";
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
import { formatCompactCount } from "@/lib/utils";
import { meta, type LobstersConfig, type LobstersMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<LobstersConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Mode</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as LobstersConfig["mode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hottest">Hottest</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="active">Active discussions</SelectItem>
            <SelectItem value="tag">By tag…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.mode === "tag" && (
        <div className="grid gap-1.5">
          <Label htmlFor="lob-tag">Tag</Label>
          <Input
            id="lob-tag"
            placeholder="rust, ai, programming…"
            value={value.tag}
            onChange={(e) => onChange({ ...value, tag: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            One tag, or several comma-separated. See{" "}
            <a
              href="https://lobste.rs/tags"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              lobste.rs/tags
            </a>{" "}
            for the full list.
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<LobstersMeta>) {
  const m = item.meta;
  const score = m?.score ?? 0;
  const comments = m?.comments ?? 0;
  const commentsUrl = m?.commentsUrl ?? item.url;
  const tags = m?.tags ?? [];

  const [title, ...rest] = item.content.split("\n\n");
  const snippet = rest.join("\n\n").trim();

  return (
    <div className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
          style={{ backgroundColor: "rgba(172, 19, 13, 0.16)" }}
        >
          <span
            className="grid size-3.5 place-items-center rounded-[3px] text-[9px] font-bold leading-none text-white"
            style={{ backgroundColor: "#ac130d" }}
          >
            L
          </span>
          Lobsters
        </span>
        <span className="text-muted-foreground/80">
          by{" "}
          <span className="text-foreground/90">
            {item.author.handle ?? item.author.name}
          </span>
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">
          <RelativeTime date={item.createdAt} addSuffix />
        </span>
      </div>
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="mt-1 block"
      >
        <h3
          className="font-serif text-[16px] leading-[1.3] text-foreground break-words transition-colors group-hover/item:text-[color:var(--brand)]"
          style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
        >
          {title}
        </h3>
      </a>
      {snippet && (
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-muted-foreground break-words">
          {snippet}
        </p>
      )}
      {tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-sm px-1 py-0.5 text-[10px] text-muted-foreground ring-1 ring-border/60"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <ArrowBigUp className="size-4" />
          <span className="tabular-nums">{formatCompactCount(score)}</span>
        </span>
        <a
          href={commentsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 transition-colors hover:text-foreground"
        >
          <MessageSquareText className="size-3.5" />
          <span className="tabular-nums">{formatCompactCount(comments)}</span>
        </a>
      </div>
    </div>
  );
}

export const column = defineColumnUI<LobstersConfig, LobstersMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
