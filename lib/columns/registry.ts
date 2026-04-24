import type { ColumnType } from "@/lib/columns/types";
import { xSearchType } from "@/lib/columns/x-search";
import { xUserType } from "@/lib/columns/x-user";
import { xMentionsType } from "@/lib/columns/x-mentions";
import { xTrendingType } from "@/lib/columns/x-trending";
import { webSearchType } from "@/lib/columns/web-search";
import { newsSearchType } from "@/lib/columns/news-search";
import { redditType } from "@/lib/columns/reddit";
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
];

const byId = new Map(ALL_TYPES.map((t) => [t.id, t]));

export function listColumnTypes(): ColumnType[] {
  return ALL_TYPES;
}

export function getColumnType(id: string): ColumnType | undefined {
  return byId.get(id);
}
