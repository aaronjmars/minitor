import "server-only";

// Keyless path: m.weibo.cn mobile JSON search. Chosen over s.weibo.com HTML
// scrape (brittle DOM) and Grok web_search (requires XAI_API_KEY).
import {
  defineColumnServer,
  type ServerFetcher,
} from "@/lib/columns/types";
import { searchWeibo } from "@/lib/integrations/weibo";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { meta, type WeiboSearchConfig, type WeiboSearchMeta } from "./plugin";

const fetch: ServerFetcher<WeiboSearchConfig, WeiboSearchMeta> = async (
  config,
) => {
  const items = await searchWeibo(config.query, PAGE_SIZE);
  return { items };
};

export const server = defineColumnServer<WeiboSearchConfig, WeiboSearchMeta>({
  meta,
  fetch,
});
