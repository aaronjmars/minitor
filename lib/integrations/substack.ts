import "server-only";

// Substack has no global, key-free search API (substack.com/api/v1/post/search
// exists but always returns empty results without auth). Per-publication RSS
// is stable and zero-dep — every Substack newsletter exposes <handle>.substack.com/feed.
// We fetch one feed per handle in parallel, optionally filter items by a
// keyword or URL, and merge them newest-first.

import type { FeedItem } from "@/lib/columns/types";
import { fetchFeed } from "@/lib/integrations/rss";

export interface SubstackMeta {
  publication: string;
  feedTitle?: string;
  source: string;
}

export interface ParsedHandle {
  handle: string;
  feedUrl: string;
}

export function parseHandles(input: string): ParsedHandle[] {
  const seen = new Set<string>();
  const out: ParsedHandle[] = [];
  for (const raw of input.split(/[\s,]+/)) {
    const piece = raw.trim();
    if (!piece) continue;
    const handle = handleFromInput(piece);
    if (!handle || seen.has(handle)) continue;
    seen.add(handle);
    out.push({ handle, feedUrl: `https://${handle}.substack.com/feed` });
  }
  return out;
}

function handleFromInput(s: string): string | null {
  const lower = s.toLowerCase();
  // Full URL or bare host: extract the subdomain before .substack.com.
  const urlMatch = lower.match(
    /^(?:https?:\/\/)?([a-z0-9-]+)\.substack\.com\b/,
  );
  if (urlMatch) return urlMatch[1];
  // Plain handle. Allow alphanumerics and hyphens; reject anything else.
  if (/^[a-z0-9][a-z0-9-]*$/.test(lower)) return lower;
  return null;
}

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^https?:\/\//i.test(t)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(t);
}

function normalizeUrlForMatch(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function matchesQuery(item: FeedItem, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (looksLikeUrl(q)) {
    const needle = normalizeUrlForMatch(q);
    const hay = (item.url ?? "").toLowerCase();
    return hay.includes(needle);
  }
  const needle = q.toLowerCase();
  return (
    item.content.toLowerCase().includes(needle) ||
    (item.url?.toLowerCase().includes(needle) ?? false)
  );
}

export async function searchSubstackPublications(
  handles: ParsedHandle[],
  query: string,
  perFeed = 20,
  totalLimit = 30,
): Promise<FeedItem<SubstackMeta>[]> {
  if (handles.length === 0) return [];

  const results = await Promise.allSettled(
    handles.map(async ({ handle, feedUrl }) => {
      const items = await fetchFeed(feedUrl, perFeed);
      return items.map((item) =>
        tagWithPublication(item, handle, feedUrl),
      );
    }),
  );

  const merged: FeedItem<SubstackMeta>[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") merged.push(...r.value);
  }

  const filtered = query.trim()
    ? merged.filter((it) => matchesQuery(it, query))
    : merged;

  filtered.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return filtered.slice(0, totalLimit);
}

function tagWithPublication(
  item: FeedItem,
  handle: string,
  feedUrl: string,
): FeedItem<SubstackMeta> {
  const publication = `${handle}.substack.com`;
  const prevMeta = item.meta as { source?: string; feedTitle?: string } | undefined;
  const feedTitle = prevMeta?.feedTitle ?? publication;
  const source = prevMeta?.source ?? feedTitle;
  return {
    ...item,
    // Prefix with publication to avoid id collisions across feeds.
    id: `${publication}#${item.id || item.url || feedUrl}`,
    author: {
      ...item.author,
      name: feedTitle,
      handle: publication,
      avatarUrl:
        item.author.avatarUrl ??
        `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(publication)}`,
    },
    meta: { publication, feedTitle, source },
  };
}
