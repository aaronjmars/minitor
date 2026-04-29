"use client";

import { useSyncExternalStore } from "react";
import { formatDistanceToNowStrict } from "date-fns";

// Single shared ticker — N <RelativeTime/> components subscribe to one timer
// instead of each spinning up its own setInterval.
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let snapshot = 0;

function ensureTimer() {
  if (timer) return;
  snapshot = Date.now();
  timer = setInterval(() => {
    snapshot = Date.now();
    for (const l of listeners) l();
  }, 1000);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  ensureTimer();
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return snapshot || Date.now();
}

function getServerSnapshot() {
  return 0;
}

interface Props {
  date: string | Date;
  addSuffix?: boolean;
  /** Abbreviate units: "5s", "12m", "3h", "2d" — used in tweet-style timestamps. */
  compact?: boolean;
}

function abbreviate(s: string): string {
  return s
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d")
    .replace(" months", "mo")
    .replace(" month", "mo")
    .replace(" years", "y")
    .replace(" year", "y");
}

export function RelativeTime({ date, addSuffix = false, compact = false }: Props) {
  // Subscribe so we re-render once per second.
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const formatted = formatDistanceToNowStrict(d, { addSuffix });
  return <>{compact ? abbreviate(formatted) : formatted}</>;
}
