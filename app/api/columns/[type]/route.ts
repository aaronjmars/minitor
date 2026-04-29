import { NextResponse } from "next/server";
import { fetchSubredditPage } from "@/lib/integrations/reddit";
import {
  fetchHackerNewsPage,
  type HNMode,
} from "@/lib/integrations/hackernews";
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
import type { FeedItem } from "@/lib/columns/types";

// Grok calls are slow and expensive — don't cache, always fresh on refresh.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RouteContext = { params: Promise<{ type: string }> };

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

const PAGE_SIZE = 12;

export async function POST(req: Request, context: RouteContext) {
  const { type } = await context.params;
  const body = await req.json().catch(() => ({}));
  const config = (body?.config ?? {}) as Record<string, unknown>;
  const op = body?.op === "loadMore" ? "loadMore" : "fetch";
  const cursor =
    typeof body?.cursor === "string" ? (body.cursor as string) : undefined;

  try {
    // Paginated types first — return {items, nextCursor?}.
    if (type === "hacker-news") {
      const page = op === "loadMore" ? Number(cursor ?? "1") || 1 : 0;
      const r = await fetchHackerNewsPage(
        text(config.mode, "top") as HNMode,
        text(config.query, ""),
        PAGE_SIZE,
        page,
      );
      return NextResponse.json({
        items: r.items,
        nextCursor: r.hasMore ? String(page + 1) : undefined,
      });
    }

    if (type === "reddit") {
      const r = await fetchSubredditPage(
        text(config.subreddit, "popular"),
        text(config.sortBy, "hot"),
        PAGE_SIZE,
        op === "loadMore" ? cursor : undefined,
      );
      return NextResponse.json({
        items: r.items,
        nextCursor: r.nextAfter,
      });
    }

    if (type === "github") {
      const page = op === "loadMore" ? Number(cursor ?? "2") || 2 : 1;
      const items = await fetchGitHub(
        text(config.mode, "trending") as GHMode,
        {
          language: text(config.language, ""),
          period: text(config.period, "week"),
          repo: text(config.repo, ""),
          query: text(config.query, ""),
        },
        PAGE_SIZE,
        page,
      );
      return NextResponse.json({
        items,
        nextCursor:
          items.length === PAGE_SIZE ? String(page + 1) : undefined,
      });
    }

    if (type === "youtube") {
      const mode = text(config.mode, "search") as YTMode;
      // Only the search mode supports cursor pagination via Data API v3.
      if (mode === "search") {
        const r = await fetchYouTubeSearchPage(
          text(config.query, ""),
          text(config.order, "date") as
            | "date"
            | "relevance"
            | "viewCount"
            | "rating",
          PAGE_SIZE,
          op === "loadMore" ? cursor : undefined,
        );
        return NextResponse.json({
          items: r.items,
          nextCursor: r.nextPageToken,
        });
      }
      const items = await fetchYouTube(mode, {
        query: text(config.query, ""),
        order: text(config.order, "date"),
        channel: text(config.channel, ""),
        playlist: text(config.playlist, ""),
      });
      return NextResponse.json({ items });
    }

    // Non-paginated types — only initial fetch is supported.
    if (op === "loadMore") {
      return NextResponse.json(
        { error: `Pagination not supported for ${type}` },
        { status: 400 },
      );
    }

    let items: FeedItem[];
    switch (type) {
      case "x-search":
      case "x-mentions-search":
        items = await grokXSearch(text(config.query));
        break;
      case "x-mentions":
        items = await grokXMentions(text(config.handle));
        break;
      case "x-user":
        items = await grokXUser(text(config.handle));
        break;
      case "x-trending":
        items = await grokXTrending(text(config.topic));
        break;
      case "web-search":
        items = await grokWebSearch(text(config.query));
        break;
      case "news-search":
        items = await grokNewsSearch(text(config.query));
        break;
      case "grok-ask":
        items = await grokAsk(text(config.prompt));
        break;
      case "rss":
        items = await fetchFeed(text(config.url, ""));
        break;
      case "google-news":
        items = await fetchFeed(
          googleNewsUrl(
            text(config.query, ""),
            text(config.hl, "en-US"),
            text(config.gl, "US"),
          ),
        );
        break;
      case "mentions": {
        const sources = (config.sources ?? {}) as Record<string, unknown>;
        items = await fetchMentions({
          query: text(config.query, ""),
          sources: {
            hn: sources.hn !== false,
            reddit: sources.reddit !== false,
            "google-news": sources["google-news"] !== false,
            "bing-news": sources["bing-news"] === true,
          },
        });
        break;
      }
      case "farcaster": {
        const fcMode = text(config.mode, "user");
        if (fcMode === "search") {
          items = await fetchFarcasterSearch(text(config.query, ""));
        } else {
          items = await fetchFarcasterUser(text(config.username, ""));
        }
        break;
      }
      case "newsnow":
        items = await fetchNewsNow(
          text(config.platform, "weibo") as NewsNowPlatform,
        );
        break;
      default:
        return NextResponse.json(
          { error: `Unknown column type: ${type}` },
          { status: 404 },
        );
    }

    return NextResponse.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[api/columns/${type}]`, msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

