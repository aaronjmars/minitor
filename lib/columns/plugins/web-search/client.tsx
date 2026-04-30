"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkItem } from "@/lib/columns/shared/link-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type WebSearchConfig, type WebSearchMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<WebSearchConfig>) {
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

function ItemRenderer({ item }: ItemRendererProps<WebSearchMeta>) {
  return (
    <LinkItem
      item={item}
      badgeLabel="Web"
      badgeClass="bg-[color:var(--chart-1)]/40 text-foreground ring-1 ring-black/5"
    />
  );
}

export const column = defineColumnUI<WebSearchConfig, WebSearchMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
