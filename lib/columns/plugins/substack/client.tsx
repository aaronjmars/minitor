"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { LinkItem } from "@/lib/columns/shared/link-renderer";
import { meta, type SubstackConfig, type SubstackMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<SubstackConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="sub-handles">Publications</Label>
        <Textarea
          id="sub-handles"
          placeholder={"mattyglesias\nslowboring\nstratechery.com"}
          value={value.handles}
          onChange={(e) => onChange({ ...value, handles: e.target.value })}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          One per line, or comma-separated. Use the handle (
          <code>mattyglesias</code>) or full URL (
          <code>slowboring.substack.com</code>). Substack has no global search,
          so we fetch each publication&apos;s RSS and filter locally.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="sub-q">Keyword or URL (optional)</Label>
        <Input
          id="sub-q"
          placeholder='"AI agents", anthropic.com, https://...'
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank to see every recent post. URLs are matched against the
          post link; everything else searches title and summary.
        </p>
      </div>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<SubstackMeta>) {
  return (
    <LinkItem
      item={item}
      badgeLabel="Substack"
      badgeClass="bg-[color:var(--chart-1)]/40 text-foreground ring-1 ring-black/5"
    />
  );
}

export const column = defineColumnUI<SubstackConfig, SubstackMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
