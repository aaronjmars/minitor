import "server-only";

// GraphQL when GITHUB_TOKEN is present (clean STARRED_AT DESC); REST + Link
// header walk for newest-first stargazers when keyless. Forks are REST sort=newest.

import {
  defineColumnServer,
  type ServerFetcher,
} from "@/lib/columns/types";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { fetchForks, fetchStargazers } from "@/lib/integrations/github";
import type { GHWatcherItem, GHWatcherItemMeta } from "@/lib/integrations/github";
import { meta, type GHWatchersConfig } from "./plugin";

const fetch: ServerFetcher<GHWatchersConfig, GHWatcherItemMeta> = async (
  config,
  cursor,
) => {
  const repo = config.repo.trim();
  if (!repo) throw new Error("Repository is required (owner/repo).");

  if (config.mode === "stars") {
    return fetchStargazers(repo, PAGE_SIZE, cursor);
  }
  if (config.mode === "forks") {
    return fetchForks(repo, PAGE_SIZE, cursor);
  }

  // "both" — fan out, interleave by event time newest-first. No pagination:
  // stargazer + fork timelines diverge, so a single cursor can't represent
  // both fairly without duplicates or skips.
  const [stars, forks] = await Promise.allSettled([
    fetchStargazers(repo, PAGE_SIZE, undefined),
    fetchForks(repo, PAGE_SIZE, undefined),
  ]);
  const errors: string[] = [];
  const items: GHWatcherItem[] = [];
  if (stars.status === "fulfilled") items.push(...stars.value.items);
  else errors.push(stars.reason instanceof Error ? stars.reason.message : String(stars.reason));
  if (forks.status === "fulfilled") items.push(...forks.value.items);
  else errors.push(forks.reason instanceof Error ? forks.reason.message : String(forks.reason));

  if (items.length === 0 && errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return { items };
};

export const server = defineColumnServer<GHWatchersConfig, GHWatcherItemMeta>({
  meta,
  fetch,
});
