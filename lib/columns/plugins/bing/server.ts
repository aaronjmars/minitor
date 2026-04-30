import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchFeed } from "@/lib/integrations/rss";
import { sliceForPage } from "@/lib/columns/paginate";
import { meta, type BingConfig, type BingMeta } from "./plugin";

const fetch: ServerFetcher<BingConfig, BingMeta> = async (config, cursor) => {
  const q = config.query.trim();
  if (!q) throw new Error("Search query is required.");
  const url = `https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`;
  const items = (await fetchFeed(url, 50)) as FeedItem<BingMeta>[];
  return sliceForPage(items, cursor);
};

export const server = defineColumnServer<BingConfig, BingMeta>({
  meta,
  fetch,
});
