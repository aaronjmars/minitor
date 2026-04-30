# Minitor

An X Pro-style monitoring dashboard for watching feeds across the web. Build decks, pack them with columns, refresh on demand. Column types are plugins — X (search / users / mentions / trending), Web + News search, a Grok Ask column that answers a prompt with live X + web search every refresh, plus first-class adapters for Hacker News, Reddit, GitHub, RSS, Google News, Farcaster, YouTube, NewsNow, and a multi-source Mentions monitor.

Visually inspired by Cursor's warm-minimalism system (cream surfaces, warm near-black text, oklab borders, Instrument Serif for editorial moments) on top of shadcn + [blocks.so](https://blocks.so) primitives. The column and deck nav live in a sidebar block; ⌘K opens a command palette over all decks + columns + actions.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** + **shadcn/ui** (`base-nova` style on `@base-ui/react`) + **blocks.so** registry
- **Postgres** via **Drizzle ORM**, with three driver choices picked at runtime by `DATABASE_URL`:
  - default (no env): **PGlite** — embedded Postgres compiled to WASM, file-backed at `.minitor/pgdata/`. Zero setup.
  - any `postgres://` URL: **node-postgres** pool.
  - any `*.neon.tech` URL: **`@neondatabase/serverless`** HTTP driver.
- **xAI Agent Tools API** (`/v1/responses` with `x_search` + `web_search`) — the Grok-powered backbone
- **zustand** for client state with server-action writes (no localStorage)
- **@dnd-kit** for sortable decks + columns
- **sonner** toasts, **cmdk** command palette, **Instrument Serif** + Geist fonts

## Architecture

```
Browser (React + zustand)
   │  optimistic mutation → calls server action
   ▼
app/actions.ts  ── Drizzle ──▶ Postgres  (decks, columns, feed_items)
   │
   │   refresh flow:
   ▼
app/api/columns/[type]/route.ts
   │  Zod-validates body.config against the plugin's schema
   ▼
lib/columns/server-registry.ts  →  plugins/<id>/server.ts  →  lib/integrations/<source>.ts
```

Columns are pure plugins. Each column type lives in its own folder under
`lib/columns/plugins/<id>/` with three files (`plugin.ts`, `client.tsx`,
`server.ts`). Adding a new source is mechanical — copy `_template/`, fill
in the schema + form + fetcher, register it. See [`lib/columns/README.md`](lib/columns/README.md)
for the full contract.

## Setup

The fastest path needs nothing but Node — no Docker, no Postgres install, no
hosted DB account. The default Drizzle client is PGlite (real Postgres
compiled to WASM, persisted at `.minitor/pgdata/`).

```bash
# 1. Install
npm install

# 2. Optional — only if you want non-keyless columns (Grok / X / News /
# Farcaster / YouTube search). Skip this for purely-keyless dev (Reddit,
# HN, RSS, Google News, NewsNow, GitHub, YouTube channel/playlist).
cp .env.example .env.local
# Fill in XAI_API_KEY etc. Leave DATABASE_URL commented out for local PGlite.

# 3. Create the schema
npm run db:migrate     # PGlite by default; honors DATABASE_URL when set

# 4. Dev
npm run dev
```

Then open http://localhost:3000. First run drops you into an onboarding
screen — name the first deck, pick 2–3 column types to seed.

### Pointing at a different database

Set `DATABASE_URL` in `.env.local`:

| URL form | Driver picked |
|---|---|
| *unset* / `pglite:` / `file:` / `memory:` | PGlite (file at `.minitor/pgdata/`) |
| `postgres://user:pass@localhost/minitor` | node-postgres |
| `postgresql://…@…neon.tech/…?sslmode=require` | `@neondatabase/serverless` HTTP |

`npm run db:migrate` and the runtime client both honor the same selector
(`lib/db/client.ts:resolveDatabaseConfig`).

## Scripts

| Script | Purpose |
|---|---|
| `dev`, `build`, `start` | standard Next.js |
| `lint` | ESLint (Next 16 strict rules incl. `react-hooks/purity`) |
| `db:generate` | `drizzle-kit generate` — produce new `drizzle/*.sql` from schema |
| `db:migrate` | apply pending migrations to the DB in `DATABASE_URL` |
| `db:studio` | `drizzle-kit studio` GUI |

