import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchGitHub } from "@/lib/integrations/github";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { meta, type GHConfig, type GHMeta } from "./plugin";

const fetch: ServerFetcher<GHConfig, GHMeta> = async (config, cursor) => {
  const page = cursor ? Number(cursor) || 1 : 1;
  const items = (await fetchGitHub(
    config.mode,
    {
      language: config.language,
      period: config.period,
      repo: config.repo,
      query: config.query,
    },
    PAGE_SIZE,
    page,
  )) as FeedItem<GHMeta>[];
  return {
    items,
    nextCursor: items.length === PAGE_SIZE ? String(page + 1) : undefined,
  };
};

export const server = defineColumnServer<GHConfig, GHMeta>({ meta, fetch });
