"use client";

import { Star } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
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
import {
  meta,
  type AppReviewsConfig,
  type AppReviewsItemMeta,
} from "./plugin";

const PLATFORM_LABEL: Record<AppReviewsItemMeta["platform"], string> = {
  "app-store": "App Store",
  "google-play": "Google Play",
};

const PLATFORM_BG: Record<AppReviewsItemMeta["platform"], string> = {
  "app-store": "rgba(0, 122, 255, 0.18)",
  "google-play": "rgba(52, 168, 83, 0.18)",
};

function ConfigForm({ value, onChange }: ConfigFormProps<AppReviewsConfig>) {
  const showAppleHint = value.platform !== "google-play";
  const showPlayHint = value.platform !== "app-store";

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Platform</Label>
        <Select
          value={value.platform}
          onValueChange={(v) =>
            onChange({ ...value, platform: v as AppReviewsConfig["platform"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="app-store">App Store (iOS)</SelectItem>
            <SelectItem value="google-play">Google Play (Android)</SelectItem>
            <SelectItem value="both">Both (interleaved)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="app-reviews-id">App ID</Label>
        <Input
          id="app-reviews-id"
          placeholder={
            value.platform === "google-play"
              ? "com.spotify.music"
              : "284882215"
          }
          value={value.appId}
          onChange={(e) => onChange({ ...value, appId: e.target.value })}
        />
        <div className="text-xs text-muted-foreground space-y-0.5">
          {showAppleHint && (
            <p>
              <span className="font-medium text-foreground">App Store:</span>{" "}
              numeric ID from the URL —{" "}
              <code>apps.apple.com/.../id</code>
              <code className="text-foreground">284882215</code>.
            </p>
          )}
          {showPlayHint && (
            <p>
              <span className="font-medium text-foreground">Google Play:</span>{" "}
              package ID from the URL —{" "}
              <code>play.google.com/store/apps/details?id=</code>
              <code className="text-foreground">com.spotify.music</code>.
            </p>
          )}
          {value.platform === "both" && (
            <p className="pt-1">
              For <span className="font-medium">Both</span>, enter the same
              app&apos;s ID in whichever store you opened first — the platform
              the ID matches will be queried, the other skipped.
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="app-reviews-country">Country</Label>
        <Input
          id="app-reviews-country"
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
    <span className="inline-flex items-center gap-0.5" aria-label={`${clamped} of 5 stars`}>
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

function ItemRenderer({ item }: ItemRendererProps<AppReviewsItemMeta>) {
  const m = item.meta;
  const platform = m?.platform ?? "app-store";
  const platformLabel = PLATFORM_LABEL[platform];
  const bg = PLATFORM_BG[platform];
  const rating = m?.rating ?? 0;
  const version = m?.version;
  const title = m?.title;
  const reviewer = item.author.name || "Anonymous";

  // Body content — strip the optional title prefix added by the integration.
  const body = title && item.content.startsWith(`${title}\n\n`)
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
          style={{ backgroundColor: bg }}
        >
          {platformLabel}
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
          className="mt-1 font-serif text-[15px] leading-[1.3] text-foreground break-words transition-colors group-hover/item:text-[color:var(--brand-hover)]"
          style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
        >
          {title}
        </h3>
      )}
      {body && (
        <p className="mt-1 text-[13px] leading-snug text-foreground/85 break-words whitespace-pre-line">
          {body}
        </p>
      )}
    </a>
  );
}

export const column = defineColumnUI<AppReviewsConfig, AppReviewsItemMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
