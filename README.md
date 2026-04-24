# Minitor

An X Pro-style monitoring dashboard for watching feeds across the web. Build decks, pack them with columns, refresh on demand. Column types are plugins — X search, mentions, user timelines, trending, web search, news, Reddit, and a Grok Ask column that answers a prompt with live X + web search every refresh.

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

| Type id | Source | Config |
|---|---|---|
| `grok-ask` | xAI Grok with `x_search` + `web_search` | `{ prompt }` |
| `x-search` | xAI `x_search` (keyword mode) | `{ query }` |
| `x-user` | xAI `x_search` (user timeline) | `{ handle }` |
| `x-mentions` | xAI `x_search` — mentions of `@handle` | `{ handle }` |
| `x-trending` | xAI `x_search` — highest-engagement last 24h | `{ topic }` |
| `web-search` | xAI `web_search` | `{ query }` |
| `news-search` | xAI `web_search` — major publications | `{ query }` |
| `reddit` | mock adapter (kept to show plugin path) | `{ subreddit, sortBy }` |

### Adding a new column type

1. Create `lib/columns/my-type.tsx` exporting a `ColumnType`:
   - `id`, `label`, `description`, `icon`, `accent`
   - `defaultConfig`, `defaultTitle(config)`
   - `ConfigForm({ value, onChange })` — shadcn inputs
   - `ItemRenderer({ item })` — reuse `TweetItem` (`lib/columns/shared/tweet-renderer`) or `LinkItem` (`lib/columns/shared/link-renderer`) if the shape fits
   - `fetch(config)` — POST to `/api/columns/my-type` and parse `{ items: FeedItem[] }`
2. Register it in `lib/columns/registry.ts` (one line).
3. Add a case in `app/api/columns/[type]/route.ts` calling your fetcher (mock or a new helper in `lib/integrations/xai.ts`).

That's it — the picker, sidebar nav, command palette, and persistence pick it up automatically.

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
  api/columns/[type]/route.ts     # refresh dispatcher
  layout.tsx, page.tsx, globals.css

lib/
  db/{schema,client}.ts           # drizzle schema + neon-http client
  integrations/xai.ts             # grokAsk, grokX*, grokWebSearch, grokNewsSearch
  columns/
    types.ts                      # ColumnType / FeedItem / Column / Deck
    registry.ts                   # single source of truth for installed types
    shared/{tweet,link}-renderer.tsx
    grok-ask.tsx / x-*.tsx / web-search.tsx / news-search.tsx / reddit.tsx
  store/use-deck-store.ts         # zustand store; every mutation hits a server action

components/
  deck/{deck-view,deck-board}.tsx
  column/{column-card,add-column-dialog,configure-column-dialog}.tsx
  sidebar-01/{app-sidebar,nav-header,nav-decks,nav-stats,nav-footer}.tsx
  onboarding/welcome.tsx
  dialogs/{rename,confirm}-dialog.tsx
  ui/*                            # shadcn base-nova primitives

drizzle/                          # generated SQL migrations (committed)
scripts/db-migrate.mjs            # applies drizzle SQL via neon HTTP
```

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