## Column types

Listed in `lib/columns/plugins/manifest.ts`:

| Type id | Category | Source | Capabilities |
|---|---|---|---|
| `grok-ask` | ai | xAI Grok with `x_search` + `web_search` | `requiresEnv: XAI_API_KEY` |
| `x-search` | social | xAI `x_search` (keyword mode) | `requiresEnv: XAI_API_KEY` |
| `x-user` | social | xAI `x_search` (user timeline) | `requiresEnv: XAI_API_KEY` |
| `x-mentions` | social | xAI `x_search` — mentions of `@handle` | `requiresEnv: XAI_API_KEY` |
| `x-trending` | social | xAI `x_search` — highest-engagement last 24h | `requiresEnv: XAI_API_KEY` |
| `web-search` | ai | xAI `web_search` | `requiresEnv: XAI_API_KEY` |
| `news-search` | news | xAI `web_search` — major publications | `requiresEnv: XAI_API_KEY` |
| `hacker-news` | news | Algolia HN API (`top` / `new` / `ask` / `show` / `query`) | `paginated` (page-based) |
| `reddit` | social | Reddit public JSON (`r/<sub>` + sort) | `paginated` (`after` cursor) |
| `github` | social | GitHub REST (`trending` via search, `releases`, `issues`) | `paginated` (page-based) |
| `rss` | news | Any RSS / Atom URL (built-in regex parser, no deps) | — |
| `google-news` | news | Google News RSS query | — |
| `mentions` | news | Multi-source fan-out: HN Algolia + Reddit search + Google News + Bing News, deduped on canonical URL | — |
| `farcaster` | social | Neynar — **User** + **Search** modes (Search uses `NEYNAR_API_DOCS` demo-key fallback on free tier; Trending / Channel kept in code, gated behind paid plan) | `requiresEnv: NEYNAR_API_KEY` |
| `youtube` | video | YouTube Data API v3 (search) + free Atom feeds (channel / playlist) | `paginated` (`pageToken` on search), `requiresEnv: YOUTUBE_API_KEY` |
| `newsnow` | news | NewsNow open hot-trends aggregator (Weibo, Zhihu, Douyin, Bilibili, Toutiao, Baidu, Tieba, Wallstreetcn, CLS, ThePaper, iFeng) | — |

### Plugin contract

Each column type is a folder of three files. The split is structural:
`plugin.ts` is pure (no JSX, no server-only deps) so it can be evaluated on
either side of the `"use client"` boundary; `client.tsx` and `server.ts`
carry their respective directives.

```
lib/columns/plugins/<id>/
  plugin.ts     # id, label, icon, Zod schema, defaultConfig, capabilities
  client.tsx    # "use client"   — ConfigForm + ItemRenderer
  server.ts     # "server-only"  — fetch function (talks to upstream APIs)
```

Three things make adding a plugin cheap:

- **Zod schema in `plugin.ts`** is the single source of truth for the
  config shape. The API route validates `body.config` against it before
  calling the fetcher, so server code receives a fully-typed config and
  bad client input returns a structured 400 with field-level errors.
- **Typed `meta` per plugin** — declare a `TMeta` interface and the
  renderer receives `FeedItem<TMeta>` directly (no `typeof m.foo === "number"`
  guards).
- **Capabilities object** declares `paginated`, `requiresEnv`, `rateLimitHint`,
  `refreshIntervalHintMs`. The "Add column" dialog auto-renders a hint when
  `requiresEnv` or `rateLimitHint` is set, and the column card uses
  `capabilities.paginated` to decide whether to show **Load more**.

A canonical id list lives in `lib/columns/plugins/manifest.ts` and is
imported by both `registry.ts` (client UI) and `server-registry.ts`
(server fetchers). The server registry runs a parity check at module init
and throws loudly if either registry is out of sync with the manifest —
that's the only thing standing between you and a 404 / silent breakage in
production.

### Adding a new column type

1. Copy `lib/columns/plugins/_template/` to `lib/columns/plugins/<your-id>/`.
2. Edit `plugin.ts` — pick id/label/icon/category, define a Zod schema,
   declare your `TMeta`, set `capabilities`.
