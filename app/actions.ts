"use server";

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { columns, decks, feedItems } from "@/lib/db/schema";
import type { Column, Deck, FeedItem } from "@/lib/columns/types";

const MAX_ITEMS_PER_COLUMN = 200;

export interface Snapshot {
  decks: Record<string, Deck>;
  deckOrder: string[];
  columns: Record<string, Column>;
}

export async function loadSnapshot(): Promise<Snapshot> {
  const [deckRows, columnRows, itemRows] = await Promise.all([
    db.select().from(decks).orderBy(asc(decks.position), asc(decks.createdAt)),
    db
      .select()
      .from(columns)
      .orderBy(asc(columns.position), asc(columns.createdAt)),
    db.select().from(feedItems).orderBy(desc(feedItems.createdAt)),
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

  for (const item of itemRows) {
    const col = columnsById[item.columnId];
    if (!col) continue;
    if (col.items.length >= MAX_ITEMS_PER_COLUMN) continue;
    col.items.push({
      id: item.id,
      author: item.author as FeedItem["author"],
      content: item.content,
      url: item.url ?? undefined,
      createdAt: item.createdAt.toISOString(),
      meta: (item.meta as Record<string, unknown>) ?? undefined,
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
  await Promise.all(
    orderedIds.map((id, position) =>
      db.update(decks).set({ position }).where(eq(decks.id, id)),
    ),
  );
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
  await Promise.all(
    orderedIds.map((id, position) =>
      db
        .update(columns)
        .set({ position, deckId })
        .where(eq(columns.id, id)),
    ),
  );
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
