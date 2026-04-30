import "server-only";

// Per-publication RSS via lib/integrations/rss.ts. Substack's discover/search
// API (substack.com/api/v1/post/search) returns empty results without auth, so
// the user picks one or more handles and we filter their feeds in-memory.

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import {
  parseHandles,
  searchSubstackPublications,
} from "@/lib/integrations/substack";
import { meta, type SubstackConfig, type SubstackMeta } from "./plugin";

const fetch: ServerFetcher<SubstackConfig, SubstackMeta> = async (config) => {
  const handles = parseHandles(config.handles);
  if (handles.length === 0) return { items: [] };
  const items = (await searchSubstackPublications(
    handles,
    config.query,
  )) as FeedItem<SubstackMeta>[];
  return { items };
};

export const server = defineColumnServer<SubstackConfig, SubstackMeta>({
  meta,
  fetch,
});
