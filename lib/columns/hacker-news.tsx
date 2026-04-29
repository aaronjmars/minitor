"use client";

import { ArrowBigUp, Flame, MessageSquareText } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type HNConfig = {
  mode: "top" | "new" | "ask" | "show" | "query";
  query: string;
};

const DEFAULT: HNConfig = { mode: "top", query: "" };

const MODE_LABELS: Record<HNConfig["mode"], string> = {
  top: "Front page",
  new: "Newest",
  ask: "Ask HN",
  show: "Show HN",
  query: "Search",
};

function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000)
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function ConfigForm({
  value,
  onChange,
}: {
  value: HNConfig;
  onChange: (v: HNConfig) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Mode</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as HNConfig["mode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Front page</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="ask">Ask HN</SelectItem>
            <SelectItem value="show">Show HN</SelectItem>
            <SelectItem value="query">Search…</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.mode === "query" && (
        <div className="grid gap-1.5">
          <Label htmlFor="hn-q">Query</Label>
          <Input
            id="hn-q"
            placeholder="rust, llm, anthropic..."
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Searches HN stories via Algolia.
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRenderer({ item }: { item: FeedItem }) {
  const m = item.meta ?? {};
  const points = typeof m.points === "number" ? m.points : 0;
  const comments = typeof m.comments === "number" ? m.comments : 0;
  const commentsUrl =
    typeof m.commentsUrl === "string" ? m.commentsUrl : item.url;

  const [title, ...rest] = item.content.split("\n\n");
  const snippet = rest.join("\n\n").trim();

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
          HN
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
      <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
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
      </div>
    </div>
  );
}

async function fetchPage(
  config: HNConfig,
  cursor?: string,
): Promise<{ items: FeedItem[]; nextCursor?: string }> {
  const res = await fetch("/api/columns/hacker-news", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      config,
      ...(cursor !== undefined ? { op: "loadMore", cursor } : {}),
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as { items: FeedItem[]; nextCursor?: string };
}

async function fetchItems(config: HNConfig): Promise<FeedItem[]> {
  const { items } = await fetchPage(config);
  return items;
}

export const hackerNewsType: ColumnType<HNConfig> = {
  id: "hacker-news",
  label: "Hacker News",
  description: "Front page, newest, Ask/Show HN, or search via Algolia.",
  icon: Flame,
  accent: "#ff6600",
  defaultConfig: DEFAULT,
  defaultTitle: (c) =>
    c.mode === "query" && c.query.trim()
      ? `HN · ${c.query.trim()}`
      : `HN · ${MODE_LABELS[c.mode]}`,
  ConfigForm,
  ItemRenderer,
  fetch: fetchItems,
  fetchPage,
};
