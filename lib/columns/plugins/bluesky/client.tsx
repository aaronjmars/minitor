"use client";

import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { formatCompactCount } from "@/lib/utils";
import { meta, type BlueskyConfig, type BlueskyMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<BlueskyConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Mode</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as BlueskyConfig["mode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="search">Search keyword</SelectItem>
            <SelectItem value="author">By author</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.mode === "search" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="bsky-q">Query</Label>
          <Input
            id="bsky-q"
            placeholder="anthropic, claude code, base…"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Latest posts on Bluesky matching the keyword. Sorted newest first.
          </p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="bsky-h">Author handle</Label>
          <Input
            id="bsky-h"
            placeholder="bsky.app, jay.bsky.team, dril.bsky.social"
            value={value.handle}
            onChange={(e) => onChange({ ...value, handle: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Bare usernames default to <code>.bsky.social</code> — e.g.{" "}
            <code>jay</code> resolves to <code>jay.bsky.social</code>. Use the
            full handle for custom domains.
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<BlueskyMeta>) {
  const m = item.meta;
  const likes = m?.likes ?? 0;
  const reposts = m?.reposts ?? 0;
  const replies = m?.replies ?? 0;
  const handle = item.author.handle ?? item.author.name;
  const display = item.author.name;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex items-start gap-2.5">
        <Avatar className="size-9 shrink-0 ring-1 ring-black/5">
          <AvatarImage src={item.author.avatarUrl} alt={display} />
          <AvatarFallback>{display.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[13px] leading-tight">
            <span className="truncate font-medium text-foreground">
              {display}
            </span>
            <span className="truncate text-muted-foreground">@{handle}</span>
            <span className="text-muted-foreground/50">·</span>
            <span className="tabular-nums text-muted-foreground">
              <RelativeTime date={item.createdAt} compact />
            </span>
          </div>
          {item.content && (
            <p
              className="mt-1 font-serif text-[16px] leading-[1.4] text-foreground break-words whitespace-pre-line"
              style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
            >
              {item.content}
            </p>
          )}
          <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              <span className="tabular-nums">{formatCompactCount(replies)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="size-3.5" />
              <span className="tabular-nums">{formatCompactCount(reposts)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              <span className="tabular-nums">{formatCompactCount(likes)}</span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export const column = defineColumnUI<BlueskyConfig, BlueskyMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
