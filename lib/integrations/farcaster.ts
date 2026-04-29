import type { FeedItem } from "@/lib/columns/types";

// =============================================================================
// FARCASTER VIA NEYNAR
//
// Exposed today: USER mode + SEARCH mode (with demo-key fallback).
// Still gated: TRENDING and CHANNEL — both require Neynar Starter+ paid plan
// ($9/mo as of 2026-04). Hitting them on a free key returns 402 PaymentRequired.
//
// Search trick: Neynar publishes a public demo key (NEYNAR_API_DOCS) used in
// their docs that responds to /cast/search even on the free tier. We try the
// user's key first; on 402 we fall back to the demo key. It's rate-limited at
// the demo bucket (small) but it works for low-volume monitoring.
//
// To re-enable Trending / Channel when the plan is upgraded:
//   1. Add cases for "trending" and "channel" in fetchFarcaster (already present below).
//   2. Restore the multi-mode dispatch in app/api/columns/[type]/route.ts.
//   3. Restore the mode selector + per-mode inputs in lib/columns/farcaster.tsx.
//
// Public-hub fallbacks were investigated and ruled out: the major free hubs
// (Pinata, Neynar, nemes/lamia) are now down, paywalled, or unreachable as of
// 2026-04. Self-hosted Snapchain (~30GB, $25/mo VPS) is the only keyless path.
// =============================================================================

const NEYNAR = "https://api.neynar.com";

export type FCMode = "trending" | "channel" | "user" | "search";
export type FCWindow = "1h" | "6h" | "24h" | "7d" | "30d";

interface NeynarAuthor {
  fid?: number;
  username?: string;
  display_name?: string;
  pfp_url?: string;
  follower_count?: number;
  power_badge?: boolean;
}

interface NeynarReactions {
  likes_count?: number;
  recasts_count?: number;
}

interface NeynarReplies {
  count?: number;
}

interface NeynarChannel {
  id?: string;
  name?: string;
  image_url?: string;
}

interface NeynarCast {
  hash?: string;
  thread_hash?: string;
  parent_hash?: string | null;
  author?: NeynarAuthor;
  text?: string;
  timestamp?: string;
  reactions?: NeynarReactions;
  replies?: NeynarReplies;
  channel?: NeynarChannel | null;
  embeds?: Array<{ url?: string; cast_id?: { hash?: string } }>;
}

interface NeynarCastsResponse {
  casts?: NeynarCast[];
  result?: { casts?: NeynarCast[] };
  message?: string;
}

interface NeynarUserLookupResponse {
  user?: { fid?: number; username?: string };
  result?: { user?: { fid?: number; username?: string } };
}

const DEMO_KEY = "NEYNAR_API_DOCS";

function headersWith(key: string): HeadersInit {
  return {
    "x-api-key": key,
    accept: "application/json",
    "user-agent": "minitor/0.1",
  };
}

function userKey(): string {
  const key = process.env.NEYNAR_API_KEY;
  if (!key) {
    throw new Error(
      "NEYNAR_API_KEY is not set in .env.local. Get one free at https://neynar.com.",
    );
  }
  return key;
}

async function neynar<T>(
  path: string,
  options?: { fallbackToDemoOn402?: boolean },
): Promise<T> {
  const url = `${NEYNAR}${path}`;
  const res = await fetch(url, {
    headers: headersWith(userKey()),
    cache: "no-store",
  });

  if (res.status === 402 && options?.fallbackToDemoOn402) {
    const demoRes = await fetch(url, {
      headers: headersWith(DEMO_KEY),
      cache: "no-store",
    });
    if (!demoRes.ok) {
      const body = await demoRes.text().catch(() => "");
      throw new Error(
        `Neynar ${demoRes.status} (demo fallback): ${body.slice(0, 240)}`,
      );
    }
    return (await demoRes.json()) as T;
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Neynar ${res.status}: ${body.slice(0, 240)}`);
  }
  return (await res.json()) as T;
}

function castUrl(c: NeynarCast): string {
  const username = c.author?.username;
  const hash = c.hash;
  if (username && hash) {
    return `https://warpcast.com/${username}/${hash.slice(0, 10)}`;
  }
  return "https://warpcast.com";
}

