import { NextResponse } from "next/server";
import { generateRedditPosts } from "@/lib/mock/generators";
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

export async function POST(req: Request, context: RouteContext) {
  const { type } = await context.params;
  const body = await req.json().catch(() => ({}));
  const config = (body?.config ?? {}) as Record<string, unknown>;

  try {
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
      case "reddit":
        items = generateRedditPosts(
          text(config.subreddit, "popular"),
          text(config.sortBy, "hot"),
          6,
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
