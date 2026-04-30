import type { FeedItem } from "@/lib/columns/types";

// Telegram has no public search API for channels without a bot token + MTProto,
// and bot tokens can't read arbitrary channels. The reliable no-auth path is
// the server-rendered preview at https://t.me/s/<channel>, which lists the
// channel's recent posts as parseable HTML. We fetch each requested channel,
// parse posts, and filter on our side.

const UA = "Mozilla/5.0 (compatible; minitor/0.1; +https://github.com/anthropics/claude-code)";
const BASE = "https://t.me/s";

const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&#39;": "'",
  "&#33;": "!",
  "&nbsp;": " ",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&(?:amp|lt|gt|quot|apos|nbsp|#39|#33);/g, (m) => NAMED_ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

// <br> → newline; emoji <i>/<tg-emoji> → keep inner text; everything else stripped.
function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n");
  const stripped = withBreaks
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
  return decodeEntities(stripped).trim();
}

function parseViews(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  const m = /^([0-9]+(?:\.[0-9]+)?)\s*([KMG]?)$/i.exec(t);
  if (!m) {
    const n = Number(t.replace(/[^\d]/g, ""));
    return Number.isFinite(n) ? n : undefined;
  }
  const base = Number(m[1]);
  const mult =
    m[2].toUpperCase() === "K"
      ? 1_000
      : m[2].toUpperCase() === "M"
        ? 1_000_000
        : m[2].toUpperCase() === "G"
          ? 1_000_000_000
          : 1;
  return Math.round(base * mult);
}

function normalizeChannelHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^@+/, "")
    .replace(/^https?:\/\/t\.me\//i, "")
    .replace(/^t\.me\//i, "")
    .replace(/^s\//, "")
    .replace(/[\s/].*$/, "");
}

export function parseChannelList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\s,]+/)) {
    const handle = normalizeChannelHandle(part);
    if (handle && !seen.has(handle.toLowerCase())) {
      seen.add(handle.toLowerCase());
      out.push(handle);
    }
  }
  return out;
}

interface ParsedPost {
  channel: string;
  channelTitle?: string;
  postId: string;
  url: string;
  textHtml: string;
  textPlain: string;
  createdAt: string;
  views?: number;
  authorName?: string;
  avatarUrl?: string;
}

function extractChannelTitle(html: string): string | undefined {
  const m =
    /tgme_channel_info_header_title"[^>]*>\s*(?:<span[^>]*>)?([^<]+)/i.exec(html) ||
    /tgme_page_title"[^>]*>\s*(?:<span[^>]*>)?([^<]+)/i.exec(html);
  return m ? decodeEntities(m[1]).trim() : undefined;
}

function parseChannelHtml(html: string, fallbackChannel: string): ParsedPost[] {
  const channelTitle = extractChannelTitle(html);
  const blocks = html.split(/<div class="tgme_widget_message_wrap[^"]*"/);
  const posts: ParsedPost[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const chunk = blocks[i];
    const dataPost = /data-post="([^"/]+)\/(\d+)"/.exec(chunk);
    if (!dataPost) continue;
    const channel = dataPost[1];
    const postId = dataPost[2];

    const dateMatch =
      /<a class="tgme_widget_message_date"[^>]*href="(https?:\/\/t\.me\/[^"]+)"[^>]*>\s*<time[^>]*datetime="([^"]+)"/i.exec(
        chunk,
      );
    if (!dateMatch) continue;
    const url = dateMatch[1];
    const createdAt = new Date(dateMatch[2]).toISOString();

    const textMatch =
      /<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/i.exec(
        chunk,
      );
    const textHtml = textMatch ? textMatch[1] : "";
    const textPlain = textHtml ? htmlToText(textHtml) : "";

    const viewsMatch = /tgme_widget_message_views"[^>]*>([^<]+)</i.exec(chunk);
    const views = parseViews(viewsMatch?.[1]);

    const ownerMatch =
      /tgme_widget_message_owner_name"[^>]*>(?:<span[^>]*>)?([^<]+)/i.exec(chunk);
    const authorName = ownerMatch ? decodeEntities(ownerMatch[1]).trim() : undefined;

    const avatarMatch =
      /tgme_widget_message_user_photo[^>]*>\s*<img[^>]+src="([^"]+)"/i.exec(chunk);

    posts.push({
      channel: channel || fallbackChannel,
      channelTitle,
      postId,
      url,
      textHtml,
      textPlain,
      createdAt,
      views,
      authorName,
      avatarUrl: avatarMatch?.[1],
    });
  }
  return posts;
}

async function fetchChannelPage(channel: string): Promise<ParsedPost[]> {
  const url = `${BASE}/${encodeURIComponent(channel)}`;
  const res = await fetch(url, {
    headers: { "user-agent": UA, accept: "text/html" },
    cache: "no-store",
    redirect: "follow",
  });
  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Telegram ${res.status} for @${channel}`);
  }
  const html = await res.text();
  return parseChannelHtml(html, channel);
}

function looksLikeUrl(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (/^https?:\/\//i.test(t)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/[^\s]*)?$/i.test(t);
}

function urlNeedles(raw: string): string[] {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return [];
  const stripped = trimmed
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
  const noPath = stripped.split("/")[0];
  return Array.from(new Set([trimmed, stripped, noPath])).filter(Boolean);
}

function postMatches(
  post: ParsedPost,
  query: string,
  matchMode: "keyword" | "url",
): boolean {
  const q = query.trim();
  if (!q) return true;
  const mode = matchMode === "url" || (matchMode === "keyword" && looksLikeUrl(q))
    ? "url"
    : "keyword";

  if (mode === "url") {
    const haystack = `${post.textHtml}\n${post.textPlain}`.toLowerCase();
    return urlNeedles(q).some((n) => haystack.includes(n));
  }
  return post.textPlain.toLowerCase().includes(q.toLowerCase());
}

export interface TelegramHitMeta {
  channel: string;
  channelTitle?: string;
  postId: string;
  views?: number;
  [key: string]: unknown;
}

export interface TelegramSearchOpts {
  channels: string;
  query: string;
  matchMode: "keyword" | "url";
  limit: number;
}

export async function fetchTelegramChannelMentions(
  opts: TelegramSearchOpts,
): Promise<FeedItem<TelegramHitMeta>[]> {
  const handles = parseChannelList(opts.channels);
  if (handles.length === 0) return [];

  const pages = await Promise.all(
    handles.map((h) =>
      fetchChannelPage(h).catch(() => [] as ParsedPost[]),
    ),
  );

  const merged: ParsedPost[] = [];
  for (const page of pages) {
    for (const post of page) {
      if (postMatches(post, opts.query, opts.matchMode)) merged.push(post);
    }
  }
  merged.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return merged.slice(0, opts.limit).map((p) => {
    const author = p.authorName ?? p.channelTitle ?? p.channel;
    return {
      id: `${p.channel}/${p.postId}`,
      author: {
        name: author,
        handle: p.channel,
        avatarUrl:
          p.avatarUrl ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(p.channel)}`,
      },
      content: p.textPlain || "(no text)",
      url: p.url,
      createdAt: p.createdAt,
      meta: {
        channel: p.channel,
        channelTitle: p.channelTitle,
        postId: p.postId,
        views: p.views,
      },
    };
  });
}
