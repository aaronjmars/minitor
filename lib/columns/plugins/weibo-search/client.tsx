"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
} from "@/lib/columns/types";
import { meta, type WeiboSearchConfig, type WeiboSearchMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<WeiboSearchConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="weibo-q">Keyword or URL</Label>
      <Input
        id="weibo-q"
        placeholder="anthropic, claude, https://example.com..."
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Searches Weibo posts (微博) mentioning your query. The mobile search
        endpoint is keyless but may return empty results from non-CN egress
        IPs.
      </p>
    </div>
  );
}

export const column = defineColumnUI<WeiboSearchConfig, WeiboSearchMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer: TweetItem,
});
