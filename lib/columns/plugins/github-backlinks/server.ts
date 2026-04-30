import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchBacklinks } from "@/lib/integrations/github-backlinks";
import {
  meta,
  type BacklinksConfig,
  type BacklinksItemMeta,
} from "./plugin";

// Fan-out across HN (URL-indexed), Reddit search, Google News, Bing News,
// optionally GitHub issue search and Grok web search; dedup on canonical URL.
const fetch: ServerFetcher<BacklinksConfig, BacklinksItemMeta> = async (
  config,
) => {
  const items = (await fetchBacklinks({
    repo: config.repo,
    includeIssues: config.includeIssues,
    includeWebSearch: config.includeWebSearch,
  })) as FeedItem<BacklinksItemMeta>[];
  return { items };
};

export const server = defineColumnServer<BacklinksConfig, BacklinksItemMeta>({
  meta,
  fetch,
});
