"use client";

import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { FeedItem } from "@/lib/columns/types";
import { RelativeTime } from "@/components/relative-time";

export function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000) {
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function TweetItem({ item }: { item: FeedItem }) {
  const m = item.meta ?? {};
  const likes = typeof m.likes === "number" ? m.likes : 0;
  const retweets = typeof m.retweets === "number" ? m.retweets : 0;
  const replies = typeof m.replies === "number" ? m.replies : 0;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex gap-2.5">
        {item.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.author.avatarUrl}
            alt={item.author.name}
            className="size-10 shrink-0 rounded-full bg-muted ring-1 ring-border"
          />
        ) : (
          <div className="size-10 shrink-0 rounded-full bg-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1 text-[13px]">
            <span
              className="truncate font-medium text-foreground"
              style={{ letterSpacing: "-0.005em" }}
            >
              {item.author.name}
            </span>
            {item.author.handle && (
              <span className="truncate text-muted-foreground">
                @{item.author.handle}
              </span>
            )}
            <span className="text-muted-foreground/50">·</span>
            <span className="shrink-0 text-muted-foreground tabular-nums">
              <RelativeTime date={item.createdAt} compact />
            </span>
          </div>
          <p
            className="mt-1 font-serif text-[16px] leading-[1.4] text-foreground break-words whitespace-pre-wrap"
            style={{ fontFeatureSettings: '"cswh" 1' }}
          >
            {item.content}
          </p>
          <div className="mt-2.5 flex items-center gap-5 text-[11.5px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3.5" />
              <span className="tabular-nums">{compact(replies)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 className="size-3.5" />
              <span className="tabular-nums">{compact(retweets)}</span>
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
