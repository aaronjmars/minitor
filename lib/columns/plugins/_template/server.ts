import "server-only";

// _template/server.ts — the server half of a plugin. Lives in a "server-only"
// module so it can use API keys, talk to upstream services, and parse cursors
// without ever leaking to the client bundle. Receives a config that's already
// been validated against `meta.schema` by the API route.

import {
  defineColumnServer,
  type ServerFetcher,
} from "@/lib/columns/types";
import { meta, type TemplateConfig, type TemplateMeta } from "./plugin";

const fetch: ServerFetcher<TemplateConfig, TemplateMeta> = async (
  config,
  // cursor, // present when the user clicks "Load more" (only if capabilities.paginated)
) => {
  // Talk to your integration here. Return `{ items, nextCursor? }`.
  // - `items` is `FeedItem<TemplateMeta>[]`. Make sure each item has a stable id.
  // - `nextCursor` is opaque to the rest of the app — encode whatever your
  //   upstream paginates with (page number, after-token, page-token).
  return {
    items: [
      {
        id: `${config.query}-1`,
        author: { name: "Template" },
        content: `Hello, ${config.query || "world"}`,
        url: "https://example.com",
        createdAt: new Date().toISOString(),
        meta: { source: "template" },
      },
    ],
  };
};

export const server = defineColumnServer<TemplateConfig, TemplateMeta>({
  meta,
  fetch,
});
