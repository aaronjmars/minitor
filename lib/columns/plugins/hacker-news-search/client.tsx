"use client";

import { ArrowBigUp, MessageSquareText, MessageCircle } from "lucide-react";
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
import { meta, type HNSearchConfig, type HNSearchMeta } from "./plugin";

function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000)
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function ConfigForm({ value, onChange }: ConfigFormProps<HNSearchConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="hns-q">Keyword or URL</Label>
        <Input
          id="hns-q"
          placeholder="anthropic.com, claude code, https://..."
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          URLs are matched against the story link; everything else searches
          full text.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label>Scope</Label>
        <Select
          value={value.scope}
          onValueChange={(v) =>
            onChange({ ...value, scope: v as HNSearchConfig["scope"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Stories &amp; comments</SelectItem>
            <SelectItem value="stories">Stories only</SelectItem>
            <SelectItem value="comments">Comments only</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label>Sort</Label>
        <Select
          value={value.sort}
          onValueChange={(v) =>
            onChange({ ...value, sort: v as HNSearchConfig["sort"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Newest first</SelectItem>
            <SelectItem value="relevance">Most relevant</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<HNSearchMeta>) {
  const m = item.meta;
  const kind = m?.kind ?? "story";
  const points = m?.points ?? 0;
  const comments = m?.comments ?? 0;
  const commentsUrl = m?.commentsUrl ?? item.url;

  const isComment = kind === "comment";
  const headline = isComment
    ? (m?.storyTitle ?? "(comment)")
    : item.content.split("\n\n")[0];
  const body = isComment
    ? item.content
    : item.content.split("\n\n").slice(1).join("\n\n").trim();

  return (
    <div className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
          style={{ backgroundColor: "rgba(255, 102, 0, 0.16)" }}
        >
          <span
            className="grid size-3.5 place-items-center rounded-[3px] text-[9px] font-bold leading-none text-white"
            style={{ backgroundColor: "#ff6600" }}
          >
            Y
          </span>
          {isComment ? "HN comment" : "HN story"}
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
          {isComment ? `Re: ${headline}` : headline}
        </h3>
      </a>
      {body && (
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-muted-foreground break-words">
          {body}
        </p>
      )}
      <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
        {isComment ? (
          <a
            href={commentsUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-3.5" />
            <span>View thread</span>
          </a>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <ArrowBigUp className="size-4" />
              <span className="tabular-nums">{compact(points)}</span>
            </span>
            <a
              href={commentsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <MessageSquareText className="size-3.5" />
              <span className="tabular-nums">{compact(comments)}</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export const column = defineColumnUI<HNSearchConfig, HNSearchMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
