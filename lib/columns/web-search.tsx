"use client";

import { Globe } from "lucide-react";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkItem } from "@/lib/columns/shared/link-renderer";

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
      <Label htmlFor="web-q">Query</Label>
      <Input
        id="web-q"
        placeholder='"claude code" release notes'
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Searches the web for the latest pages matching your query.
      </p>
    </div>
  );
}

async function fetchItems(config: Config): Promise<FeedItem[]> {
  const res = await fetch("/api/columns/web-search", {
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

function Renderer({ item }: { item: FeedItem }) {
  return (
    <LinkItem
      item={item}
      badgeLabel="Web"
      badgeClass="bg-[color:var(--chart-1)]/40 text-foreground ring-1 ring-black/5"
    />
  );
}

export const webSearchType: ColumnType<Config> = {
  id: "web-search",
  label: "Web · Search",
  description: "Latest web results matching a query.",
  icon: Globe,
  accent: "#9fbbe0",
  defaultConfig: DEFAULT,
  defaultTitle: (c) => (c.query?.trim() ? `Web · ${c.query}` : "Web · Search"),
  ConfigForm,
  ItemRenderer: Renderer,
  fetch: fetchItems,
};
