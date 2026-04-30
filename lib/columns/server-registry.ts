import "server-only";

import type { FeedItem, PageResult } from "@/lib/columns/types";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { fetchSubredditPage } from "@/lib/integrations/reddit";
import { fetchHackerNewsPage, type HNMode } from "@/lib/integrations/hackernews";
import { fetchGitHub, type GHMode } from "@/lib/integrations/github";
import { fetchFeed, googleNewsUrl } from "@/lib/integrations/rss";
import { fetchMentions } from "@/lib/integrations/mentions";
import {
  fetchFarcasterUser,
  fetchFarcasterSearch,
} from "@/lib/integrations/farcaster";
import {
  fetchYouTube,
  fetchSearchPage as fetchYouTubeSearchPage,
  type YTMode,
} from "@/lib/integrations/youtube";
import {
  fetchNewsNow,
  type NewsNowPlatform,
} from "@/lib/integrations/newsnow";
import {
  grokAsk,
  grokNewsSearch,
  grokWebSearch,
  grokXMentions,
  grokXSearch,
  grokXTrending,
  grokXUser,
} from "@/lib/integrations/xai";

export type ServerFetcher = (
  config: Record<string, unknown>,
  cursor?: string,
) => Promise<PageResult>;

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function oneShot(items: FeedItem[]): PageResult {
  return { items };
}

const FETCHERS: Record<string, ServerFetcher> = {
  // ---- xAI / Grok ---------------------------------------------------------
  "grok-ask": async (c) => oneShot(await grokAsk(s(c.prompt))),
  "x-search": async (c) => oneShot(await grokXSearch(s(c.query))),
  "x-user": async (c) => oneShot(await grokXUser(s(c.handle))),
  "x-mentions": async (c) => oneShot(await grokXMentions(s(c.handle))),
  "x-trending": async (c) => oneShot(await grokXTrending(s(c.topic))),
  "web-search": async (c) => oneShot(await grokWebSearch(s(c.query))),
  "news-search": async (c) => oneShot(await grokNewsSearch(s(c.query))),

  // ---- RSS-backed ---------------------------------------------------------
  rss: async (c) => oneShot(await fetchFeed(s(c.url))),
  "google-news": async (c) =>
    oneShot(
      await fetchFeed(googleNewsUrl(s(c.query), s(c.hl, "en-US"), s(c.gl, "US"))),
    ),

  // ---- Multi-source -------------------------------------------------------
  mentions: async (c) => {
    const sources = (c.sources ?? {}) as Record<string, unknown>;
    return oneShot(
      await fetchMentions({
        query: s(c.query),
        sources: {
          hn: sources.hn !== false,
          reddit: sources.reddit !== false,
          "google-news": sources["google-news"] !== false,
          "bing-news": sources["bing-news"] === true,
        },
      }),
    );
  },

  // ---- Farcaster ----------------------------------------------------------
  farcaster: async (c) => {
    const mode = s(c.mode, "user");
    if (mode === "search") {
      return oneShot(await fetchFarcasterSearch(s(c.query)));
    }
    return oneShot(await fetchFarcasterUser(s(c.username)));
  },

  // ---- NewsNow ------------------------------------------------------------
  newsnow: async (c) =>
    oneShot(await fetchNewsNow(s(c.platform, "weibo") as NewsNowPlatform)),

  // ---- Paginated ----------------------------------------------------------
  "hacker-news": async (c, cursor) => {
    const page = cursor ? Number(cursor) || 0 : 0;
    const r = await fetchHackerNewsPage(
      s(c.mode, "top") as HNMode,
      s(c.query),
      PAGE_SIZE,
      page,
    );
    return {
      items: r.items,
      nextCursor: r.hasMore ? String(page + 1) : undefined,
    };
  },

  reddit: async (c, cursor) => {
    const r = await fetchSubredditPage(
      s(c.subreddit, "popular"),
      s(c.sortBy, "hot"),
      PAGE_SIZE,
      cursor,
    );
    return { items: r.items, nextCursor: r.nextAfter };
  },

  github: async (c, cursor) => {
    const page = cursor ? Number(cursor) || 1 : 1;
    const items = await fetchGitHub(
      s(c.mode, "trending") as GHMode,
      {
        language: s(c.language),
        period: s(c.period, "week"),
        repo: s(c.repo),
        query: s(c.query),
      },
      PAGE_SIZE,
      page,
    );
    return {
      items,
      nextCursor: items.length === PAGE_SIZE ? String(page + 1) : undefined,
    };
  },

  youtube: async (c, cursor) => {
    const mode = s(c.mode, "search") as YTMode;
    if (mode === "search") {
      const r = await fetchYouTubeSearchPage(
        s(c.query),
        s(c.order, "date") as "date" | "relevance" | "viewCount" | "rating",
        PAGE_SIZE,
        cursor,
      );
      return { items: r.items, nextCursor: r.nextPageToken };
    }
    const items = await fetchYouTube(mode, {
      query: s(c.query),
      order: s(c.order, "date"),
      channel: s(c.channel),
      playlist: s(c.playlist),
    });
    return { items };
  },
};

export function getServerFetcher(typeId: string): ServerFetcher | undefined {
  return FETCHERS[typeId];
}
