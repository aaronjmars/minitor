import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokWebSearch } from "@/lib/integrations/xai";
import { meta, type WebSearchConfig, type WebSearchMeta } from "./plugin";

const fetch: ServerFetcher<WebSearchConfig, WebSearchMeta> = async (config) => {
  const items = (await grokWebSearch(config.query)) as FeedItem<WebSearchMeta>[];
  return { items };
};

export const server = defineColumnServer<WebSearchConfig, WebSearchMeta>({
  meta,
  fetch,
});
