"use client";

import { Megaphone } from "lucide-react";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkItem } from "@/lib/columns/shared/link-renderer";

type Config = {
  query: string;
  hl: string;
  gl: string;
};

const DEFAULT: Config = { query: "", hl: "en-US", gl: "US" };

function ConfigForm({
  value,
  onChange,
}: {
  value: Config;
  onChange: (v: Config) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="gnews-q">Query</Label>
        <Input
          id="gnews-q"
          placeholder='"AI agents" -openai'
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Google News search syntax — quotes, <code>-exclude</code>,{" "}
          <code>site:</code>, etc.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="gnews-hl">Language</Label>
          <Input
            id="gnews-hl"
            placeholder="en-US"
            value={value.hl}
            onChange={(e) => onChange({ ...value, hl: e.target.value })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="gnews-gl">Country</Label>
          <Input
            id="gnews-gl"
            placeholder="US"
            value={value.gl}
            onChange={(e) => onChange({ ...value, gl: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function Renderer({ item }: { item: FeedItem }) {
  return (
    <LinkItem
      item={item}
      badgeLabel="News"
      badgeClass="bg-[color:var(--chart-2)]/40 text-foreground ring-1 ring-black/5"
    />
  );
}

async function fetchItems(config: Config): Promise<FeedItem[]> {
  const res = await fetch("/api/columns/google-news", {
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

export const googleNewsType: ColumnType<Config> = {
  id: "google-news",
  label: "Google News",
  description: "Search-driven news from Google's index (no key, RSS-backed).",
  icon: Megaphone,
  accent: "#9fc9a2",
  defaultConfig: DEFAULT,
  defaultTitle: (c) =>
    c.query.trim() ? `Google · ${c.query.trim()}` : "Google News",
  ConfigForm,
  ItemRenderer: Renderer,
  fetch: fetchItems,
};
