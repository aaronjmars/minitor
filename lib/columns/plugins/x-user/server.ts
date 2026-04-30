import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokXUser } from "@/lib/integrations/xai";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";
import { meta, type XUserConfig } from "./plugin";

const fetch: ServerFetcher<XUserConfig, TweetMeta> = async (config) => {
  const items = (await grokXUser(config.handle)) as FeedItem<TweetMeta>[];
  return { items };
};

export const server = defineColumnServer<XUserConfig, TweetMeta>({
  meta,
  fetch,
});
