import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokXMentions } from "@/lib/integrations/xai";
import type { TweetMeta } from "@/lib/columns/plugins/x-search/plugin";
import { meta, type XMentionsConfig } from "./plugin";

const fetch: ServerFetcher<XMentionsConfig, TweetMeta> = async (config) => {
  const items = (await grokXMentions(config.handle)) as FeedItem<TweetMeta>[];
  return { items };
};

export const server = defineColumnServer<XMentionsConfig, TweetMeta>({
  meta,
  fetch,
});
