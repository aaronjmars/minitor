"use client";

import { AtSign } from "lucide-react";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";

type Config = { handle: string };
const DEFAULT: Config = { handle: "" };

function ConfigForm({
  value,
  onChange,
}: {
  value: Config;
  onChange: (v: Config) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="x-mentions-h">@handle</Label>
      <Input
        id="x-mentions-h"
        placeholder="yourhandle"
        value={value.handle}
        onChange={(e) =>
          onChange({ handle: e.target.value.replace(/^@/, "") })
        }
      />
      <p className="text-xs text-muted-foreground">
        Posts that mention this @handle (replies, tags, quotes).
      </p>
    </div>
  );
}

async function fetchItems(config: Config): Promise<FeedItem[]> {
  const res = await fetch("/api/columns/x-mentions", {
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

export const xMentionsType: ColumnType<Config> = {
  id: "x-mentions",
  label: "X · Mentions",
  description: "X posts mentioning a specific @handle.",
  icon: AtSign,
  accent: "#1d9bf0",
  defaultConfig: DEFAULT,
  defaultTitle: (c) =>
    c.handle?.trim() ? `@${c.handle.replace(/^@/, "")} mentions` : "X · Mentions",
  ConfigForm,
  ItemRenderer: TweetItem,
  fetch: fetchItems,
};
