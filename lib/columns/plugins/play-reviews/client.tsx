"use client";

import { Star } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import {
  meta,
  type PlayReviewsConfig,
  type PlayReviewsItemMeta,
} from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<PlayReviewsConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="play-reviews-id">Package ID</Label>
        <Input
          id="play-reviews-id"
          placeholder="com.spotify.music"
          value={value.appId}
          onChange={(e) => onChange({ ...value, appId: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Package ID from the URL —{" "}
          <code>play.google.com/store/apps/details?id=</code>
          <code className="text-foreground">com.spotify.music</code>.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="play-reviews-country">Country</Label>
        <Input
          id="play-reviews-country"
          placeholder="us"
          maxLength={2}
          value={value.country}
          onChange={(e) =>
            onChange({ ...value, country: e.target.value.toLowerCase() })
          }
        />
        <p className="text-xs text-muted-foreground">
          Two-letter country code. Defaults to <code>us</code>.
        </p>
      </div>
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`${clamped} of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${i < clamped ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

function ItemRenderer({ item }: ItemRendererProps<PlayReviewsItemMeta>) {
  const m = item.meta;
  const rating = m?.rating ?? 0;
  const version = m?.version;
  const title = m?.title;
  const reviewer = item.author.name || "Anonymous";

  const body =
    title && item.content.startsWith(`${title}\n\n`)
      ? item.content.slice(title.length + 2)
      : item.content;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
          style={{ backgroundColor: "rgba(52, 168, 83, 0.18)" }}
        >
          Google Play
        </span>
        <Stars rating={rating} />
        <span className="text-foreground/90">{reviewer}</span>
        {version && (
          <>
            <span className="text-muted-foreground/50">·</span>
            <span className="tabular-nums">v{version}</span>
          </>
        )}
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">
          <RelativeTime date={item.createdAt} addSuffix />
        </span>
      </div>
      {title && (
        <h3
          className="mt-1 font-serif text-[16px] leading-[1.3] text-foreground break-words transition-colors group-hover/item:text-[color:var(--brand-hover)]"
          style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
        >
          {title}
        </h3>
      )}
      {body && (
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-muted-foreground break-words whitespace-pre-line">
          {body}
        </p>
      )}
    </a>
  );
}

export const column = defineColumnUI<PlayReviewsConfig, PlayReviewsItemMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
