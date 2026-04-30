import { PAGE_SIZE } from "@/lib/columns/constants";
import type { FeedItem, PageResult } from "@/lib/columns/types";

// Slice-based pagination for plugins whose underlying source returns a fixed
// list rather than supporting native cursors. The server fetches a generous
// batch once, then we hand out PAGE_SIZE items per call until the batch is
// exhausted. Cursor is a 1-based page number serialized as a string.
//
// Trade-off: every Load-more call refetches the source. That's wasteful for
// sources that don't change between calls, but it keeps the contract
// stateless (no per-column server state) and makes refresh + load-more work
// uniformly.
export function pageFromCursor(cursor?: string): number {
  if (!cursor) return 1;
  const n = Number(cursor);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export function sliceForPage<TMeta>(
  items: FeedItem<TMeta>[],
  cursor?: string,
  perPage: number = PAGE_SIZE,
): PageResult<TMeta> {
  const page = pageFromCursor(cursor);
  const start = (page - 1) * perPage;
  const slice = items.slice(start, start + perPage);
  const hasMore = items.length > start + perPage;
  return {
    items: slice,
    nextCursor: hasMore ? String(page + 1) : undefined,
  };
}
