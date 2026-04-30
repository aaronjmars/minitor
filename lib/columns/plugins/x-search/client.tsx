"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
} from "@/lib/columns/types";
import { meta, type XSearchConfig, type TweetMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<XSearchConfig>) {
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

export const column = defineColumnUI<XSearchConfig, TweetMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer: TweetItem,
});
