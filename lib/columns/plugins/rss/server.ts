import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchFeed } from "@/lib/integrations/rss";
import { meta, type RssConfig, type RssMeta } from "./plugin";

const fetch: ServerFetcher<RssConfig, RssMeta> = async (config) => {
  const items = (await fetchFeed(config.url)) as FeedItem<RssMeta>[];
  return { items };
};

export const server = defineColumnServer<RssConfig, RssMeta>({ meta, fetch });
