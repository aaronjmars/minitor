"use client";

import { RelativeTime } from "@/components/relative-time";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defineColumnUI,
  type ConfigFormProps,
  type ItemRendererProps,
} from "@/lib/columns/types";
import {
  meta,
  type MentionsConfig,
  type MentionsItemMeta,
} from "./plugin";

type Source = MentionsItemMeta["mentionSource"];

const SOURCE_LABEL: Record<Source, string> = {
  hn: "HN",
  reddit: "Reddit",
  "google-news": "Google",
  "bing-news": "Bing",
};

const SOURCE_BG: Record<Source, string> = {
  hn: "rgba(255, 102, 0, 0.18)",
  reddit: "rgba(245, 78, 0, 0.18)",
  "google-news": "rgba(159, 201, 162, 0.32)",
  "bing-news": "rgba(159, 187, 224, 0.32)",
};

const SOURCE_ORDER: Source[] = ["hn", "reddit", "google-news", "bing-news"];

function ConfigForm({ value, onChange }: ConfigFormProps<MentionsConfig>) {
  function toggle(src: Source) {
    onChange({
      ...value,
      sources: { ...value.sources, [src]: !value.sources[src] },
    });
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-1.5">
        <Label htmlFor="mentions-q">Query / domain</Label>
        <Input
          id="mentions-q"
          placeholder='"yourdomain.com" or "your product"'
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Quote phrases to match exactly. Searches across HN, Reddit, Google
          News, and Bing News in parallel and dedupes by URL.
        </p>
      </div>
      <div className="grid gap-1.5">
        <Label>Sources</Label>
        <div className="flex flex-wrap gap-1.5">
          {SOURCE_ORDER.map((s) => {
            const on = value.sources[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggle(s)}
                className={`rounded-full px-2.5 py-1 text-[12px] font-medium ring-1 transition-colors ${
                  on
                    ? "bg-foreground text-primary-foreground ring-foreground"
                    : "bg-transparent text-muted-foreground ring-border hover:text-foreground"
                }`}
              >
                {SOURCE_LABEL[s]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ItemRenderer({ item }: ItemRendererProps<MentionsItemMeta>) {
  const source = item.meta?.mentionSource ?? "google-news";
  const sourceLabel = SOURCE_LABEL[source] ?? source;
  const bg = SOURCE_BG[source] ?? "rgba(0,0,0,0.06)";

  const [title, ...rest] = item.content.split("\n\n");
  const snippet = rest.join("\n\n").trim();
  const hostName = (() => {
    try {
      return new URL(item.url ?? "").hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group/item block border-b border-border px-3.5 py-3 transition-colors hover:bg-surface/60"
    >
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"
          style={{ backgroundColor: bg }}
        >
          {sourceLabel}
        </span>
        {hostName && (
          <span className="truncate max-w-[200px] text-foreground/80">
            {hostName}
          </span>
        )}
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
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-muted-foreground break-words">
          {snippet}
        </p>
      )}
    </a>
  );
}

export const column = defineColumnUI<MentionsConfig, MentionsItemMeta>({
  ...meta,
  ConfigForm,
  ItemRenderer,
});
