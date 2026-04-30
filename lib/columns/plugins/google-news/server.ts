import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchFeed, googleNewsUrl } from "@/lib/integrations/rss";
import {
  meta,
  type GoogleNewsConfig,
  type GoogleNewsMeta,
} from "./plugin";

const fetch: ServerFetcher<GoogleNewsConfig, GoogleNewsMeta> = async (
  config,
) => {
  const items = (await fetchFeed(
    googleNewsUrl(config.query, config.hl, config.gl),
  )) as FeedItem<GoogleNewsMeta>[];
  return { items };
};

export const server = defineColumnServer<GoogleNewsConfig, GoogleNewsMeta>({
  meta,
  fetch,
});
