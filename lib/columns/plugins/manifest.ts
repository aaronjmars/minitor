// Pure plugin manifest — single source of truth for which column types exist.
// Imports only `plugin.ts` files (no JSX, no server-only deps), so it can be
// safely evaluated on either the server or the client without crossing the
// "use client" boundary. Both registries (client UI + server fetchers) take
// their canonical id list from here.

import { meta as grokAsk } from "./grok-ask/plugin";
import { meta as xSearch } from "./x-search/plugin";
import { meta as xUser } from "./x-user/plugin";
import { meta as xMentions } from "./x-mentions/plugin";
import { meta as xTrending } from "./x-trending/plugin";
import { meta as webSearch } from "./web-search/plugin";
import { meta as newsSearch } from "./news-search/plugin";
import { meta as reddit } from "./reddit/plugin";
import { meta as hackerNews } from "./hacker-news/plugin";
import { meta as hackerNewsSearch } from "./hacker-news-search/plugin";
import { meta as github } from "./github/plugin";
import { meta as rss } from "./rss/plugin";
import { meta as googleNews } from "./google-news/plugin";
import { meta as mentions } from "./mentions/plugin";
import { meta as farcaster } from "./farcaster/plugin";
import { meta as youtube } from "./youtube/plugin";
import { meta as tiktok } from "./tiktok/plugin";
import { meta as newsnow } from "./newsnow/plugin";

export const PLUGIN_METAS = [
  grokAsk,
  xSearch,
  xUser,
  xMentions,
  xTrending,
  webSearch,
  newsSearch,
  reddit,
  hackerNews,
  hackerNewsSearch,
  github,
  rss,
  googleNews,
  mentions,
  farcaster,
  youtube,
  tiktok,
  newsnow,
];

export const REGISTERED_IDS: ReadonlySet<string> = new Set(
  PLUGIN_METAS.map((m) => m.id),
);

if (PLUGIN_METAS.length !== REGISTERED_IDS.size) {
  const ids = PLUGIN_METAS.map((m) => m.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  throw new Error(`Duplicate plugin ids in manifest: ${dupes.join(", ")}`);
}
