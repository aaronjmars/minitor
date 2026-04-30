import "server-only";

// Keyless by default — Apple's iTunes RSS for App Store, public batchexecute scrape for Google Play. Env-gated upgrade paths live behind `fetchReviews()`.

import {
  defineColumnServer,
  type FeedItem,
  type ServerFetcher,
} from "@/lib/columns/types";
import { fetchReviews } from "@/lib/integrations/app-reviews";
import {
  meta,
  type AppReviewsConfig,
  type AppReviewsItemMeta,
} from "./plugin";

const fetch: ServerFetcher<AppReviewsConfig, AppReviewsItemMeta> = async (
  config,
) => {
  const appId = config.appId.trim();
  if (!appId) throw new Error("App ID is required.");
  const country = (config.country.trim() || "us").toLowerCase();

  if (config.platform !== "both") {
    const items = (await fetchReviews(
      config.platform,
      appId,
      country,
    )) as FeedItem<AppReviewsItemMeta>[];
    items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return { items };
  }

  // "both" — fan out to both stores, dedupe by id, sort newest first.
  const isNumeric = /^\d+$/.test(appId);
  const tasks: Promise<FeedItem<AppReviewsItemMeta>[]>[] = [];
  if (isNumeric) {
    tasks.push(
      fetchReviews("app-store", appId, country) as Promise<
        FeedItem<AppReviewsItemMeta>[]
      >,
    );
  }
  if (!isNumeric || appId.includes(".")) {
    tasks.push(
      fetchReviews("google-play", appId, country) as Promise<
        FeedItem<AppReviewsItemMeta>[]
      >,
    );
  }
  if (tasks.length === 0) {
    throw new Error(
      'For "both", provide a numeric App Store ID or a Play package ID like com.example.app.',
    );
  }

  const settled = await Promise.allSettled(tasks);
  const errors: string[] = [];
  const all: FeedItem<AppReviewsItemMeta>[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") all.push(...r.value);
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
  }
  if (all.length === 0 && errors.length > 0) {
    throw new Error(`All sources failed:\n${errors.join("\n")}`);
  }

  const seen = new Set<string>();
  const deduped: FeedItem<AppReviewsItemMeta>[] = [];
  for (const it of all) {
    if (seen.has(it.id)) continue;
    seen.add(it.id);
    deduped.push(it);
  }
  deduped.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  return { items: deduped };
};

export const server = defineColumnServer<AppReviewsConfig, AppReviewsItemMeta>({
  meta,
  fetch,
});
