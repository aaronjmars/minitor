"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkItem } from "@/lib/columns/shared/link-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type TikTokConfig, type TikTokMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<TikTokConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="tt-q">Keyword or URL</Label>
      <Input
        id="tt-q"
        placeholder='"claude code", anthropic.com, https://...'
        value={value.query}
        onChange={(e) => onChange({ query: e.target.value })}
      />
      <p className="text-xs text-muted-foreground">
        Searches TikTok via Grok web search (<code>site:tiktok.com</code>).
        Requires <code>XAI_API_KEY</code>.
      </p>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<TikTokMeta>) {
  return (
    <LinkItem
      item={item}
      badgeLabel="TikTok"
      badgeClass="bg-[#fe2c55]/15 text-foreground ring-1 ring-black/5"
    />
  );
}

export const column = defineColumnUI<TikTokConfig, TikTokMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
