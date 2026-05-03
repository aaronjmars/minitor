import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import {
  fetchMastodonHashtag,
  fetchMastodonAuthor,
} from "@/lib/integrations/mastodon";
import { sliceForPage } from "@/lib/columns/paginate";
import { meta, type MastodonConfig, type MastodonMeta } from "./plugin";

const fetch: ServerFetcher<MastodonConfig, MastodonMeta> = async (
  config,
  cursor,
) => {
  const items =
    config.mode === "author"
      ? await fetchMastodonAuthor(config.instance, config.handle, 30)
      : await fetchMastodonHashtag(config.instance, config.query, 30);
  return sliceForPage(items as FeedItem<MastodonMeta>[], cursor);
};

export const server = defineColumnServer<MastodonConfig, MastodonMeta>({
  meta,
  fetch,
});
