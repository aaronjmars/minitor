import type { FeedItem } from "@/lib/columns/types";
import { grokWebSearch } from "@/lib/integrations/xai";

// Rednote (Xiaohongshu / 小红书 / xhs) has no public API and aggressively
// blocks anonymous scraping. The official open API is invitation-only for
// brand partners. Best-effort path: scope a Grok web search to xhs domains.
// Coverage is limited to pages indexed by public crawlers + shared
// xhslink.com short URLs. To upgrade to a paid scraper (Bright Data, Apify,
// RapidAPI), add a `process.env`-gated branch above the grok fallback —
// callers don't change.
const REDNOTE_DOMAINS =
  "site:xiaohongshu.com OR site:xhs.cn OR site:xhslink.com";

export async function fetchRednoteMentions(
  query: string,
  limit = 10,
): Promise<FeedItem[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const scoped = `${trimmed} (${REDNOTE_DOMAINS})`;
  const items = await grokWebSearch(scoped, limit);

  return items.map((item) => ({
    ...item,
    meta: { source: item.author.name, kind: "rednote" as const },
  }));
}
