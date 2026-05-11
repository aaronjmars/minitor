import "server-only";

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchWorkflowRuns } from "@/lib/integrations/github";
import { PAGE_SIZE } from "@/lib/columns/constants";
import { meta, type GHActionsConfig, type GHActionsMeta } from "./plugin";

const fetch: ServerFetcher<GHActionsConfig, GHActionsMeta> = async (
  config,
  cursor,
) => {
  const repo = config.repo.trim();
  if (!repo) throw new Error("Repository is required (owner/repo).");
  const page = cursor ? Number(cursor) || 1 : 1;
  const { items, hasMore } = await fetchWorkflowRuns(
    repo,
    config.workflow,
    config.branch,
    PAGE_SIZE,
    page,
  );
  // The integration returns FeedItem<GHActionRunMeta>; that type is structurally
  // identical to GHActionsMeta (the renderer contract owned by this plugin).
  // The cast is safe because the two interfaces describe the same shape; we
  // could re-export the integration type, but a one-line cast keeps the
  // ownership clear: the plugin owns the renderer contract, the integration
  // owns the fetch shape.
  return {
    items: items as unknown as FeedItem<GHActionsMeta>[],
    nextCursor: hasMore ? String(page + 1) : undefined,
  };
};

export const server = defineColumnServer<GHActionsConfig, GHActionsMeta>({
  meta,
  fetch,
});
