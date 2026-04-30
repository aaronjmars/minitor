import type { FeedItem } from "@/lib/columns/types";

const API = "https://api.github.com";

export type GHMode = "trending" | "releases" | "issues";

interface GHRepo {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  created_at: string;
  owner?: { login: string; avatar_url?: string };
}

interface GHRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string | null;
  created_at: string;
  prerelease: boolean;
  draft: boolean;
  author?: { login: string; avatar_url?: string };
}

interface GHIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  pull_request?: unknown;
  repository_url: string;
  user?: { login: string; avatar_url?: string };
  comments: number;
  reactions?: { total_count?: number };
}

interface GHSearchResponse<T> {
  items?: T[];
  message?: string;
  total_count?: number;
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "minitor/0.1",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

async function ghFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

function isoNDaysAgo(n: number): string {
  return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
}

async function fetchTrending(
  language: string,
  period: "day" | "week" | "month",
  limit: number,
  page = 1,
): Promise<FeedItem[]> {
  const days = period === "day" ? 1 : period === "week" ? 7 : 30;
  const q = [
    `created:>${isoNDaysAgo(days)}`,
    language.trim() ? `language:${language.trim()}` : "",
    "stars:>5",
  ]
    .filter(Boolean)
    .join(" ");
  const params = new URLSearchParams({
    q,
    sort: "stars",
    order: "desc",
    per_page: String(limit),
    page: String(page),
  });
  const json = await ghFetch<GHSearchResponse<GHRepo>>(
    `${API}/search/repositories?${params}`,
  );
  if (json.message) throw new Error(json.message);
  return (json.items ?? []).slice(0, limit).map((r) => {
    const owner = r.owner?.login ?? r.full_name.split("/")[0] ?? "github";
    return {
      id: `repo-${r.id}`,
      author: {
        name: owner,
        handle: owner,
        avatarUrl:
          r.owner?.avatar_url ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(owner)}`,
      },
      content: r.description
        ? `${r.full_name}\n\n${r.description}`
        : r.full_name,
      url: r.html_url,
      createdAt: r.created_at,
      meta: {
        kind: "repo",
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language ?? undefined,
        repo: r.full_name,
      },
    } satisfies FeedItem;
  });
}

async function fetchReleases(
  repo: string,
  limit: number,
  page = 1,
): Promise<FeedItem[]> {
  const clean = repo.trim().replace(/^https?:\/\/github\.com\//, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(clean)) {
    throw new Error(`Invalid repo "${repo}". Use owner/repo (e.g. vercel/next.js).`);
  }
  const params = new URLSearchParams({
    per_page: String(limit),
    page: String(page),
  });
  const releases = await ghFetch<GHRelease[]>(
    `${API}/repos/${clean}/releases?${params}`,
  );
  return releases
    .filter((r) => !r.draft)
    .slice(0, limit)
    .map((r) => {
      const author = r.author?.login ?? clean.split("/")[0] ?? "github";
      const title = r.name?.trim() || r.tag_name;
      const body = (r.body ?? "").trim();
      const trimmed =
        body.length > 600 ? `${body.slice(0, 600).trimEnd()}…` : body;
      return {
        id: `rel-${r.id}`,
        author: {
          name: clean,
          handle: author,
          avatarUrl:
            r.author?.avatar_url ??
            `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(clean)}`,
        },
        content: trimmed ? `${title}\n\n${trimmed}` : title,
        url: r.html_url,
        createdAt: r.published_at ?? r.created_at,
        meta: {
          kind: "release",
          repo: clean,
          tag: r.tag_name,
          prerelease: r.prerelease,
        },
      } satisfies FeedItem;
    });
}

async function fetchIssues(
  query: string,
  limit: number,
  page = 1,
): Promise<FeedItem[]> {
  if (!query.trim()) {
    throw new Error("Query is required for issue search.");
  }
  const params = new URLSearchParams({
    q: query.trim(),
    sort: "updated",
    order: "desc",
    per_page: String(limit),
    page: String(page),
  });
  const json = await ghFetch<GHSearchResponse<GHIssue>>(
    `${API}/search/issues?${params}`,
  );
  if (json.message) throw new Error(json.message);
  return (json.items ?? []).slice(0, limit).map((i) => {
    const user = i.user?.login ?? "anonymous";
    const isPR = !!i.pull_request;
    const repo = i.repository_url.replace(`${API}/repos/`, "");
    const body = (i.body ?? "").trim();
    const trimmed =
      body.length > 400 ? `${body.slice(0, 400).trimEnd()}…` : body;
    return {
      id: `iss-${i.id}`,
      author: {
        name: user,
        handle: user,
        avatarUrl:
          i.user?.avatar_url ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(user)}`,
      },
      content: trimmed ? `${i.title}\n\n${trimmed}` : i.title,
      url: i.html_url,
      createdAt: i.updated_at ?? i.created_at,
      meta: {
        kind: isPR ? "pr" : "issue",
        repo,
        number: i.number,
        state: i.state,
        comments: i.comments,
      },
    } satisfies FeedItem;
  });
}

