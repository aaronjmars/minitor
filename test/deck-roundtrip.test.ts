import { beforeAll, describe, it, expect } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  createDeck,
  updateDeckColor,
  createColumn,
  updateColumnAlertKeywords,
  updateColumnColor,
  updateColumnWebhookUrl,
  updateColumnFilters,
  updateColumnTabGroup,
  updateColumnPinned,
  exportDeck,
  importDeck,
  type DeckExport,
} from "@/app/actions";

// Full export → import round-trip against a throwaway in-memory PGlite (the
// `memory://` DATABASE_URL is set in vitest.config.ts). This exercises the real
// server actions, so it protects two things at once: that a deck survives a
// round-trip with every persisted field intact, and — critically — that the
// install-private webhook URL is NEVER emitted into an export, while bad values
// are dropped (not fatal) on import.

beforeAll(async () => {
  // Build the schema by replaying the committed migration SQL against the same
  // in-memory instance the server actions use.
  const dir = join(process.cwd(), "drizzle");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const file of files) {
    const contents = await readFile(join(dir, file), "utf8");
    const statements = contents
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    for (const stmt of statements) {
      await db.execute(sql.raw(stmt));
    }
  }
});

describe("deck export → import round-trip", () => {
  it("preserves every persisted field and omits the secret webhook", async () => {
    await createDeck("deck-1", "My Deck");
    await updateDeckColor("deck-1", "#F97316"); // uppercase → normalized lower

    await createColumn("col-1", "deck-1", "reddit", "Reddit rust", {
      subreddit: "rust",
      sort: "hot",
    });
    await updateColumnAlertKeywords("col-1", "rust, tokio");
    await updateColumnColor("col-1", "#3B82F6");
    await updateColumnFilters("col-1", "async", "spam");
    await updateColumnTabGroup("col-1", "Dev");
    await updateColumnPinned("col-1", true);
    // A public https URL passes the SSRF gate and persists.
    await updateColumnWebhookUrl("col-1", "https://hooks.example.com/abc");

    const json = await exportDeck("deck-1");
    const payload = JSON.parse(json) as DeckExport & {
      columns: Array<Record<string, unknown>>;
    };

    expect(payload.version).toBe(1);
    expect(payload.deckColor).toBe("#f97316");
    expect(payload.columns).toHaveLength(1);

    const col = payload.columns[0];
    expect(col.typeId).toBe("reddit");
    expect(col.title).toBe("Reddit rust");
    expect(col.config).toEqual({ subreddit: "rust", sort: "hot" });
    expect(col.alertKeywords).toBe("rust, tokio");
    expect(col.color).toBe("#3b82f6");
    expect(col.filterKeywords).toBe("async");
    expect(col.excludeKeywords).toBe("spam");
    expect(col.tabGroup).toBe("Dev");
    expect(col.pinned).toBe(true);
    // The security property: a webhook URL is install-private and must never be
    // exported (the same payload feeds public share links).
    expect(col.notifyWebhookUrl).toBeUndefined();

    const imported = await importDeck(json);
    expect(imported.deckName).toBe("My Deck (imported)");
    expect(imported.deckColor).toBe("#f97316");
    expect(imported.columns).toHaveLength(1);

    const ic = imported.columns[0];
    expect(ic.typeId).toBe("reddit");
    expect(ic.title).toBe("Reddit rust");
    expect(ic.config).toEqual({ subreddit: "rust", sort: "hot" });
    expect(ic.alertKeywords).toBe("rust, tokio");
    expect(ic.color).toBe("#3b82f6");
    expect(ic.filterKeywords).toBe("async");
    expect(ic.excludeKeywords).toBe("spam");
    expect(ic.tabGroup).toBe("Dev");
    expect(ic.pinned).toBe(true);
    expect(ic.notifyWebhookUrl).toBeUndefined();
  });

  it("drops malformed values on import instead of aborting the whole deck", async () => {
    const bad = JSON.stringify({
      version: 1,
      deckName: "Hand Edited",
      deckColor: "not-a-color", // dropped → deck imports with no color
      columns: [
        {
          typeId: "reddit",
          title: "X",
          config: {},
          color: "blue", // named color → dropped
          notifyWebhookUrl: "http://localhost/hook", // SSRF-blocked → dropped
          refreshIntervalSeconds: 1, // not allowlisted → dropped
          tabGroup: "  Spaced   Out  ", // normalized
        },
      ],
    });

    const res = await importDeck(bad);
    expect(res.deckName).toBe("Hand Edited (imported)");
    expect(res.deckColor).toBeUndefined();

    const c = res.columns[0];
    expect(c.typeId).toBe("reddit"); // the valid parts still import
    expect(c.color).toBeUndefined();
    expect(c.notifyWebhookUrl).toBeUndefined();
    expect(c.refreshIntervalSeconds).toBeUndefined();
    expect(c.tabGroup).toBe("Spaced Out");
  });
});
