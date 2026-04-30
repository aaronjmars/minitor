import "server-only";

// Approach: xAI Grok web_search with a site:linkedin.com/posts filter — the
// official LinkedIn API is closed for public search, so we mirror the web-search
// plugin's pattern via lib/integrations/linkedin.ts.

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { searchLinkedinPosts } from "@/lib/integrations/linkedin";
import { meta, type LinkedinConfig, type LinkedinMeta } from "./plugin";

const fetch: ServerFetcher<LinkedinConfig, LinkedinMeta> = async (config) => {
  const items = (await searchLinkedinPosts(config.query)) as FeedItem<LinkedinMeta>[];
  return { items };
};

export const server = defineColumnServer<LinkedinConfig, LinkedinMeta>({
  meta,
  fetch,
});
