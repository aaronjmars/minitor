"use client";

import { Newspaper } from "lucide-react";
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
      <Label htmlFor="news-q">Topic</Label>
      <Input
        id="news-q"
        placeholder="AI regulation, startup funding, elections…"
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Latest news articles from major publications matching the topic.
      </p>
    </div>
  );
}

function Renderer({ item }: { item: FeedItem }) {
  return (
    <LinkItem
      item={item}
      badgeLabel="News"
      badgeClass="bg-[color:var(--chart-4)]/50 text-foreground ring-1 ring-black/5"
    />
  );
}

export const newsSearchType: ColumnType<Config> = {
  id: "news-search",
  label: "News · Topic",
  description: "Latest news articles on a topic.",
  icon: Newspaper,
  accent: "#c08532",
  defaultConfig: DEFAULT,
  defaultTitle: (c) => (c.query?.trim() ? `News · ${c.query}` : "News · Topic"),
  ConfigForm,
  ItemRenderer: Renderer,
};
