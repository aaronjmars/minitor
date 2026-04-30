import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchNewsNow } from "@/lib/integrations/newsnow";
import { meta, type NewsNowConfig, type NewsNowMeta } from "./plugin";

const fetch: ServerFetcher<NewsNowConfig, NewsNowMeta> = async (config) => {
  const items = (await fetchNewsNow(config.platform)) as FeedItem<NewsNowMeta>[];
  return { items };
};

export const server = defineColumnServer<NewsNowConfig, NewsNowMeta>({
  meta,
  fetch,
});
