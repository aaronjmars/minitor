import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import {
  fetchFarcasterUser,
  fetchFarcasterSearch,
} from "@/lib/integrations/farcaster";
import { meta, type FCConfig, type FCMeta } from "./plugin";

const fetch: ServerFetcher<FCConfig, FCMeta> = async (config) => {
  const items =
    config.mode === "search"
      ? await fetchFarcasterSearch(config.query)
      : await fetchFarcasterUser(config.username);
  return { items: items as FeedItem<FCMeta>[] };
};

export const server = defineColumnServer<FCConfig, FCMeta>({ meta, fetch });
