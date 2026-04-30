import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokXSearch } from "@/lib/integrations/xai";
import { meta, type XSearchConfig, type TweetMeta } from "./plugin";

const fetch: ServerFetcher<XSearchConfig, TweetMeta> = async (config) => {
  const items = (await grokXSearch(config.query)) as FeedItem<TweetMeta>[];
  return { items };
};

export const server = defineColumnServer<XSearchConfig, TweetMeta>({
  meta,
  fetch,
});
