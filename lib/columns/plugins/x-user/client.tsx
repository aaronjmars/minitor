"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TweetItem } from "@/lib/columns/shared/tweet-renderer";
import {
  defineColumnUI,
  type ConfigFormProps,
} from "@/lib/columns/types";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";
import { meta, type XUserConfig } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<XUserConfig>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor="x-user-h">@handle</Label>
      <Input
        id="x-user-h"
        placeholder="elonmusk"
        value={value.handle}
        onChange={(e) =>
          onChange({ handle: e.target.value.replace(/^@/, "") })
        }
      />
      <p className="text-xs text-muted-foreground">
        Monitor posts authored by a specific X user.
      </p>
    </div>
  );
}

export const column = defineColumnUI<XUserConfig, TweetMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer: TweetItem,
});
