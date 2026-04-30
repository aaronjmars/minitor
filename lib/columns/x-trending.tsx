"use client";

import { TrendingUp } from "lucide-react";
import type { ColumnType } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";

type Config = { topic: string };
const DEFAULT: Config = { topic: "" };

function ConfigForm({
  value,
  onChange,
}: {
  value: Config;
  onChange: (v: Config) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="x-trending-t">Topic (optional)</Label>
      <Input
        id="x-trending-t"
        placeholder="AI, crypto, politics, startups…"
        value={value.topic}
        onChange={(e) => onChange({ topic: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Leave blank for global trending. Returns highest-engagement posts from
        the last 24 hours.
      </p>
    </div>
  );
}

export const xTrendingType: ColumnType<Config> = {
  id: "x-trending",
  label: "X · Trending",
  description: "Highest-engagement X posts in the last 24h, optionally filtered by topic.",
  icon: TrendingUp,
  accent: "#1d9bf0",
  defaultConfig: DEFAULT,
  defaultTitle: (c) =>
    c.topic?.trim() ? `Trending · ${c.topic}` : "X · Trending",
  ConfigForm,
  ItemRenderer: TweetItem,
};
