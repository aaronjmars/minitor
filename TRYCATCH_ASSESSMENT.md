# try/catch + defensive programming assessment

Audit of every `try { ... } catch` block in the project (TS/TSX, excluding `components/ui/*`).

Verdict legend: KEEP (legitimate trust boundary with meaningful handling) · IMPROVE (boundary, but handling is hiding) · REMOVE (wraps internal code, hides bugs).

---

## Server actions / DB / file IO

### `app/actions.ts:293` — read `.env.local`
- Boundary: **file IO** (`readFile` may ENOENT).
- Handling: silently fall through to `raw = ""`, then write the file fresh.
- Verdict: **KEEP** (HIGH confidence). The empty-file fallback is the documented intent — file may not exist on first run. This is a clearly motivated default, not error hiding.

---

## API routes

### `app/api/columns/[type]/route.ts:45` — plugin fetcher invocation
- Boundary: **third-party network** (Grok, GitHub, Reddit, etc. via `entry.fetch`).
- Handling: returns 502 with the original message; client toast surfaces it.
- Verdict: **KEEP** (HIGH). This is the canonical "translate thrown SDK/network error into HTTP error" pattern. `console.error` is supplementary log, not the only handling.

---

## DB driver bootstrap

### `lib/db/client.ts:48` — URL parse for routing driver choice
- Boundary: **URL parse** of user-supplied `DATABASE_URL`.
- Handling: leave `host` empty so we fall through to the `postgres` branch and let the driver surface the real error.
- Verdict: **KEEP** (HIGH). Documented and intentional — bad URLs surface from the driver itself, which gives a richer error than the parse failure would.

---

## Client mutations / Zustand

### `lib/store/use-deck-store.ts:202` — `autoFetchColumn` network call
- Boundary: **fetch + DB persist** via `callColumnApi` and `applyFetchedItems`.
- Handling: surfaces failure via `toast.error` with the message.
- Verdict: **KEEP** (HIGH).

### `components/column/column-card.tsx:90` — manual refresh
- Same shape as above — fetch, toast on failure.
- Verdict: **KEEP** (HIGH).

### `components/column/column-card.tsx:113` — load-more pagination
- Same shape — fetch, toast on failure.
- Verdict: **KEEP** (HIGH).

### `components/settings/settings-dialog.tsx:77` — `setEnvKeys`
- Boundary: server-action call (writes `.env.local`).
- Handling: `toast.error` with message, leaves dialog open.
- Verdict: **KEEP** (HIGH).

---

## Integrations (URL parse / RSS parse / cursor decode)

### `lib/integrations/github-backlinks.ts:58` — canonicalize external URLs
- Boundary: **URL parse** on third-party URLs from HN/Reddit/Google News.
- Handling: return original string unchanged.
- Verdict: **KEEP** (HIGH). Some feed URLs are malformed; keeping the raw string for dedup is the right call.

### `lib/integrations/rss.ts:144` — parse feed URL up front
- Boundary: URL parse on user-supplied feed URL — but the catch *re-throws* a clearer error.
- Verdict: **KEEP** (HIGH). Replaces the opaque `Invalid URL` from `URL` constructor with an actionable message. This is improvement, not hiding.

### `lib/integrations/rss.ts:157` — `unwrapGoogleRedirect`
- Boundary: URL parse on item links from feeds.
- Handling: pass through original URL.
- Verdict: **KEEP** (HIGH). External feed URL may be malformed.

### `lib/integrations/substack.ts:120` — `isSubstackUrl`
- Boundary: URL parse on item URLs returned by Grok web_search.
- Handling: return `false`.
- Verdict: **KEEP** (HIGH). Predicate has to handle malformed URLs.

### `lib/integrations/substack.ts:130` — `publicationFromUrl`
- Same shape — return `null` on bad URL.
- Verdict: **KEEP** (HIGH).

### `lib/integrations/blockscout.ts:139` — `decodeCursor`
- Boundary: **JSON.parse** on a base64-encoded cursor that arrived from the wire.
- Handling: return `undefined` (caller treats as "start from beginning").
- Verdict: **KEEP** (HIGH). Tampered/garbled cursors should not crash; resetting pagination is the documented behavior.

### `lib/integrations/linkedin.ts:12` — `isLinkedinUrl`
- URL-parse predicate on Grok results.
- Verdict: **KEEP** (HIGH).

### `lib/integrations/github.ts:645` — parse `Link:` rel="last"
- Boundary: URL parse on a header value GitHub provided. Used for pagination hint only.
- Handling: ignore — falls through to `undefined` lastPage.
- Verdict: **KEEP** (HIGH). Pagination is best-effort; the alternative is crashing the request.

### `lib/columns/plugins/github-backlinks/client.tsx:80` — host extraction for display
- Boundary: URL parse on item URL for rendering host badge.
- Handling: empty string → host badge hidden.
- Verdict: **KEEP** (HIGH). Renderer-side defense against malformed external URLs.

### `lib/columns/plugins/rss/plugin.ts:28` — `defaultTitle`
- Boundary: URL parse on user-supplied feed URL to derive the column title.
- Handling: fall back to "RSS".
- Verdict: **KEEP** (HIGH). User can paste anything into the URL field; this is the title generator running before validation.

### `lib/columns/plugins/wallet-tx/server.ts:27` — wallet cursor decode
- Boundary: JSON.parse on base64 cursor.
- Handling: reset to `{ off: 0 }`.
- Verdict: **KEEP** (HIGH). Same as Blockscout cursor.

---

## Summary

- **17 try/catch blocks total.**
- **17 KEEP** — every block sits at a real trust boundary (URL parse, JSON.parse, file IO, third-party network) with appropriate handling: either a clearly motivated fallback (URL parse → ignore item / return original / empty host badge), a re-thrown clearer error, or surfacing through toast / HTTP status to the user.
- **0 IMPROVE.**
- **0 REMOVE.**

No changes implemented. The codebase already follows the philosophy: try/catch only at boundaries, no internal-code-wrapping cruft, no `catch { return null }` patterns hiding bugs in code the developer controls.

Defensive `?.` / `??` patterns were spot-checked (267 occurrences) but a full audit was out of scope for this pass. None of the spot-checked sites looked load-bearing-defensive in the way try/catch does — most are legitimate "value may genuinely be undefined" use, e.g. optional FeedItem fields.
