"use client";

import { UserRound } from "lucide-react";
import type { ColumnType } from "@/lib/columns/types";
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

export const xUserType: ColumnType<Config> = {
  id: "x-user",
  label: "X · User timeline",
  description: "Latest posts from a specific X user.",
  icon: UserRound,
  accent: "#1d9bf0",
  defaultConfig: DEFAULT,
  defaultTitle: (c) => (c.handle?.trim() ? `@${c.handle.replace(/^@/, "")}` : "X · User"),
  ConfigForm,
  ItemRenderer: TweetItem,
};
