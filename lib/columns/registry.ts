// Client-safe registry: maps each plugin id to its full UI bundle (icon,
// ConfigForm, ItemRenderer, etc.). The id list is the manifest's source of
// truth — this file just attaches the matching client.tsx export to each id.
//
// To register a new column type:
//   1. Add an entry to `lib/columns/plugins/manifest.ts`.
//   2. Add the matching `column` import + map entry below.
//   3. Add the matching `server` import + map entry in `server-registry.ts`.
// `server-registry.ts` runs a parity check at module init and will throw
// loudly if any of the three are out of sync.

import type { AnyColumnUI } from "@/lib/columns/types";
import { PLUGIN_METAS } from "@/lib/columns/plugins/manifest";

import { column as grokAsk } from "@/lib/columns/plugins/grok-ask/client";
import { column as xSearch } from "@/lib/columns/plugins/x-search/client";
import { column as xUser } from "@/lib/columns/plugins/x-user/client";
import { column as xMentions } from "@/lib/columns/plugins/x-mentions/client";
import { column as xTrending } from "@/lib/columns/plugins/x-trending/client";
import { column as webSearch } from "@/lib/columns/plugins/web-search/client";
import { column as newsSearch } from "@/lib/columns/plugins/news-search/client";
import { column as reddit } from "@/lib/columns/plugins/reddit/client";
import { column as hackerNews } from "@/lib/columns/plugins/hacker-news/client";
import { column as github } from "@/lib/columns/plugins/github/client";
import { column as rss } from "@/lib/columns/plugins/rss/client";
import { column as googleNews } from "@/lib/columns/plugins/google-news/client";
import { column as mentions } from "@/lib/columns/plugins/mentions/client";
import { column as farcaster } from "@/lib/columns/plugins/farcaster/client";
import { column as youtube } from "@/lib/columns/plugins/youtube/client";
import { column as newsnow } from "@/lib/columns/plugins/newsnow/client";
import { column as appReviews } from "@/lib/columns/plugins/app-reviews/client";

// Keyed by id rather than positional — "use client" boundary means we can't
// read `column.id` reliably from a server context anyway, so the id has to
// come from the static key on the left.
const COLUMNS_BY_ID: Record<string, AnyColumnUI> = {
  "grok-ask": grokAsk,
  "x-search": xSearch,
  "x-user": xUser,
  "x-mentions": xMentions,
  "x-trending": xTrending,
  "web-search": webSearch,
  "news-search": newsSearch,
  reddit,
  "hacker-news": hackerNews,
  github,
  rss,
  "google-news": googleNews,
  mentions,
  farcaster,
  youtube,
  newsnow,
  "app-reviews": appReviews,
};

// Pre-built ordered list, indexed by manifest order. Built once at module init.
const ALL: AnyColumnUI[] = PLUGIN_METAS.map((m) => {
  const col = COLUMNS_BY_ID[m.id];
  if (!col) {
    throw new Error(
      `lib/columns/registry.ts is missing a UI entry for plugin "${m.id}"`,
    );
  }
  return col;
});

export function listColumnTypes(): AnyColumnUI[] {
  return ALL;
}

export function getColumnType(id: string): AnyColumnUI | undefined {
  return COLUMNS_BY_ID[id];
}
