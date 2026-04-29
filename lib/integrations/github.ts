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
