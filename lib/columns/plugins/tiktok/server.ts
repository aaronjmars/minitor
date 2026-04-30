import "server-only";

// TikTok has no public mention-search API; we use Grok web_search with a
// `site:tiktok.com` filter (option 1 from the plugin design notes).
import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { searchTikTok } from "@/lib/integrations/tiktok";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { meta, type TikTokConfig, type TikTokMeta } from "./plugin";

const fetch: ServerFetcher<TikTokConfig, TikTokMeta> = async (config) => {
  const items = (await searchTikTok(
    config.query,
    PAGE_SIZE,
  )) as FeedItem<TikTokMeta>[];
  return { items };
};

export const server = defineColumnServer<TikTokConfig, TikTokMeta>({
  meta,
  fetch,
});
