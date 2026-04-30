import "server-only";

// Backend choice: Grok web_search with site:instagram.com — IG's Graph API
// has no public hashtag/keyword search, so web search is the easiest path.

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchInstagram } from "@/lib/integrations/instagram";
import { meta, type InstagramConfig, type InstagramMeta } from "./plugin";

const fetch: ServerFetcher<InstagramConfig, InstagramMeta> = async (config) => {
  const items = (await fetchInstagram(config.query)) as FeedItem<InstagramMeta>[];
  return { items };
};

export const server = defineColumnServer<InstagramConfig, InstagramMeta>({
  meta,
  fetch,
});
