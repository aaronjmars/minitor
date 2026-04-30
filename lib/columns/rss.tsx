"use client";

import { Rss } from "lucide-react";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkItem } from "@/lib/columns/shared/link-renderer";

type Config = { url: string };
const DEFAULT: Config = { url: "" };

function ConfigForm({
  value,
  onChange,
}: {
  value: Config;
  onChange: (v: Config) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="rss-url">Feed URL</Label>
      <Input
        id="rss-url"
        placeholder="https://news.ycombinator.com/rss"
        value={value.url}
        onChange={(e) => onChange({ url: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Any RSS or Atom feed. Works with blogs, Substacks, YouTube channel feeds,
        Google Alerts feeds, RSSHub URLs, etc.
      </p>
    </div>
  );
}

function Renderer({ item }: { item: FeedItem }) {
  return (
    <LinkItem
      item={item}
      badgeLabel="RSS"
      badgeClass="bg-[color:var(--chart-3)]/40 text-foreground ring-1 ring-black/5"
    />
  );
}

function defaultTitle(c: Config): string {
  const url = c.url.trim();
  if (!url) return "RSS";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return `RSS · ${host}`;
  } catch {
    return "RSS";
  }
}

export const rssType: ColumnType<Config> = {
  id: "rss",
  label: "RSS · Atom",
  description: "Any RSS or Atom feed — blogs, Substacks, RSSHub, alerts.",
  icon: Rss,
  accent: "#dfa88f",
  defaultConfig: DEFAULT,
  defaultTitle,
  ConfigForm,
  ItemRenderer: Renderer,
};
