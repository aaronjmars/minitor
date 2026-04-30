import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokXTrending } from "@/lib/integrations/xai";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";
import { meta, type XTrendingConfig } from "./plugin";

const fetch: ServerFetcher<XTrendingConfig, TweetMeta> = async (config) => {
  const items = (await grokXTrending(config.topic)) as FeedItem<TweetMeta>[];
  return { items };
};

export const server = defineColumnServer<XTrendingConfig, TweetMeta>({
  meta,
  fetch,
});