function castToFeedItem(c: NeynarCast): FeedItem | null {
  const text = (c.text ?? "").trim();
  if (!text || !c.hash) return null;
  const author = c.author ?? {};
  const username = author.username ?? `fid-${author.fid ?? "?"}`;
  return {
    id: c.hash,
    author: {
      name: author.display_name ?? username,
      handle: username,
      avatarUrl:
        author.pfp_url ??
        `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
    },
    content: text,
    url: castUrl(c),
    createdAt: c.timestamp ?? new Date().toISOString(),
    meta: {
      likes: c.reactions?.likes_count ?? 0,
      recasts: c.reactions?.recasts_count ?? 0,
      replies: c.replies?.count ?? 0,
      followers: author.follower_count ?? 0,
      powerBadge: !!author.power_badge,
      channelId: c.channel?.id ?? undefined,
      channelName: c.channel?.name ?? undefined,
      fid: author.fid,
      isFarcaster: true,
    },
  };
}

function mapCasts(casts: NeynarCast[], limit: number): FeedItem[] {
  return casts
    .map(castToFeedItem)
    .filter((it): it is FeedItem => it !== null)
    .slice(0, limit);
}

async function resolveFid(usernameOrFid: string): Promise<number> {
  const raw = usernameOrFid.trim().replace(/^@/, "");
  if (!raw) throw new Error("Username or FID is required.");
  if (/^\d+$/.test(raw)) return Number(raw);
  const json = await neynar<NeynarUserLookupResponse>(
    `/v2/farcaster/user/by_username?username=${encodeURIComponent(raw)}`,
  );
  const fid = json.user?.fid ?? json.result?.user?.fid;
  if (!fid) throw new Error(`Couldn't resolve @${raw} on Farcaster.`);
  return fid;
}

export async function fetchFarcasterUser(
  usernameOrFid: string,
  limit = 12,
): Promise<FeedItem[]> {
  const fid = await resolveFid(usernameOrFid);
  const params = new URLSearchParams({
    fid: String(fid),
    limit: String(limit),
    include_replies: "false",
  });
  const json = await neynar<NeynarCastsResponse>(
    `/v2/farcaster/feed/user/casts?${params}`,
  );
  const casts = json.casts ?? json.result?.casts ?? [];
  return mapCasts(casts, limit);
}

// -----------------------------------------------------------------------------
// PAID-TIER HELPERS — kept intentionally for re-enable. Currently NOT exported.
// All three return 402 PaymentRequired on Neynar's free tier.
// -----------------------------------------------------------------------------

async function fetchTrending(
  windowSize: FCWindow,
  channelId: string,
  limit: number,
): Promise<FeedItem[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    time_window: windowSize,
  });
  if (channelId.trim()) params.set("channel_id", channelId.trim());
  const json = await neynar<NeynarCastsResponse>(
    `/v2/farcaster/feed/trending?${params}`,
  );
  const casts = json.casts ?? json.result?.casts ?? [];
  return mapCasts(casts, limit);
}

async function fetchChannel(
  channelId: string,
  limit: number,
): Promise<FeedItem[]> {
  const id = channelId.trim().replace(/^\//, "").toLowerCase();
  if (!id) throw new Error("Channel id is required (e.g. dev, design, base).");
  const params = new URLSearchParams({
    feed_type: "filter",
    filter_type: "channel_id",
    channel_id: id,
    limit: String(limit),
  });
  const json = await neynar<NeynarCastsResponse>(
    `/v2/farcaster/feed?${params}`,
  );
  const casts = json.casts ?? json.result?.casts ?? [];
  return mapCasts(casts, limit);
}

export async function fetchFarcasterSearch(
  query: string,
  limit = 12,
): Promise<FeedItem[]> {
  const q = query.trim();
  if (!q) throw new Error("Query is required.");
  const params = new URLSearchParams({ q, limit: String(limit) });
  // Trailing slash on /search/ matters — that's what Neynar's docs use, and
  // the user's free tier only resolves that variant via demo-key fallback.
  const json = await neynar<NeynarCastsResponse>(
    `/v2/farcaster/cast/search/?${params}`,
    { fallbackToDemoOn402: true },
  );
  const casts = json.casts ?? json.result?.casts ?? [];
  return mapCasts(casts, limit);
}

async function fetchSearch(query: string, limit: number): Promise<FeedItem[]> {
  return fetchFarcasterSearch(query, limit);
}

// Multi-mode dispatcher — wire this back up in route.ts when the plan is upgraded.
async function fetchFarcaster(
  mode: FCMode,
  config: {
    channelId?: string;
    username?: string;
    query?: string;
    window?: string;
  },
  limit = 12,
): Promise<FeedItem[]> {
  switch (mode) {
    case "channel":
      return fetchChannel(config.channelId ?? "", limit);
    case "user":
      return fetchFarcasterUser(config.username ?? "", limit);
    case "search":
      return fetchSearch(config.query ?? "", limit);
    case "trending":
    default: {
      const w = (config.window === "1h" ||
      config.window === "6h" ||
      config.window === "7d" ||
      config.window === "30d"
        ? config.window
        : "24h") as FCWindow;
      return fetchTrending(w, config.channelId ?? "", limit);
    }
  }
}

// Suppress "declared but never read" — these are intentionally kept for re-enable.
void fetchFarcaster;