export async function fetchGitHub(
  mode: GHMode,
  config: { language?: string; period?: string; repo?: string; query?: string },
  limit = 12,
  page = 1,
): Promise<FeedItem[]> {
  switch (mode) {
    case "releases":
      return fetchReleases(config.repo ?? "", limit, page);
    case "issues":
      return fetchIssues(config.query ?? "", limit, page);
    case "trending":
    default: {
      const period = (config.period === "day" || config.period === "month"
        ? config.period
        : "week") as "day" | "week" | "month";
      return fetchTrending(config.language ?? "", period, limit, page);
    }
  }
}

// ---------------------------------------------------------------------------
// Stargazers + forks (used by the github-watchers plugin)
// ---------------------------------------------------------------------------

export interface GHWatcherItemMeta {
  kind: "star" | "fork";
  repo: string;
  forkUrl?: string;
  starredAt?: string;
  forkedAt?: string;
}

export type GHWatcherItem = FeedItem<GHWatcherItemMeta>;

export interface GHWatcherPage {
  items: GHWatcherItem[];
  nextCursor?: string;
}

export function normalizeGitHubRepo(input: string): string {
  const clean = input
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\/+$/, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(clean)) {
    throw new Error(
      `Invalid repo "${input}". Use owner/repo (e.g. vercel/next.js).`,
    );
  }
  return clean;
}

function parseLastPage(linkHeader: string | null): number | undefined {
  if (!linkHeader) return undefined;
  // Link: <...&page=42>; rel="last", <...&page=2>; rel="next"
  for (const part of linkHeader.split(",")) {
    const m = /<([^>]+)>;\s*rel="last"/.exec(part.trim());
    if (m) {
      try {
        const u = new URL(m[1]);
        const p = u.searchParams.get("page");
        if (p) return Number(p);
      } catch {
        // ignore
      }
    }
  }
  return undefined;
}

interface GHStargazerEdgeREST {
  starred_at: string;
  user: { login: string; avatar_url?: string; html_url?: string };
}

