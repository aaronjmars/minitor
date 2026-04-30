"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
} from "@/lib/columns/types";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";
import { meta, type XMentionsConfig } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<XMentionsConfig>) {
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

export const column = defineColumnUI<XMentionsConfig, TweetMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer: TweetItem,
});
