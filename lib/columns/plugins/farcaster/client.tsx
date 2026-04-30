"use client";

import { Heart, MessageCircle, Repeat2, BadgeCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RelativeTime } from "@/components/relative-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type FCConfig, type FCMeta } from "./plugin";

function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000)
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function ConfigForm({ value, onChange }: ConfigFormProps<FCConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Mode</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as FCConfig["mode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="search">Search</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value.mode === "user" && (
        <div className="grid gap-1.5">
          <Label htmlFor="fc-user">Username or FID</Label>
          <Input
            id="fc-user"
            placeholder="dwr or 3"
            value={value.username}
            onChange={(e) => onChange({ ...value, username: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Latest casts from a Farcaster user (via Neynar). Use the{" "}
            <code>username</code> without the <code>@</code> prefix, or the
            numeric <code>fid</code>.
          </p>
        </div>
      )}
      {value.mode === "search" && (
        <div className="grid gap-1.5">
          <Label htmlFor="fc-q">Query</Label>
          <Input
            id="fc-q"
            placeholder="claude, base, agents..."
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Search Farcaster casts. Falls back to Neynar&apos;s public demo
            key when your free tier returns 402.
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<FCMeta>) {
  const m = item.meta;
  const likes = m?.likes ?? 0;
  const recasts = m?.recasts ?? 0;
  const replies = m?.replies ?? 0;
  const channelId = m?.channelId ?? "";
  const powerBadge = m?.powerBadge === true;
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
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[12px] leading-tight">
            <span className="truncate font-medium text-foreground">
              {display}
            </span>
            {powerBadge && (
              <BadgeCheck
                className="size-3.5"
                style={{ color: "#7c65c1" }}
                strokeWidth={2.5}
              />
            )}
            <span className="truncate text-muted-foreground">@{handle}</span>
            {channelId && (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span className="truncate text-foreground/70">
                  /{channelId}
                </span>
              </>
            )}
            <span className="text-muted-foreground/50">·</span>
            <span className="tabular-nums text-muted-foreground">
              <RelativeTime date={item.createdAt} compact />
            </span>
          </div>
          <p
            className="mt-1 font-serif text-[15px] leading-[1.35] text-foreground break-words whitespace-pre-line"
            style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
          >
            {item.content}
          </p>
          <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              <span className="tabular-nums">{compact(replies)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="size-3.5" />
              <span className="tabular-nums">{compact(recasts)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              <span className="tabular-nums">{compact(likes)}</span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export const column = defineColumnUI<FCConfig, FCMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
