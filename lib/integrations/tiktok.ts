import type { FeedItem } from "@/lib/columns/types";
import { grokWebSearch } from "@/lib/integrations/xai";

export interface TikTokMeta {
  source: "tiktok";
  username?: string;
  videoId?: string;
}

function parseTikTokUrl(url: string): { username?: string; videoId?: string } {
  const m = /tiktok\.com\/@([^/?#]+)\/video\/(\d+)/i.exec(url);
  if (m) return { username: m[1], videoId: m[2] };
  return {};
}

export async function searchTikTok(
  query: string,
  limit = 6,
): Promise<FeedItem<TikTokMeta>[]> {
  const q = query.trim();
  if (!q) return [];
  const composed = `site:tiktok.com ${q}`;
  const items = await grokWebSearch(composed, limit);
  return items
    .filter((it): it is FeedItem & { url: string } =>
      typeof it.url === "string" && /tiktok\.com/i.test(it.url),
    )
    .map((it): FeedItem<TikTokMeta> => {
      const parsed = parseTikTokUrl(it.url);
      const username = parsed.username;
      const author = username
        ? {
            name: username,
            handle: username,
            avatarUrl: `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(username)}`,
          }
        : it.author;
      return {
        ...it,
        author,
        meta: { source: "tiktok", ...parsed },
      };
    });
}
