"use client";

import { Search } from "lucide-react";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";

type Config = { query: string };
const DEFAULT: Config = { query: "" };

function ConfigForm({
  value,
  onChange,
}: {
  value: Config;
  onChange: (v: Config) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="x-search-q">Search query</Label>
      <Input
        id="x-search-q"
        placeholder='#ai, "claude code", $BTC, from:vercel…'
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Any X search operators work: keywords, phrases in quotes, hashtags,
        cashtags, <code>from:</code>, <code>to:</code>, <code>min_faves:</code>.
      </p>
    </div>
  );
}

async function fetchItems(config: Config): Promise<FeedItem[]> {
  const res = await fetch("/api/columns/x-search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ config }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { items: FeedItem[] };
  return json.items;
}

export const xSearchType: ColumnType<Config> = {
  id: "x-search",
  label: "X · Search",
  description: "Monitor X posts matching a keyword, hashtag, or query operator.",
  icon: Search,
  accent: "#1d9bf0",
  defaultConfig: DEFAULT,
  defaultTitle: (c) => (c.query?.trim() ? `X · ${c.query}` : "X · Search"),
  ConfigForm,
  ItemRenderer: TweetItem,
  fetch: fetchItems,
};