3. Edit `client.tsx` — implement `ConfigForm` + `ItemRenderer`. Reuse
   `TweetItem` or `LinkItem` from `lib/columns/shared/` if the shape fits.
4. Edit `server.ts` — implement the fetcher. The `config` you receive is
   already typed and validated by your schema.
5. Add three lines: one entry each in `manifest.ts`, `registry.ts`, and
   `server-registry.ts`.
6. `npm run build` — the parity check throws if any of the three are out
   of sync.

That's it. Picker, sidebar nav, command palette, persistence, auto-refresh,
and Load more all pick it up automatically. See [`lib/columns/README.md`](lib/columns/README.md)
for the full walkthrough.

### Pagination contract

Every plugin's `server.ts` returns the same shape:

```ts
type PageResult<TMeta> = { items: FeedItem<TMeta>[]; nextCursor?: string };
```

`nextCursor` is opaque end-to-end — encode whatever your upstream paginates
with (page number, `after` token, `pageToken`, etc.) as a string. The
shared API client and column card never inspect it. Semantics on the card:

- `undefined` → unknown (initial state, or `capabilities.paginated` is false)
- `string`    → render **Load more**, pass back as `cursor` on next call
- `null`      → exhausted, render "End of results"

Refreshing always resets the cursor to the first page. New items are
deduped against the column's stored set in `applyFetchedItems`; items
are capped at 200 per column with the oldest pruned on refresh.

## Data model

```
decks        (id, name, position, created_at)
columns      (id, deck_id, type_id, title, config jsonb, position, last_fetched_at, created_at)
feed_items   (column_id, id, author jsonb, content, url, created_at, meta jsonb, fetched_at)
             PRIMARY KEY (column_id, id)
             INDEX (column_id, created_at DESC)
```

Feed items are capped at 200 per column (older rows pruned on each refresh).

## Key files

```
app/
  actions.ts                      # server actions: loadSnapshot + CRUD + persistFetchedItems
  api/columns/[type]/route.ts     # refresh + load-more dispatcher (paginated + one-shot)
  layout.tsx, page.tsx, globals.css

lib/
  db/{schema,client}.ts           # drizzle schema + neon-http client
  integrations/
    xai.ts                        # grokAsk, grokX*, grokWebSearch, grokNewsSearch
    hackernews.ts                 # Algolia HN — fetchHackerNewsPage(mode, query, limit, page)
    reddit.ts                     # Public JSON — fetchSubredditPage(sub, sort, limit, after?) + searchReddit
    github.ts                     # REST — trending (via search) / releases / issues, all paged
    rss.ts                        # zero-dep RSS+Atom regex parser, googleNewsUrl(query, hl, gl)
    mentions.ts                   # multi-source fan-out + canonical-URL dedup
    farcaster.ts                  # Neynar — user / search (with NEYNAR_API_DOCS fallback). Trending + Channel kept gated.
    youtube.ts                    # Data API v3 search (paged via pageToken) + Atom for channel/playlist
    newsnow.ts                    # 11 platforms (Weibo, Zhihu, Douyin, Bilibili, Toutiao, Baidu, Tieba, WSCN, CLS, ThePaper, iFeng)
  columns/
    README.md                     # how to add a new column type
    types.ts                      # ColumnUI / ColumnServer / PluginMeta / FeedItem / PageResult / capabilities
    registry.ts                   # client UI by id (consumed by add-column-dialog, column-card, etc.)
    server-registry.ts            # server fetchers by id, with parity check at module init
    api-client.ts                 # callColumnApi(typeId, config, cursor?)
    constants.ts                  # PAGE_SIZE, MAX_ITEMS_PER_COLUMN, BEAM_MIN_DURATION_MS
    shared/{tweet,link}-renderer.tsx
    plugins/
      manifest.ts                 # canonical id list — single source of truth
      _template/                  # copyable starter (NOT registered)
      reddit/{plugin,client,server}.ts
      hacker-news/{plugin,client,server}.ts
      github/{plugin,client,server}.ts
      youtube/{plugin,client,server}.ts
      farcaster/{plugin,client,server}.ts
      mentions/{plugin,client,server}.ts
      newsnow/{plugin,client,server}.ts
      rss/{plugin,client,server}.ts
      google-news/{plugin,client,server}.ts
      grok-ask/{plugin,client,server}.ts
      x-{search,user,mentions,trending}/{plugin,client,server}.ts
      web-search/{plugin,client,server}.ts
      news-search/{plugin,client,server}.ts
  store/use-deck-store.ts         # zustand store; pendingCreates Map for FK-safe auto-fetch; autoFetchingIds Set drives the beam

components/
  deck/{deck-view,deck-board,deck-tabs}.tsx
  column/{column-card,add-column-dialog,configure-column-dialog}.tsx
  sidebar-01/{app-sidebar,nav-header,nav-decks,nav-stats,nav-footer}.tsx
  onboarding/welcome.tsx
  dialogs/{rename,confirm}-dialog.tsx
  relative-time.tsx               # live-ticking timestamps via shared 1s useSyncExternalStore
  ui/*                            # shadcn base-nova primitives

drizzle/                          # generated SQL migrations (committed)
scripts/db-migrate.mjs            # applies drizzle SQL via neon HTTP
```

