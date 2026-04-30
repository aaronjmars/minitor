import type { FeedItem } from "@/lib/columns/types";

// Algolia HN API — public, no auth, generous rate limits.
// https://hn.algolia.com/api
const ALGOLIA = "https://hn.algolia.com/api/v1";

export type HNMode = "top" | "new" | "ask" | "show" | "query";

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  author?: string;
  points?: number;
  num_comments?: number;
  created_at?: string;
  created_at_i?: number;
  story_text?: string;
  comment_text?: string;
  story_id?: number;
  _tags?: string[];
}

interface AlgoliaResponse {
  hits?: AlgoliaHit[];
  nbHits?: number;
  page?: number;
  nbPages?: number;
}

function endpointFor(
  mode: HNMode,
  query: string,
  limit: number,
  page: number,
): string {
  const params = new URLSearchParams({
    hitsPerPage: String(limit),
    page: String(page),
  });
  switch (mode) {
    case "new":
      params.set("tags", "story");
      return `${ALGOLIA}/search_by_date?${params}`;
    case "ask":
      params.set("tags", "ask_hn");
      return `${ALGOLIA}/search?${params}`;
    case "show":
      params.set("tags", "show_hn");
      return `${ALGOLIA}/search?${params}`;
    case "query":
      params.set("tags", "story");
      params.set("query", query);
      return `${ALGOLIA}/search?${params}`;
    case "top":
    default:
      params.set("tags", "front_page");
      return `${ALGOLIA}/search?${params}`;
  }
}

function mapHit(h: AlgoliaHit): FeedItem {
  const title = h.title ?? h.story_title ?? "(untitled)";
  const externalUrl = h.url ?? h.story_url;
  const itemUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
  const author = h.author ?? "anonymous";
  const createdMs =
    typeof h.created_at_i === "number"
      ? h.created_at_i * 1000
      : h.created_at
        ? Date.parse(h.created_at)
        : Date.now();

  const snippet =
    h.story_text
      ?.replace(/<[^>]+>/g, "")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .trim() ?? "";

  return {
    id: h.objectID,
    author: {
      name: author,
      handle: author,
      avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(author)}`,
    },
    content: snippet ? `${title}\n\n${snippet}` : title,
    url: externalUrl ?? itemUrl,
    createdAt: new Date(createdMs).toISOString(),
    meta: {
      points: h.points ?? 0,
      comments: h.num_comments ?? 0,
      commentsUrl: itemUrl,
      externalUrl: externalUrl ?? undefined,
    },
  };
}

export async function fetchHackerNewsPage(
  mode: HNMode,
  query = "",
  limit = 12,
  page = 0,
): Promise<{ items: FeedItem[]; hasMore: boolean }> {
  const url = endpointFor(mode, query, limit, page);
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HN ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as AlgoliaResponse;
  const hits = json.hits ?? [];
  const totalPages = typeof json.nbPages === "number" ? json.nbPages : 1;
  const hasMore = page + 1 < totalPages && hits.length === limit;
  return { items: hits.slice(0, limit).map(mapHit), hasMore };
}

export async function fetchHackerNews(
  mode: HNMode,
  query = "",
  limit = 12,
): Promise<FeedItem[]> {
  const { items } = await fetchHackerNewsPage(mode, query, limit, 0);
  return items;
}

// ---- Mentions search ------------------------------------------------------

export type HNSearchScope = "all" | "stories" | "comments";
export type HNSearchSort = "relevance" | "date";

export interface HNSearchHitMeta {
  points: number;
  comments: number;
  commentsUrl: string;
  externalUrl?: string;
  kind: "story" | "comment";
  storyTitle?: string;
}

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^https?:\/\//i.test(t)) return true;
  if (/^www\./i.test(t)) return true;
  // bare domain or domain+path: at least one dot, recognizable TLD-ish suffix.
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(t);
}

function normalizeUrlForSearch(s: string): string {
  return s
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

function decodeSnippet(s: string | undefined): string {
  return (
    s
      ?.replace(/<[^>]+>/g, "")
      .replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .trim() ?? ""
  );
}

function isCommentHit(h: AlgoliaHit): boolean {
  if (Array.isArray(h._tags) && h._tags.includes("comment")) return true;
  return typeof h.comment_text === "string" && h.comment_text.length > 0;
}

function mapSearchHit(h: AlgoliaHit): FeedItem<HNSearchHitMeta> {
  const comment = isCommentHit(h);
  const storyTitle = h.story_title ?? h.title ?? "(untitled)";
  const externalUrl = h.url ?? h.story_url;
  const itemUrl = `https://news.ycombinator.com/item?id=${h.objectID}`;
  const author = h.author ?? "anonymous";
  const createdMs =
    typeof h.created_at_i === "number"
      ? h.created_at_i * 1000
      : h.created_at
        ? Date.parse(h.created_at)
        : Date.now();

  const snippet = decodeSnippet(comment ? h.comment_text : h.story_text);
  const content = comment
    ? snippet || `Comment on “${storyTitle}”`
    : snippet
      ? `${storyTitle}\n\n${snippet}`
      : storyTitle;

  return {
    id: h.objectID,
    author: {
      name: author,
      handle: author,
      avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(author)}`,
    },
    content,
    url: comment ? itemUrl : (externalUrl ?? itemUrl),
    createdAt: new Date(createdMs).toISOString(),
    meta: {
      points: h.points ?? 0,
      comments: h.num_comments ?? 0,
      commentsUrl: itemUrl,
      externalUrl: externalUrl ?? undefined,
      kind: comment ? "comment" : "story",
      storyTitle: comment ? storyTitle : undefined,
    },
  };
}

export async function searchHackerNewsByUrlOrKeyword(
  input: string,
  opts: {
    scope: HNSearchScope;
    sort: HNSearchSort;
    limit: number;
    page: number;
  },
): Promise<{ items: FeedItem<HNSearchHitMeta>[]; hasMore: boolean }> {
  const { scope, sort, limit, page } = opts;
  const trimmed = input.trim();
  if (!trimmed) return { items: [], hasMore: false };

  const params = new URLSearchParams({
    hitsPerPage: String(limit),
    page: String(page),
  });

  const isUrl = looksLikeUrl(trimmed);
  if (isUrl) {
    params.set("query", normalizeUrlForSearch(trimmed));
    // Algolia attribute scoping — only match against the indexed URL field
    // so domain queries don't get diluted by title/comment matches.
    params.set("restrictSearchableAttributes", "url");
  } else {
    params.set("query", trimmed);
  }

  switch (scope) {
    case "stories":
      params.set("tags", "story");
      break;
    case "comments":
      params.set("tags", "comment");
      break;
    case "all":
      params.set("tags", "(story,comment)");
      break;
  }

  const path = sort === "date" ? "search_by_date" : "search";
  const res = await fetch(`${ALGOLIA}/${path}?${params}`, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`HN ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as AlgoliaResponse;
  const hits = json.hits ?? [];
  const totalPages = typeof json.nbPages === "number" ? json.nbPages : 1;
  const hasMore = page + 1 < totalPages && hits.length === limit;
  return { items: hits.slice(0, limit).map(mapSearchHit), hasMore };
}
