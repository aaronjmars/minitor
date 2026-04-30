"use client";

import {
  CircleDot,
  GitBranch,
  GitGraph,
  GitMerge,
  GitPullRequest,
  Star,
  Tag,
  MessageSquareText,
} from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import type { ColumnType, FeedItem } from "@/lib/columns/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type GHConfig = {
  mode: "trending" | "releases" | "issues";
  language: string;
  period: "day" | "week" | "month";
  repo: string;
  query: string;
};

const DEFAULT: GHConfig = {
  mode: "trending",
  language: "",
  period: "week",
  repo: "",
  query: "",
};

const PERIOD_LABEL: Record<GHConfig["period"], string> = {
  day: "today",
  week: "this week",
  month: "this month",
};

function compact(n: number): string {
  if (Math.abs(n) < 1000) return String(n);
  if (Math.abs(n) < 1_000_000)
    return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

function ConfigForm({
  value,
  onChange,
}: {
  value: GHConfig;
  onChange: (v: GHConfig) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label>Mode</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as GHConfig["mode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trending">Trending repos</SelectItem>
            <SelectItem value="releases">Repo releases</SelectItem>
            <SelectItem value="issues">Issues / PRs search</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.mode === "trending" && (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="gh-lang">Language (optional)</Label>
            <Input
              id="gh-lang"
              placeholder="typescript, rust, python..."
              value={value.language}
              onChange={(e) => onChange({ ...value, language: e.target.value })}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Window</Label>
            <Select
              value={value.period}
              onValueChange={(v) =>
                onChange({ ...value, period: v as GHConfig["period"] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {value.mode === "releases" && (
        <div className="grid gap-1.5">
          <Label htmlFor="gh-repo">Repository</Label>
          <Input
            id="gh-repo"
            placeholder="vercel/next.js"
            value={value.repo}
            onChange={(e) => onChange({ ...value, repo: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Use the <code>owner/repo</code> form.
          </p>
        </div>
      )}

      {value.mode === "issues" && (
        <div className="grid gap-1.5">
          <Label htmlFor="gh-q">Query</Label>
          <Input
            id="gh-q"
            placeholder='repo:vercel/next.js is:open label:bug'
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Full GitHub issue-search syntax (
            <code>is:open</code>, <code>repo:</code>, <code>label:</code>, etc.).
          </p>
        </div>
      )}
    </div>
  );
}

function ItemRenderer({ item }: { item: FeedItem }) {
  const m = item.meta ?? {};
  const kind = typeof m.kind === "string" ? m.kind : "repo";

  const [title, ...rest] = item.content.split("\n\n");
  const snippet = rest.join("\n\n").trim();

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <KindBadge kind={kind} meta={m} />
        <span className="truncate text-foreground/80">
          {item.author.handle ?? item.author.name}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span className="tabular-nums">
          <RelativeTime date={item.createdAt} addSuffix />
        </span>
      </div>
      <h3
        className="mt-1 font-serif text-[16px] leading-[1.3] text-foreground break-words transition-colors group-hover/item:text-[color:var(--brand-hover)]"
        style={{ letterSpacing: "-0.005em", fontFeatureSettings: '"cswh" 1' }}
      >
        {title}
      </h3>
      {snippet && (
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-snug text-muted-foreground break-words whitespace-pre-line">
          {snippet}
        </p>
      )}
      <MetaRow kind={kind} meta={m} />
    </a>
  );
}

function KindBadge({
  kind,
  meta,
}: {
  kind: string;
  meta: Record<string, unknown>;
}) {
  const repo = typeof meta.repo === "string" ? meta.repo : undefined;

  if (kind === "release") {
    const tag = typeof meta.tag === "string" ? meta.tag : "";
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
        style={{ backgroundColor: "rgba(159, 201, 162, 0.28)" }}
      >
        <Tag className="size-3" />
        {tag || "release"}
      </span>
    );
  }

  if (kind === "pr" || kind === "issue") {
    const state = typeof meta.state === "string" ? meta.state : "open";
    const Icon =
      kind === "pr"
        ? state === "closed"
          ? GitMerge
          : GitPullRequest
        : CircleDot;
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
        style={{
          backgroundColor:
            state === "closed"
              ? "rgba(192, 168, 221, 0.32)"
              : "rgba(223, 168, 143, 0.28)",
        }}
      >
        <Icon className="size-3" />
        {kind === "pr" ? "PR" : "issue"}
        {repo && <span className="text-foreground/70">· {repo}</span>}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
      style={{ backgroundColor: "rgba(159, 187, 224, 0.32)" }}
    >
      <GitBranch className="size-3" />
      repo
    </span>
  );
}

function MetaRow({
  kind,
  meta,
}: {
  kind: string;
  meta: Record<string, unknown>;
}) {
  if (kind === "repo") {
    const stars = typeof meta.stars === "number" ? meta.stars : 0;
    const forks = typeof meta.forks === "number" ? meta.forks : 0;
    const language = typeof meta.language === "string" ? meta.language : "";
    return (
      <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="size-3.5" />
          <span className="tabular-nums">{compact(stars)}</span>
        </span>
        <span className="flex items-center gap-1">
          <GitBranch className="size-3.5" />
          <span className="tabular-nums">{compact(forks)}</span>
        </span>
        {language && (
          <span className="truncate text-foreground/70">{language}</span>
        )}
      </div>
    );
  }

  if (kind === "pr" || kind === "issue") {
    const comments = typeof meta.comments === "number" ? meta.comments : 0;
    const number = typeof meta.number === "number" ? meta.number : undefined;
    return (
      <div className="mt-2 flex items-center gap-4 text-[11.5px] text-muted-foreground">
        {number !== undefined && (
          <span className="tabular-nums text-foreground/70">#{number}</span>
        )}
        <span className="flex items-center gap-1">
          <MessageSquareText className="size-3.5" />
          <span className="tabular-nums">{compact(comments)}</span>
        </span>
      </div>
    );
  }

  return null;
}

function defaultTitle(c: GHConfig): string {
  if (c.mode === "releases") {
    return c.repo.trim() ? `Releases · ${c.repo.trim()}` : "GitHub · Releases";
  }
  if (c.mode === "issues") {
    return c.query.trim() ? `Issues · ${c.query.trim()}` : "GitHub · Issues";
  }
  const lang = c.language.trim() ? `${c.language.trim()} · ` : "";
  return `Trending · ${lang}${PERIOD_LABEL[c.period]}`;
}

export const githubType: ColumnType<GHConfig> = {
  id: "github",
  label: "GitHub",
  description: "Trending repos, repo releases, or issue/PR search.",
  icon: GitGraph,
  accent: "#26251e",
  defaultConfig: DEFAULT,
  defaultTitle,
  ConfigForm,
  ItemRenderer,
  paginated: true,
};
