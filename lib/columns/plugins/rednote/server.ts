import "server-only";

// Path: site:xiaohongshu.com web search via Grok (no public xhs API). Swap to
// a paid scraper later by editing lib/integrations/rednote.ts only.

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchRednoteMentions } from "@/lib/integrations/rednote";
import { meta, type RednoteConfig, type RednoteMeta } from "./plugin";

const fetch: ServerFetcher<RednoteConfig, RednoteMeta> = async (config) => {
  const items = (await fetchRednoteMentions(
    config.query,
  )) as FeedItem<RednoteMeta>[];
  return { items };
};

export const server = defineColumnServer<RednoteConfig, RednoteMeta>({
  meta,
  fetch,
});
