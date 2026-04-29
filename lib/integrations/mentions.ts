import type { FeedItem } from "@/lib/columns/types";
import { fetchHackerNews } from "@/lib/integrations/hackernews";
import { searchReddit } from "@/lib/integrations/reddit";
import { fetchFeed, googleNewsUrl } from "@/lib/integrations/rss";

export type MentionSource = "hn" | "reddit" | "google-news" | "bing-news";

export interface MentionsConfig {
  query: string;
  sources: Record<MentionSource, boolean>;
  limitPerSource?: number;
}

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
]);

function canonicalUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, "");
    for (const p of [...u.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(p.toLowerCase())) u.searchParams.delete(p);
    }
    u.hash = "";
    let s = u.toString();
    if (s.endsWith("/")) s = s.slice(0, -1);
    return s;
  } catch {
    return url;
  }
}

function tag(items: FeedItem[], source: MentionSource): FeedItem[] {
  return items.map((it) => ({
    ...it,
    id: `${source}-${it.id}`,
    meta: { ...(it.meta ?? {}), mentionSource: source },
  }));
}

export async function fetchMentions(
  config: MentionsConfig,
): Promise<FeedItem[]> {
  const query = config.query.trim();
  if (!query) throw new Error("Query is required.");
  const limit = config.limitPerSource ?? 8;

  const tasks: Promise<FeedItem[]>[] = [];
  if (config.sources.hn) {
    tasks.push(
      fetchHackerNews("query", query, limit).then((items) => tag(items, "hn")),
    );
  }
  if (config.sources.reddit) {
    tasks.push(searchReddit(query, limit).then((items) => tag(items, "reddit")));
  }
  if (config.sources["google-news"]) {
    tasks.push(
      fetchFeed(googleNewsUrl(query), limit).then((items) =>
        tag(items, "google-news"),
      ),
    );
  }
  if (config.sources["bing-news"]) {
    const bingUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
    tasks.push(fetchFeed(bingUrl, limit).then((items) => tag(items, "bing-news")));
  }

  if (tasks.length === 0) {
    throw new Error("Pick at least one source.");
  }

  const settled = await Promise.allSettled(tasks);
  const errors: string[] = [];
  const all: FeedItem[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    } else {
      errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
    }
  }

  if (all.length === 0 && errors.length > 0) {
    throw new Error(`All sources failed:\n${errors.join("\n")}`);
  }

  // Dedupe by canonical URL — keep the earliest source occurrence (first in tasks order)
  const seen = new Set<string>();
  const deduped: FeedItem[] = [];
  for (const it of all) {
    const key = canonicalUrl(it.url ?? it.id);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(it);
  }

  deduped.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return deduped.slice(0, limit * 2);
}
