"use server";

import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { columns, decks, feedItems } from "@/lib/db/schema";
import type { Column, Deck, FeedItem } from "@/lib/columns/types";
import { MAX_ITEMS_PER_COLUMN } from "@/lib/columns/constants";

export interface Snapshot {
  decks: Record<string, Deck>;
  deckOrder: string[];
  columns: Record<string, Column>;
}

type ItemRow = {
  id: string;
  column_id: string;
  author: FeedItem["author"];
  content: string;
  url: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
};

export async function loadSnapshot(): Promise<Snapshot> {
  // Page items at the DB instead of slicing in memory: window-function with
  // row_number() returns at most MAX_ITEMS_PER_COLUMN per column, ordered
  // newest-first within each partition.
  const itemQuery = db.execute(sql`
    SELECT id, column_id, author, content, url, created_at, meta
    FROM (
      SELECT *,
        row_number() OVER (PARTITION BY column_id ORDER BY created_at DESC) AS rn
      FROM feed_items
    ) t
    WHERE rn <= ${MAX_ITEMS_PER_COLUMN}
    ORDER BY column_id, created_at DESC
  `);

  const [deckRows, columnRows, itemResult] = await Promise.all([
    db.select().from(decks).orderBy(asc(decks.position), asc(decks.createdAt)),
    db
      .select()
      .from(columns)
      .orderBy(asc(columns.position), asc(columns.createdAt)),
    itemQuery,
  ]);

  const decksById: Record<string, Deck> = {};
  const deckOrder: string[] = [];
  for (const d of deckRows) {
    decksById[d.id] = { id: d.id, name: d.name, columnIds: [] };
    deckOrder.push(d.id);
  }

  const columnsById: Record<string, Column> = {};
  for (const c of columnRows) {
    columnsById[c.id] = {
      id: c.id,
      typeId: c.typeId,
      title: c.title,
      config: (c.config as Record<string, unknown>) ?? {},
      items: [],
      lastFetchedAt: c.lastFetchedAt ? c.lastFetchedAt.toISOString() : undefined,
    };
    decksById[c.deckId]?.columnIds.push(c.id);
  }

  const itemRows: ItemRow[] = Array.isArray(itemResult)
    ? (itemResult as ItemRow[])
    : ((itemResult as unknown as { rows?: ItemRow[] }).rows ?? []);
  for (const item of itemRows) {
    const col = columnsById[item.column_id];
    if (!col) continue;
    col.items.push({
      id: item.id,
      author: item.author,
      content: item.content,
      url: item.url ?? undefined,
      createdAt: new Date(item.created_at).toISOString(),
      meta: item.meta ?? undefined,
    });
  }

  return { decks: decksById, deckOrder, columns: columnsById };
}

export async function createDeck(id: string, name: string): Promise<void> {
  const [{ maxPos }] = await db
    .select({ maxPos: sql<number>`coalesce(max(${decks.position}), -1)` })
    .from(decks);
  await db.insert(decks).values({ id, name, position: maxPos + 1 });
}

export async function renameDeck(id: string, name: string): Promise<void> {
  await db.update(decks).set({ name }).where(eq(decks.id, id));
}

export async function deleteDeck(id: string): Promise<void> {
  await db.delete(decks).where(eq(decks.id, id));
}

export async function reorderDecks(orderedIds: string[]): Promise<void> {
  if (orderedIds.length === 0) return;
  const values = sql.join(
    orderedIds.map((id, i) => sql`(${id}::text, ${i}::int)`),
    sql`, `,
  );
  await db.execute(sql`
    UPDATE decks
    SET position = v.position
    FROM (VALUES ${values}) AS v(id, position)
    WHERE decks.id = v.id
  `);
}

export async function createColumn(
  id: string,
  deckId: string,
  typeId: string,
  title: string,
  config: Record<string, unknown>,
): Promise<void> {
  const [{ maxPos }] = await db
    .select({ maxPos: sql<number>`coalesce(max(${columns.position}), -1)` })
    .from(columns)
    .where(eq(columns.deckId, deckId));
  await db.insert(columns).values({
    id,
    deckId,
    typeId,
    title,
    config,
    position: maxPos + 1,
  });
}

export async function updateColumnConfig(
  id: string,
  config: Record<string, unknown>,
): Promise<void> {
  await db.update(columns).set({ config }).where(eq(columns.id, id));
}

export async function renameColumn(id: string, title: string): Promise<void> {
  await db.update(columns).set({ title }).where(eq(columns.id, id));
}

export async function deleteColumn(id: string): Promise<void> {
  await db.delete(columns).where(eq(columns.id, id));
}

export async function reorderColumnsInDeck(
  deckId: string,
  orderedIds: string[],
): Promise<void> {
  if (orderedIds.length === 0) return;
  const values = sql.join(
    orderedIds.map((id, i) => sql`(${id}::text, ${i}::int)`),
    sql`, `,
  );
  await db.execute(sql`
    UPDATE columns
    SET position = v.position, deck_id = ${deckId}
    FROM (VALUES ${values}) AS v(id, position)
    WHERE columns.id = v.id
  `);
}

export async function persistFetchedItems(
  columnId: string,
  items: FeedItem[],
): Promise<{ newCount: number; lastFetchedAt: string }> {
  const fetchedAt = new Date();

  // Gather existing ids to count "new" arrivals
  let newCount = items.length;
  if (items.length > 0) {
    const existing = await db
      .select({ id: feedItems.id })
      .from(feedItems)
      .where(
        and(
          eq(feedItems.columnId, columnId),
          inArray(
            feedItems.id,
            items.map((i) => i.id),
          ),
        ),
      );
    const existingIds = new Set(existing.map((r) => r.id));
    newCount = items.filter((i) => !existingIds.has(i.id)).length;

    await db
      .insert(feedItems)
      .values(
        items.map((i) => ({
          id: i.id,
          columnId,
          author: i.author,
          content: i.content,
          url: i.url ?? null,
          createdAt: new Date(i.createdAt),
          meta: i.meta ?? null,
          fetchedAt,
        })),
      )
      .onConflictDoNothing({ target: [feedItems.columnId, feedItems.id] });
  }

  await db
    .update(columns)
    .set({ lastFetchedAt: fetchedAt })
    .where(eq(columns.id, columnId));

  // Cap history per column
  await db.execute(sql`
    DELETE FROM feed_items
    WHERE column_id = ${columnId}
      AND (column_id, id) NOT IN (
        SELECT column_id, id FROM feed_items
        WHERE column_id = ${columnId}
        ORDER BY created_at DESC
        LIMIT ${MAX_ITEMS_PER_COLUMN}
      )
  `);

  return { newCount, lastFetchedAt: fetchedAt.toISOString() };
}
