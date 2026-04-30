import "server-only";

import {
  defineColumnServer,
  type ServerFetcher,
} from "@/lib/columns/types";
import { searchHackerNewsByUrlOrKeyword } from "@/lib/integrations/hackernews";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { meta, type HNSearchConfig, type HNSearchMeta } from "./plugin";

const fetch: ServerFetcher<HNSearchConfig, HNSearchMeta> = async (
  config,
  cursor,
) => {
  const page = cursor ? Number(cursor) || 0 : 0;
  const r = await searchHackerNewsByUrlOrKeyword(config.query, {
    scope: config.scope,
    sort: config.sort,
    limit: PAGE_SIZE,
    page,
  });
  return {
    items: r.items,
    nextCursor: r.hasMore ? String(page + 1) : undefined,
  };
};

export const server = defineColumnServer<HNSearchConfig, HNSearchMeta>({
  meta,
  fetch,
});
