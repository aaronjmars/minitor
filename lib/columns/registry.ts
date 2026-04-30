import { defineColumnType, type AnyColumnType } from "@/lib/columns/types";
import { xSearchType } from "@/lib/columns/x-search";
import { xUserType } from "@/lib/columns/x-user";
import { xMentionsType } from "@/lib/columns/x-mentions";
import { xTrendingType } from "@/lib/columns/x-trending";
import { webSearchType } from "@/lib/columns/web-search";
import { newsSearchType } from "@/lib/columns/news-search";
import { redditType } from "@/lib/columns/reddit";
import { hackerNewsType } from "@/lib/columns/hacker-news";
import { githubType } from "@/lib/columns/github";
import { rssType } from "@/lib/columns/rss";
import { googleNewsType } from "@/lib/columns/google-news";
import { mentionsType } from "@/lib/columns/mentions";
import { farcasterType } from "@/lib/columns/farcaster";
import { youtubeType } from "@/lib/columns/youtube";
import { newsnowType } from "@/lib/columns/newsnow";
import { grokAskType } from "@/lib/columns/grok-ask";

// Register a new column type by importing it and appending here.
// Also add the matching server fetcher in lib/columns/server-registry.ts.
const ALL_TYPES: AnyColumnType[] = [
  defineColumnType(grokAskType),
  defineColumnType(xSearchType),
  defineColumnType(xUserType),
  defineColumnType(xMentionsType),
  defineColumnType(xTrendingType),
  defineColumnType(webSearchType),
  defineColumnType(newsSearchType),
  defineColumnType(redditType),
  defineColumnType(hackerNewsType),
  defineColumnType(githubType),
  defineColumnType(rssType),
  defineColumnType(googleNewsType),
  defineColumnType(mentionsType),
  defineColumnType(farcasterType),
  defineColumnType(youtubeType),
  defineColumnType(newsnowType),
];

const byId = new Map(ALL_TYPES.map((t) => [t.id, t]));

export function listColumnTypes(): AnyColumnType[] {
  return ALL_TYPES;
}

export function getColumnType(id: string): AnyColumnType | undefined {
  return byId.get(id);
}
