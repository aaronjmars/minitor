import type { ColumnType } from "@/lib/columns/types";
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
// Nothing else in the app needs to change.
const ALL_TYPES: ColumnType[] = [
  grokAskType as unknown as ColumnType,
  xSearchType as unknown as ColumnType,
  xUserType as unknown as ColumnType,
  xMentionsType as unknown as ColumnType,
  xTrendingType as unknown as ColumnType,
  webSearchType as unknown as ColumnType,
  newsSearchType as unknown as ColumnType,
  redditType as unknown as ColumnType,
  hackerNewsType as unknown as ColumnType,
  githubType as unknown as ColumnType,
  rssType as unknown as ColumnType,
  googleNewsType as unknown as ColumnType,
  mentionsType as unknown as ColumnType,
  farcasterType as unknown as ColumnType,
  youtubeType as unknown as ColumnType,
  newsnowType as unknown as ColumnType,
];

const byId = new Map(ALL_TYPES.map((t) => [t.id, t]));

export function listColumnTypes(): ColumnType[] {
  return ALL_TYPES;
}

export function getColumnType(id: string): ColumnType | undefined {
  return byId.get(id);
}
