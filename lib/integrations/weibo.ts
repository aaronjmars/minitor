import type { FeedItem } from "@/lib/columns/types";

// m.weibo.cn — Weibo's mobile site exposes a JSON search endpoint with no auth.
// Far more parseable than scraping s.weibo.com HTML, but the host blocks most
// non-CN egress IPs and rate-limits aggressively. Errors bubble up so the
// column card can surface "no results" or the upstream message.

const SEARCH_URL = "https://m.weibo.cn/api/container/getIndex";

interface WeiboUser {
  id?: number;
  screen_name?: string;
  profile_image_url?: string;
  profile_url?: string;
}

interface WeiboMblog {
  id?: string;
  idstr?: string;
  bid?: string;
  mid?: string;
  text?: string;
  created_at?: string;
  user?: WeiboUser;
  reposts_count?: number;
  comments_count?: number;
  attitudes_count?: number;
  source?: string;
  retweeted_status?: WeiboMblog;
}

interface WeiboCard {
  card_type?: number;
  mblog?: WeiboMblog;
  card_group?: WeiboCard[];
}

interface WeiboSearchResponse {
  ok?: number;
  msg?: string;
  data?: {
    cardlistInfo?: { total?: number; page?: number };
    cards?: WeiboCard[];
  };
}

export interface WeiboSearchMeta {
  likes: number;
  retweets: number;
  replies: number;
}

function* iterMblogs(cards: WeiboCard[]): Generator<WeiboMblog> {
  for (const c of cards) {
    if (c.mblog) yield c.mblog;
    if (c.card_group) {
      for (const inner of c.card_group) {
        if (inner.mblog) yield inner.mblog;
      }
    }
  }
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => HTML_ENTITIES[m] ?? m)
    .trim();
}

function parseWeiboDate(raw: string | undefined): string {
  const now = new Date();
  if (!raw) return now.toISOString();
  const s = raw.trim();

  if (s === "刚刚") return now.toISOString();

  const min = s.match(/^(\d+)\s*分钟前$/);
  if (min) return new Date(now.getTime() - Number(min[1]) * 60_000).toISOString();

  const hour = s.match(/^(\d+)\s*小时前$/);
  if (hour) return new Date(now.getTime() - Number(hour[1]) * 3_600_000).toISOString();

  const day = s.match(/^(\d+)\s*天前$/);
  if (day) return new Date(now.getTime() - Number(day[1]) * 86_400_000).toISOString();

  const yesterday = s.match(/^昨天\s+(\d{1,2}):(\d{2})$/);
  if (yesterday) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    d.setHours(Number(yesterday[1]), Number(yesterday[2]), 0, 0);
    return d.toISOString();
  }

  const md = s.match(/^(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (md) {
    const d = new Date(
      now.getFullYear(),
      Number(md[1]) - 1,
      Number(md[2]),
      md[3] ? Number(md[3]) : 0,
      md[4] ? Number(md[4]) : 0,
    );
    return d.toISOString();
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  return now.toISOString();
}

function toFeedItem(m: WeiboMblog): FeedItem<WeiboSearchMeta> | null {
  const text = stripHtml(m.text ?? "");
  if (!text) return null;
  const id = m.idstr ?? m.id ?? m.mid;
  const bid = m.bid ?? id;
  if (!id || !bid) return null;

  const user = m.user ?? {};
  const userId = user.id !== undefined ? String(user.id) : "";
  const handle = user.screen_name ?? userId;

  return {
    id: `weibo-${id}`,
    author: {
      name: user.screen_name ?? "微博用户",
      handle: handle || undefined,
      avatarUrl: user.profile_image_url,
    },
    content: text,
    url: userId ? `https://weibo.com/${userId}/${bid}` : `https://m.weibo.cn/status/${bid}`,
    createdAt: parseWeiboDate(m.created_at),
    meta: {
      likes: Number(m.attitudes_count ?? 0),
      retweets: Number(m.reposts_count ?? 0),
      replies: Number(m.comments_count ?? 0),
    },
  };
}

export async function searchWeibo(
  query: string,
  limit = 20,
): Promise<FeedItem<WeiboSearchMeta>[]> {
  const q = query.trim();
  if (!q) return [];

  // 100103type=61 = post-only search (vs type=1 which mixes users & topics).
  const containerid = `100103type=61&q=${q}`;
  const url = `${SEARCH_URL}?containerid=${encodeURIComponent(containerid)}&page_type=searchall`;

  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      referer: `https://m.weibo.cn/search?containerid=${encodeURIComponent(containerid)}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Weibo ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const json = (await res.json()) as WeiboSearchResponse;
  if (json.ok !== 1) {
    if (json.msg) throw new Error(`Weibo: ${json.msg}`);
    return [];
  }
  const cards = json.data?.cards ?? [];

  const items: FeedItem<WeiboSearchMeta>[] = [];
  const seen = new Set<string>();
  for (const m of iterMblogs(cards)) {
    const item = toFeedItem(m);
    if (!item) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    items.push(item);
    if (items.length >= limit) break;
  }
  return items;
}
