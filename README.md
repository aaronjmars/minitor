# Minitor

An X Pro-style monitoring dashboard for watching feeds across the web. Build decks, pack them with columns, refresh on demand. Column types are plugins — X (search / users / mentions / trending), Web + News search, a Grok Ask column that answers a prompt with live X + web search every refresh, plus first-class adapters for Hacker News, Reddit, GitHub, RSS, Google News, Farcaster, YouTube, NewsNow, and a multi-source Mentions monitor.

Visually inspired by Cursor's warm-minimalism system (cream surfaces, warm near-black text, oklab borders, Instrument Serif for editorial moments) on top of shadcn + [blocks.so](https://blocks.so) primitives. The column and deck nav live in a sidebar block; ⌘K opens a command palette over all decks + columns + actions.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** + **shadcn/ui** (`base-nova` style on `@base-ui/react`) + **blocks.so** registry
- **Neon Postgres** via `@neondatabase/serverless` and **Drizzle ORM**
- **xAI Agent Tools API** (`/v1/responses` with `x_search` + `web_search`) — the Grok-powered backbone
- **zustand** for client state with server-action writes (no localStorage)
- **@dnd-kit** for sortable decks + columns
- **sonner** toasts, **cmdk** command palette, **Instrument Serif** + Geist fonts

## Architecture

```
Browser (React + zustand)
   │  optimistic mutation → calls server action
   ▼
app/actions.ts  ── Drizzle ──▶ Neon Postgres  (decks, columns, feed_items)
   │
   │   refresh flow:
   ▼
app/api/columns/[type]/route.ts
   │
   ▼
lib/integrations/xai.ts  ──▶ xAI /v1/responses (Grok)
                                   │
                                   ▼
                           tools: x_search, web_search
```

Columns are pure plugins. A `ColumnType` is a config form + item renderer + fetch function registered once in `lib/columns/registry.ts`.

## Setup

```bash
# 1. Install
npm install

# 2. Env
cp .env.example .env.local
# Fill in DATABASE_URL (Neon) and XAI_API_KEY (xAI)

# 3. Create the schema on Neon
npm run db:migrate     # applies drizzle/0000_*.sql via the Neon HTTP driver

# 4. Dev
npm run dev
```

Then open http://localhost:3000. First run drops you into an onboarding screen — name the first deck, pick 2–3 column types to seed.

## Scripts

| Script | Purpose |
|---|---|
| `dev`, `build`, `start` | standard Next.js |
| `lint` | ESLint (Next 16 strict rules incl. `react-hooks/purity`) |
| `db:generate` | `drizzle-kit generate` — produce new `drizzle/*.sql` from schema |
| `db:migrate` | apply pending migrations to the DB in `DATABASE_URL` |
| `db:studio` | `drizzle-kit studio` GUI |

## Column types

Registered in `lib/columns/registry.ts`:

| Type id | Source | Config | Paginated |
|---|---|---|---|
| `grok-ask` | xAI Grok with `x_search` + `web_search` | `{ prompt }` | — |
| `x-search` | xAI `x_search` (keyword mode) | `{ query }` | — |
| `x-user` | xAI `x_search` (user timeline) | `{ handle }` | — |
| `x-mentions` | xAI `x_search` — mentions of `@handle` | `{ handle }` | — |
| `x-trending` | xAI `x_search` — highest-engagement last 24h | `{ topic }` | — |
| `web-search` | xAI `web_search` | `{ query }` | — |
| `news-search` | xAI `web_search` — major publications | `{ query }` | — |
| `hacker-news` | Algolia HN API (`top` / `new` / `search`) | `{ mode, query }` | page-based |
| `reddit` | Reddit public JSON (`r/<sub>` + sort) | `{ subreddit, sortBy }` | `after` cursor |
| `github` | GitHub REST (`trending` via search, `releases`, `issues`) | `{ mode, language, period, repo, query }` | page-based |
| `rss` | Any RSS / Atom URL (built-in regex parser, no deps) | `{ url }` | — |
| `google-news` | Google News RSS query | `{ query, hl, gl }` | — |
| `mentions` | Multi-source fan-out: HN Algolia + Reddit search + Google News + Bing News, deduped on canonical URL | `{ query, sources }` | — |
| `farcaster` | Neynar — **User** + **Search** modes (Search uses `NEYNAR_API_DOCS` demo-key fallback on free tier; Trending / Channel kept in code, gated behind paid plan, see `lib/integrations/farcaster.ts`) | `{ mode, username, query }` | — |
| `youtube` | YouTube Data API v3 (search) + free Atom feeds (channel / playlist) | `{ mode, query, order, channel, playlist }` | `pageToken` (search) |
| `newsnow` | NewsNow open hot-trends aggregator (Weibo, Zhihu, Douyin, Bilibili, Toutiao, Baidu, Tieba, Wallstreetcn, CLS, ThePaper, iFeng) — needs a browser User-Agent (Cloudflare) | `{ platform }` | — |

### Adding a new column type

1. Create `lib/columns/my-type.tsx` exporting a `ColumnType`:
   - `id`, `label`, `description`, `icon`, `accent`
   - `defaultConfig`, `defaultTitle(config)`
   - `ConfigForm({ value, onChange })` — shadcn inputs
   - `ItemRenderer({ item })` — reuse `TweetItem` (`lib/columns/shared/tweet-renderer`) or `LinkItem` (`lib/columns/shared/link-renderer`) if the shape fits
   - `fetch(config)` — POST to `/api/columns/my-type` and parse `{ items: FeedItem[] }`
   - `fetchPage(config, cursor?)` *(optional)* — for paginated sources. Returns `{ items, nextCursor? }`. The card auto-renders a **Load more** button when this is defined and the last response had a cursor. Cursor is opaque (page number, `after` token, `pageToken`, etc.).
2. Register it in `lib/columns/registry.ts` (one line).
3. Add a case in `app/api/columns/[type]/route.ts` — for paginated types, branch on `op === "loadMore"` and the incoming `cursor`, then return `{ items, nextCursor }`. For one-shot types, just return `{ items }`.

That's it — the picker, sidebar nav, command palette, persistence, auto-refresh on creation, and Load more all pick it up automatically.

### Pagination contract

The unified shape used by every paginated integration:

```ts
type PageResult = { items: FeedItem[]; nextCursor?: string };
```

`nextCursor` semantics on the column card:
- `undefined` → unknown (initial state, or non-paginated type)
- `string`    → render **Load more**, pass back as `cursor` on next call
- `null`      → exhausted, render "End of results"

Refreshing always resets the cursor to the first page. New items are deduped against the column's stored set in `applyFetchedItems`; items are capped at 200 per column with the oldest pruned on refresh.

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
    types.ts                      # ColumnType / FeedItem / Column / Deck / PageResult
    registry.ts                   # single source of truth for installed types
    shared/{tweet,link}-renderer.tsx
    grok-ask.tsx / x-*.tsx / web-search.tsx / news-search.tsx
    reddit.tsx hacker-news.tsx github.tsx rss.tsx google-news.tsx
    mentions.tsx farcaster.tsx youtube.tsx newsnow.tsx
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
