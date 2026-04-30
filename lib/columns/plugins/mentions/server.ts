import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchMentions } from "@/lib/integrations/mentions";
import {
  meta,
  type MentionsConfig,
  type MentionsItemMeta,
} from "./plugin";

const fetch: ServerFetcher<MentionsConfig, MentionsItemMeta> = async (
  config,
) => {
  const items = (await fetchMentions({
    query: config.query,
    sources: config.sources,
  })) as FeedItem<MentionsItemMeta>[];
  return { items };
};

export const server = defineColumnServer<MentionsConfig, MentionsItemMeta>({
  meta,
  fetch,
});
