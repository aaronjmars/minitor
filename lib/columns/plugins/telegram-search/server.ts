import "server-only";

// Scrapes the server-rendered t.me/s/<channel> preview pages — no API key, no
// MTProto. Bot tokens can't read arbitrary channels, so this is the only path
// that works without per-channel admin access.

import {
  defineColumnServer,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchTelegramChannelMentions } from "@/lib/integrations/telegram";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { meta, type TGSearchConfig, type TGSearchMeta } from "./plugin";

const fetch: ServerFetcher<TGSearchConfig, TGSearchMeta> = async (config) => {
  const items = await fetchTelegramChannelMentions({
    channels: config.channels,
    query: config.query,
    matchMode: config.matchMode,
    limit: PAGE_SIZE,
  });
  return { items };
};

export const server = defineColumnServer<TGSearchConfig, TGSearchMeta>({
  meta,
  fetch,
});
