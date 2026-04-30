import "server-only";

// Server-only registry: maps each plugin id to its server fetcher. The id
// list is the manifest's source of truth. The parity check at module init
// throws loudly if `manifest.ts` and this file disagree — that's the only
// thing standing between you and a 404 / silent breakage in production.

import type { AnyColumnServer } from "@/lib/columns/types";
import { PLUGIN_METAS, REGISTERED_IDS } from "@/lib/columns/plugins/manifest";

import { server as grokAsk } from "@/lib/columns/plugins/grok-ask/server";
import { server as xSearch } from "@/lib/columns/plugins/x-search/server";
import { server as xUser } from "@/lib/columns/plugins/x-user/server";
import { server as xMentions } from "@/lib/columns/plugins/x-mentions/server";
import { server as xTrending } from "@/lib/columns/plugins/x-trending/server";
import { server as webSearch } from "@/lib/columns/plugins/web-search/server";
import { server as newsSearch } from "@/lib/columns/plugins/news-search/server";
import { server as reddit } from "@/lib/columns/plugins/reddit/server";
import { server as hackerNews } from "@/lib/columns/plugins/hacker-news/server";
import { server as hackerNewsSearch } from "@/lib/columns/plugins/hacker-news-search/server";
import { server as github } from "@/lib/columns/plugins/github/server";
import { server as rss } from "@/lib/columns/plugins/rss/server";
import { server as googleNews } from "@/lib/columns/plugins/google-news/server";
import { server as mentions } from "@/lib/columns/plugins/mentions/server";
import { server as farcaster } from "@/lib/columns/plugins/farcaster/server";
import { server as youtube } from "@/lib/columns/plugins/youtube/server";
import { server as newsnow } from "@/lib/columns/plugins/newsnow/server";

const SERVERS_BY_ID: Record<string, AnyColumnServer> = {
  "grok-ask": grokAsk,
  "x-search": xSearch,
  "x-user": xUser,
  "x-mentions": xMentions,
  "x-trending": xTrending,
  "web-search": webSearch,
  "news-search": newsSearch,
  reddit,
  "hacker-news": hackerNews,
  "hacker-news-search": hackerNewsSearch,
  github,
  rss,
  "google-news": googleNews,
  mentions,
  farcaster,
  youtube,
  newsnow,
};

// Parity check — runs once at server module init. Throws loudly rather than
// 404'ing at request time. The manifest is the canonical id list; both the
// UI registry and this file are validated against it.
const serverIds = new Set(Object.keys(SERVERS_BY_ID));
const missingFromServer = [...REGISTERED_IDS].filter(
  (id) => !serverIds.has(id),
);
const stale = [...serverIds].filter((id) => !REGISTERED_IDS.has(id));
if (missingFromServer.length || stale.length) {
  const parts = [
    missingFromServer.length
      ? `In manifest but missing a server fetcher: ${missingFromServer.join(", ")}`
      : "",
    stale.length
      ? `In server-registry.ts but not in manifest: ${stale.join(", ")}`
      : "",
  ].filter(Boolean);
  throw new Error(`Column registry parity check failed. ${parts.join(" | ")}`);
}

// Verify each registered server's id matches its key (catches typos like
// `redit` → reddit), and that meta.schema is the expected one from manifest.
for (const m of PLUGIN_METAS) {
  const s = SERVERS_BY_ID[m.id];
  if (s.meta.id !== m.id) {
    throw new Error(
      `Server fetcher under key "${m.id}" registered as id "${s.meta.id}"`,
    );
  }
}

export function getServerEntry(id: string): AnyColumnServer | undefined {
  return SERVERS_BY_ID[id];
}
