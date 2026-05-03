"use client";

import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { formatCompactCount } from "@/lib/utils";
import { meta, type MastodonConfig, type MastodonMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<MastodonConfig>) {
  const isAuthor = value.mode === "author";
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="mast-instance">Instance</Label>
        <Input
          id="mast-instance"
          placeholder="mastodon.social"
          value={value.instance}
          onChange={(e) => onChange({ ...value, instance: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Server to query (e.g. <code>mastodon.social</code>,{" "}
          <code>fosstodon.org</code>, <code>hachyderm.io</code>). For author
          mode you can also use the <code>user@server</code> form in the
          handle field and we&apos;ll route to that server automatically.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label>Mode</Label>
        <div className="flex gap-1.5">
          <button
            type="button"
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
              value.mode === "hashtag"
                ? "border-foreground bg-foreground/5"
                : "border-border hover:bg-surface/60"
            }`}
            onClick={() => onChange({ ...value, mode: "hashtag" })}
          >
            Hashtag
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
              value.mode === "author"
                ? "border-foreground bg-foreground/5"
                : "border-border hover:bg-surface/60"
            }`}
            onClick={() => onChange({ ...value, mode: "author" })}
          >
            Author
          </button>
        </div>
      </div>
      {isAuthor ? (
        <div className="grid gap-1.5">
          <Label htmlFor="mast-handle">Handle</Label>
          <Input
            id="mast-handle"
            placeholder="gargron, user@fosstodon.org…"
            value={value.handle}
            onChange={(e) => onChange({ ...value, handle: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Bare username uses the configured instance. Use{" "}
            <code>user@server</code> to follow someone on a different server.
          </p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="mast-query">Hashtag</Label>
          <Input
            id="mast-query"
            placeholder="opensource, photography, claudecode…"
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Tag name with or without the <code>#</code>. Hashtag timelines are
            keyless on every public Mastodon instance.
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<MastodonMeta>) {
  const m = item.meta;
  const favourites = m?.favourites ?? 0;
  const reblogs = m?.reblogs ?? 0;
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
          <p
            className="mt-1 font-serif text-[16px] leading-[1.4] text-foreground break-words whitespace-pre-line"
            style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
          >
            {item.content}
          </p>
          <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              <span className="tabular-nums">{formatCompactCount(replies)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="size-3.5" />
              <span className="tabular-nums">{formatCompactCount(reblogs)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="size-3.5" />
              <span className="tabular-nums">
                {formatCompactCount(favourites)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

export const column = defineColumnUI<MastodonConfig, MastodonMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
