import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { grokAsk } from "@/lib/integrations/xai";
import { meta, type GrokAskConfig, type GrokAskMeta } from "./plugin";

const fetch: ServerFetcher<GrokAskConfig, GrokAskMeta> = async (config) => {
  const items = (await grokAsk(config.prompt)) as FeedItem<GrokAskMeta>[];
  return { items };
};

export const server = defineColumnServer<GrokAskConfig, GrokAskMeta>({
  meta,
  fetch,
});
