"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkItem } from "@/lib/columns/shared/link-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type RednoteConfig, type RednoteMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<RednoteConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="rednote-q">Keyword or URL</Label>
      <Input
        id="rednote-q"
        placeholder="brand name, hashtag, or xiaohongshu.com URL"
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Searches Xiaohongshu (小红书) via Grok web search. Coverage is
        best-effort — xhs blocks anonymous scraping, so only pages indexed by
        public crawlers and shared xhslink.com URLs surface.
      </p>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<RednoteMeta>) {
  return (
    <LinkItem
      item={item}
      badgeLabel="Rednote"
      badgeClass="bg-[#ff2442]/15 text-foreground ring-1 ring-black/5"
    />
  );
}

export const column = defineColumnUI<RednoteConfig, RednoteMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