async function ghFetchStargazersPageREST(
  fullRepo: string,
  page: number,
  perPage: number,
): Promise<{ items: GHWatcherItem[]; lastPage?: number }> {
  const params = new URLSearchParams({
    per_page: String(perPage),
    page: String(page),
  });
  const url = `${API}/repos/${fullRepo}/stargazers?${params}`;
  const res = await fetch(url, {
    headers: {
      ...headers(),
      // star+json is required to receive `starred_at` timestamps.
      accept: "application/vnd.github.star+json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 200)}`);
  }
  const lastPage = parseLastPage(res.headers.get("link"));
  const json = (await res.json()) as GHStargazerEdgeREST[];
  const items = json.map((edge) => {
    const u = edge.user;
    return {
      id: `gh-star-${fullRepo}-${u.login}`,
      author: {
        name: u.login,
        handle: u.login,
        avatarUrl:
          u.avatar_url ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(u.login)}`,
      },
      content: `${u.login} starred ${fullRepo}`,
      url: u.html_url ?? `https://github.com/${u.login}`,
      createdAt: edge.starred_at,
      meta: {
        kind: "star",
        repo: fullRepo,
        starredAt: edge.starred_at,
      },
    } satisfies GHWatcherItem;
  });
  return { items, lastPage };
}

interface GHGraphQLStargazersResponse {
  data?: {
    repository: {
      stargazers: {
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
        edges: Array<{
          starredAt: string;
          node: { login: string; avatarUrl?: string; url?: string };
        }>;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

async function fetchStargazersGraphQL(
  fullRepo: string,
  limit: number,
  cursor?: string,
): Promise<GHWatcherPage> {
  const [owner, name] = fullRepo.split("/");
  const query = `
    query($owner:String!, $name:String!, $first:Int!, $after:String) {
      repository(owner:$owner, name:$name) {
        stargazers(first:$first, after:$after, orderBy:{field:STARRED_AT, direction:DESC}) {
          pageInfo { endCursor hasNextPage }
          edges {
            starredAt
            node { login avatarUrl url }
          }
        }
      }
    }
  `;
  const res = await fetch(`${API}/graphql`, {
    method: "POST",
    headers: { ...headers(), "content-type": "application/json" },
    body: JSON.stringify({
      query,
      variables: { owner, name, first: limit, after: cursor ?? null },
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub GraphQL ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as GHGraphQLStargazersResponse;
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  const sg = json.data?.repository?.stargazers;
  if (!sg) throw new Error(`Repository ${fullRepo} not found.`);
  const items = sg.edges.map((edge) => {
    const u = edge.node;
    return {
      id: `gh-star-${fullRepo}-${u.login}`,
      author: {
        name: u.login,
        handle: u.login,
        avatarUrl:
          u.avatarUrl ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(u.login)}`,
      },
      content: `${u.login} starred ${fullRepo}`,
      url: u.url ?? `https://github.com/${u.login}`,
      createdAt: edge.starredAt,
      meta: {
        kind: "star",
        repo: fullRepo,
        starredAt: edge.starredAt,
      },
    } satisfies GHWatcherItem;
  });
  return {
    items,
    nextCursor:
      sg.pageInfo.hasNextPage && sg.pageInfo.endCursor
        ? `gql:${sg.pageInfo.endCursor}`
        : undefined,
  };
}

async function fetchStargazersREST(
  fullRepo: string,
  limit: number,
  cursor?: string,
): Promise<GHWatcherPage> {
  // REST sorts oldest-first. To surface newest-first we must walk the Link
  // header to find the last page, then page backwards from there.
  let pageToFetch: number;
  if (cursor) {
    pageToFetch = Number(cursor);
    if (!Number.isFinite(pageToFetch) || pageToFetch < 1) {
      return { items: [] };
    }
  } else {
    const probe = await ghFetchStargazersPageREST(fullRepo, 1, limit);
    pageToFetch = probe.lastPage ?? 1;
  }
  const { items } = await ghFetchStargazersPageREST(
    fullRepo,
    pageToFetch,
    limit,
  );
  items.reverse();
  return {
    items,
    nextCursor: pageToFetch > 1 ? String(pageToFetch - 1) : undefined,
  };
}

export async function fetchStargazers(
  repo: string,
  limit = 12,
  cursor?: string,
): Promise<GHWatcherPage> {
  const fullRepo = normalizeGitHubRepo(repo);
  if (process.env.GITHUB_TOKEN) {
    return fetchStargazersGraphQL(
      fullRepo,
      limit,
      cursor?.startsWith("gql:") ? cursor.slice(4) : undefined,
    );
  }
  return fetchStargazersREST(fullRepo, limit, cursor);
}

interface GHForkREST {
  id: number;
  full_name: string;
  html_url: string;
  created_at: string;
  owner?: { login: string; avatar_url?: string; html_url?: string };
}

export async function fetchForks(
  repo: string,
  limit = 12,
  cursor?: string,
): Promise<GHWatcherPage> {
  const fullRepo = normalizeGitHubRepo(repo);
  const page = cursor ? Number(cursor) || 1 : 1;
  const params = new URLSearchParams({
    sort: "newest",
    per_page: String(limit),
    page: String(page),
  });
  const forks = await ghFetch<GHForkREST[]>(
    `${API}/repos/${fullRepo}/forks?${params}`,
  );
  const items: GHWatcherItem[] = forks.map((f) => {
    const owner = f.owner?.login ?? f.full_name.split("/")[0] ?? "github";
    return {
      id: `gh-fork-${f.id}`,
      author: {
        name: owner,
        handle: owner,
        avatarUrl:
          f.owner?.avatar_url ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(owner)}`,
      },
      content: `${owner} forked ${fullRepo}`,
      url: f.owner?.html_url ?? `https://github.com/${owner}`,
      createdAt: f.created_at,
      meta: {
        kind: "fork",
        repo: fullRepo,
        forkUrl: f.html_url,
        forkedAt: f.created_at,
      },
    };
  });
  return {
    items,
    nextCursor: items.length === limit ? String(page + 1) : undefined,
  };
}