## UI niceties

- **Auto-fetch on column creation** — `AddColumnDialog.commit()` fires `autoFetchColumn(newId, type)` after the server INSERT resolves. The store's `pendingCreates` map awaits the create promise so the FK on `feed_items.column_id` is always satisfied.
- **Loading skeleton** — empty columns that are mid-fetch (manual or auto) render staggered shimmer rows instead of the "No items yet" CTA.
- **Live-ticking relative timestamps** — a single module-level 1Hz ticker (one `setInterval` for the whole app) drives `<RelativeTime>` via `useSyncExternalStore`. `compact` mode (`5s` / `12m` / `3h` / `2d`) is used in tweet-style renderers.
- **Beam** — refresh / Grok Ask indicator. CSS-only conic-gradient border, animated via `@property --beam-angle` + `@keyframes beam-spin`. See `.beam-frame` in `app/globals.css`. Activated via `data-beam-active="true"` / `data-beam-variant="grok"` on the column card wrapper. Driven by `isFetching || isAutoFetching || isGrokAsk`.
- **Real X profile pictures** — `lib/integrations/xai.ts` resolves avatars via `https://unavatar.io/x/<handle>?fallback=<dicebear-url>`, so X posts show the actual user PFP and gracefully fall back to a deterministic avatar.
- **Sidebar deck collapsibles are controlled** — fixes a Base UI warning when `defaultOpen` flipped on `setActiveDeck`. Each deck's open state is tracked in an `openOverrides` map and falls back to "open if active" when no explicit override exists.

## Theme

The palette lives in `app/globals.css`:

- **Background** `#f2f1ed` · **Foreground** `#26251e`
- **Surface scale** `#f7f7f4` / `#ebeae5` / `#e6e5e0` / `#e1e0db`
- **Brand** `#f54e00` with **crimson hover** `#cf2d56`
- **Borders** `oklab(0.263 -0.0023 0.0125 / 0.1)` — perceptually uniform
- **Semantic accents** (column icons): sky `#9fbbe0`, sage `#9fc9a2`, lavender `#c0a8dd`, peach `#dfa88f`, gold `#c08532`

Typography: **Geist** for display/UI, **Instrument Serif** for editorial body (tweet content, deck titles, onboarding headline — with `"cswh"` contextual swash alternates), **Geist Mono** for code.

## Beam

The refresh / Grok Ask indicator is a CSS-only continuous conic-gradient border, animated via `@property --beam-angle` + `@keyframes beam-spin`. See `.beam-frame` in `app/globals.css`. Activated via `data-beam-active="true"` / `data-beam-variant="grok"` on the column card wrapper.

## Security

- `.env.local` is gitignored — only `.env.example` ships.
- No auth layer: the Neon DB is a single shared workspace. Every browser hitting your deployment will see the same decks/columns. To make it per-user, add a `user_id` column to each table and filter in the server actions.
- xAI calls happen server-side via `/api/columns/[type]`, so the API key never reaches the client.

## Deployment

- Vercel or any Node host works. Set `DATABASE_URL` and `XAI_API_KEY` as env vars.
- `@neondatabase/serverless` uses the HTTP driver (no websockets in serverless), so Neon's pooled connection string is required.
- `app/api/columns/[type]/route.ts` is marked `dynamic = "force-dynamic"` and `maxDuration = 60` for Grok latency.
