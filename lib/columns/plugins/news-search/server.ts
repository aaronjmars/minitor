import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokNewsSearch } from "@/lib/integrations/xai";
import { meta, type NewsSearchConfig, type NewsSearchMeta } from "./plugin";

const fetch: ServerFetcher<NewsSearchConfig, NewsSearchMeta> = async (config) => {
  const items = (await grokNewsSearch(config.query)) as FeedItem<NewsSearchMeta>[];
  return { items };
};

export const server = defineColumnServer<NewsSearchConfig, NewsSearchMeta>({
  meta,
  fetch,
});
