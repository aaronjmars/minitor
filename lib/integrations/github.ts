import type { FeedItem } from "@/lib/columns/types";

const API = "https://api.github.com";

export type GHMode = "trending" | "releases" | "issues";

export type GHSearchScope = "repositories" | "issues" | "code" | "commits";

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

// ---- Free-form search across scopes (used by github-search plugin) ---------

interface GHCodeResult {
  sha: string;
  name: string;
  path: string;
  html_url: string;
  repository: {
    full_name: string;
    pushed_at?: string;
    owner?: { login: string; avatar_url?: string };
  };
  text_matches?: Array<{ fragment?: string }>;
}

interface GHCommitResult {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: { name?: string; email?: string; date?: string };
  };
  author?: { login: string; avatar_url?: string } | null;
  repository: { full_name: string };
}

function buildQuery(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  // GitHub indexes URLs in code/issues but tokenizes on punctuation, so a
  // bare URL becomes many separate matches. Quote it for an exact match —
  // unless the user already wrapped it themselves.
  if (/^https?:\/\//i.test(trimmed) && !/^".*"$/.test(trimmed)) {
    return `"${trimmed}"`;
  }
  return trimmed;
}

async function searchRepos(
  query: string,
  limit: number,
  page: number,
): Promise<FeedItem[]> {
  const params = new URLSearchParams({
    q: query,
    sort: "updated",
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
      id: `ghs-repo-${r.id}`,
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
      createdAt: r.pushed_at ?? r.created_at,
      meta: {
        scope: "repositories" as const,
        repo: r.full_name,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language ?? undefined,
      },
    } satisfies FeedItem;
  });
}

async function searchIssuesScope(
  query: string,
  limit: number,
  page: number,
): Promise<FeedItem[]> {
  const params = new URLSearchParams({
    q: query,
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
    const isPr = !!i.pull_request;
    const repo = i.repository_url.replace(`${API}/repos/`, "");
    const body = (i.body ?? "").trim();
    const trimmed =
      body.length > 400 ? `${body.slice(0, 400).trimEnd()}…` : body;
    return {
      id: `ghs-iss-${i.id}`,
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
        scope: "issues" as const,
        repo,
        number: i.number,
        state: i.state,
        comments: i.comments,
        isPr,
      },
    } satisfies FeedItem;
  });
}

async function searchCode(
  query: string,
  limit: number,
  page: number,
): Promise<FeedItem[]> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      "GitHub code search requires a token. Set GITHUB_TOKEN in your env (read-only public scope is enough).",
    );
  }
  const params = new URLSearchParams({
    q: query,
    per_page: String(limit),
    page: String(page),
  });
  const res = await fetch(`${API}/search/code?${params}`, {
    headers: {
      ...(headers() as Record<string, string>),
      // text-match returns a `fragment` snippet around each hit
      accept: "application/vnd.github.text-match+json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GitHub ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as GHSearchResponse<GHCodeResult>;
  if (json.message) throw new Error(json.message);
  return (json.items ?? []).slice(0, limit).map((c) => {
    const owner =
      c.repository.owner?.login ??
      c.repository.full_name.split("/")[0] ??
      "github";
    const fragment = (c.text_matches?.[0]?.fragment ?? "").trim();
    const snippet =
      fragment.length > 400
        ? `${fragment.slice(0, 400).trimEnd()}…`
        : fragment;
    const title = `${c.repository.full_name} · ${c.path}`;
    return {
      id: `ghs-code-${c.repository.full_name}-${c.sha}-${c.path}`,
      author: {
        name: owner,
        handle: owner,
        avatarUrl:
          c.repository.owner?.avatar_url ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(owner)}`,
      },
      content: snippet ? `${title}\n\n${snippet}` : title,
      url: c.html_url,
      createdAt: c.repository.pushed_at ?? new Date().toISOString(),
      meta: {
        scope: "code" as const,
        repo: c.repository.full_name,
        path: c.path,
        sha: c.sha,
      },
    } satisfies FeedItem;
  });
}

async function searchCommits(
  query: string,
  limit: number,
  page: number,
): Promise<FeedItem[]> {
  const params = new URLSearchParams({
    q: query,
    sort: "author-date",
    order: "desc",
    per_page: String(limit),
    page: String(page),
  });
  const json = await ghFetch<GHSearchResponse<GHCommitResult>>(
    `${API}/search/commits?${params}`,
  );
  if (json.message) throw new Error(json.message);
  return (json.items ?? []).slice(0, limit).map((c) => {
    const handle =
      c.author?.login ?? c.commit.author?.name ?? "unknown";
    const message = (c.commit.message ?? "").trim();
    const [firstLine, ...rest] = message.split("\n");
    const restJoined = rest.join("\n").trim();
    const trimmed =
      restJoined.length > 400
        ? `${restJoined.slice(0, 400).trimEnd()}…`
        : restJoined;
    return {
      id: `ghs-commit-${c.sha}`,
      author: {
        name: handle,
        handle,
        avatarUrl:
          c.author?.avatar_url ??
          `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(handle)}`,
      },
      content: trimmed ? `${firstLine}\n\n${trimmed}` : firstLine,
      url: c.html_url,
      createdAt: c.commit.author?.date ?? new Date().toISOString(),
      meta: {
        scope: "commits" as const,
        repo: c.repository.full_name,
        sha: c.sha,
      },
    } satisfies FeedItem;
  });
}

export async function searchGitHub(
  scope: GHSearchScope,
  rawQuery: string,
  limit = 12,
  page = 1,
): Promise<FeedItem[]> {
  const query = buildQuery(rawQuery);
  if (!query) {
    throw new Error("Query is required for GitHub search.");
  }
  switch (scope) {
    case "repositories":
      return searchRepos(query, limit, page);
    case "issues":
      return searchIssuesScope(query, limit, page);
    case "code":
      return searchCode(query, limit, page);
    case "commits":
      return searchCommits(query, limit, page);
  }
}
