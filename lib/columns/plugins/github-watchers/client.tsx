"use client";

import { GitFork, Star } from "lucide-react";
import { RelativeTime } from "@/components/relative-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import { meta, type GHWatchersConfig, type GHWatchersMeta } from "./plugin";

function ConfigForm({ value, onChange }: ConfigFormProps<GHWatchersConfig>) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="ghw-repo">Repository</Label>
        <Input
          id="ghw-repo"
          placeholder="vercel/next.js"
          value={value.repo}
          onChange={(e) => onChange({ ...value, repo: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          <code>owner/repo</code> or full GitHub URL.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label>Show</Label>
        <Select
          value={value.mode}
          onValueChange={(v) =>
            onChange({ ...value, mode: v as GHWatchersConfig["mode"] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="both">Stars &amp; forks</SelectItem>
            <SelectItem value="stars">Stars only</SelectItem>
            <SelectItem value="forks">Forks only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: GHWatchersMeta["kind"] }) {
  if (kind === "star") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
        style={{ backgroundColor: "rgba(245, 166, 35, 0.22)" }}
      >
        <Star className="size-3" />
        Starred
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
      style={{ backgroundColor: "rgba(159, 187, 224, 0.32)" }}
    >
      <GitFork className="size-3" />
      Forked
    </span>
  );
}

function ItemRenderer({ item }: ItemRendererProps<GHWatchersMeta>) {
  const m = item.meta;
  const handle = item.author.handle ?? item.author.name;
  const repo = m?.repo ?? "";
  const repoUrl = repo ? `https://github.com/${repo}` : undefined;

  return (
    <article className="border-b border-border px-3.5 py-3">
      <div className="flex items-start gap-2.5">
        {item.author.avatarUrl && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.author.avatarUrl}
              alt={handle}
              className="size-8 rounded-full ring-1 ring-black/5"
              loading="lazy"
            />
          </a>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
            {m && <KindBadge kind={m.kind} />}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="truncate font-medium text-foreground/90 hover:text-[color:var(--brand-hover)]"
            >
              {handle}
            </a>
            <span className="text-muted-foreground/50">·</span>
            <span className="tabular-nums">
              <RelativeTime date={item.createdAt} addSuffix />
            </span>
          </div>
          {repo && (
            <p className="mt-1 text-[13.5px] text-foreground break-words">
              {m?.kind === "fork" && m.forkUrl ? (
                <>
                  forked{" "}
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:text-[color:var(--brand-hover)]"
                  >
                    {repo}
                  </a>{" "}
                  →{" "}
                  <a
                    href={m.forkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-foreground/80 hover:text-[color:var(--brand-hover)]"
                  >
                    {m.forkUrl.replace(/^https?:\/\/github\.com\//, "")}
                  </a>
                </>
              ) : (
                <>
                  starred{" "}
                  <a
                    href={repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:text-[color:var(--brand-hover)]"
                  >
                    {repo}
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export const column = defineColumnUI<GHWatchersConfig, GHWatchersMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
