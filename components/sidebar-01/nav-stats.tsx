"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useDeckStore } from "@/lib/store/use-deck-store";

function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

// Re-render every minute so "Updated" stays fresh — useSyncExternalStore keeps
// `Date.now()` out of render bodies (React's purity rule).
function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 60_000);
  return () => clearInterval(id);
}
function getNowMinute() {
  return Math.floor(Date.now() / 60_000);
}

export function NavStats() {
  const deckOrder = useDeckStore((s) => s.deckOrder);
  const columns = useDeckStore((s) => s.columns);
  const nowMinute = useSyncExternalStore(subscribeMinute, getNowMinute, () => 0);

  const { decksCount, columnsCount, itemsCount, latestFetchMs } = useMemo(() => {
    let items = 0;
    let latest: number | null = null;
    for (const c of Object.values(columns)) {
      items += c.items.length;
      if (c.lastFetchedAt) {
        const t = +new Date(c.lastFetchedAt);
        if (latest === null || t > latest) latest = t;
      }
    }
    return {
      decksCount: deckOrder.length,
      columnsCount: Object.keys(columns).length,
      itemsCount: items,
      latestFetchMs: latest,
    };
  }, [deckOrder, columns]);

  const lastFetchAgo =
    latestFetchMs === null
      ? null
      : Math.max(0, nowMinute * 60_000 - latestFetchMs);

  const data: { name: string; value: string }[] = [
    { name: "Decks", value: compact(decksCount) },
    { name: "Columns", value: compact(columnsCount) },
    { name: "Items", value: compact(itemsCount) },
    {
      name: "Updated",
      value:
        lastFetchAgo === null
          ? "—"
          : lastFetchAgo < 60_000
            ? "now"
            : lastFetchAgo < 3_600_000
              ? `${Math.round(lastFetchAgo / 60_000)}m`
              : lastFetchAgo < 86_400_000
                ? `${Math.round(lastFetchAgo / 3_600_000)}h`
                : `${Math.round(lastFetchAgo / 86_400_000)}d`,
    },
  ];

  return (
    <div className="mx-2 my-2 grid grid-cols-2 gap-px overflow-hidden rounded-md bg-sidebar-border">
      {data.map((stat) => (
        <div
          key={stat.name}
          className="flex flex-col gap-0.5 bg-sidebar px-2.5 py-2"
        >
          <div className="text-[10px] font-medium uppercase tracking-wide text-sidebar-foreground/55">
            {stat.name}
          </div>
          <div
            className="text-[16px] font-medium tabular-nums leading-none text-sidebar-foreground"
            style={{ letterSpacing: "-0.015em" }}
          >
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
