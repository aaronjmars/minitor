<p align="center">
  <img src="./public/logo.png" alt="Minitor" width="120" />
</p>

<h1 align="center">Minitor</h1>

<p align="center">
  <a href="https://github.com/aaronjmars/minitor/stargazers"><img src="https://img.shields.io/github/stars/aaronjmars/minitor?style=flat-square&logo=github" alt="GitHub stars"></a>
  <a href="https://github.com/aaronjmars/minitor/network/members"><img src="https://img.shields.io/github/forks/aaronjmars/minitor?style=flat-square&logo=github" alt="GitHub forks"></a>
  <a href="https://x.com/aeonframework"><img src="https://img.shields.io/badge/by-%40aeonframework-black?style=flat-square&logo=x&labelColor=000000" alt="by aeon"></a>
</p>

---

> **An X Pro–style monitoring dashboard for the open web — decks, columns, plugins.**
> Build a deck, pack it with columns, refresh on demand. Each column is a plugin: X, Reddit, Hacker News, GitHub (trending / releases / issues / PRs / stars / forks / backlinks / search), Farcaster, YouTube, RSS, Google News, Bing, Substack, LinkedIn / Facebook / Instagram mentions, Apple + Google Play reviews, on-chain wallet activity, and the six biggest Chinese platforms (Weibo / Zhihu / Douyin / Bilibili / Toutiao / Baidu).

### What it does

- You name a deck. Minitor packs it with whatever you're watching.
- 31 column types out of the box — social feeds, news, GitHub, app reviews, on-chain transactions, Chinese hot boards.
- Refresh per column or auto-fetch on creation. Load more pages 10 at a time.
- ⌘K command palette over every deck, column, and action. Drag to reorder.
- Local-first by default — embedded PGlite, no Postgres install needed.

### Quick start

The recommended path: **one command, `./minitor`.** First column up in under a minute, zero infra.

**Prereqs** — Node 20+. That's it. PGlite is bundled (real Postgres compiled to WASM), so no Docker, no hosted database, no setup.

```bash
git clone https://github.com/aaronjmars/minitor.git && cd minitor
./minitor
```

The launcher checks Node, picks the right package manager (npm / pnpm / yarn / bun based on lockfile), installs deps, copies `.env.example` → `.env.local` if missing, runs DB migrations against PGlite, and starts the dev server at `http://localhost:3000`. Re-running it just starts the server.

For Grok / X / News / Web / Farcaster columns, paste your **[xAI API key](https://console.x.ai/)** into `XAI_API_KEY` in `.env.local`. Keyless columns (Reddit, HN, RSS, Google News, Bing, GitHub, China Hot, YouTube channel/playlist, app reviews, wallet transactions) work out of the box with no keys.

**Other launcher subcommands:**

```bash
./minitor build      # production build
./minitor start      # production server (after build)
./minitor migrate    # run DB migrations only
./minitor doctor     # print environment diagnostics
./minitor reset      # wipe the local PGlite data dir
./minitor help       # full usage
```

### Column types

| Plugin | Source | Keys |
|---|---|---|
| **X · Search** | xAI `x_search` (operators: `from:`, `to:`, `@`, `#`, `min_faves:`, `lang:`, `since:`) | `XAI_API_KEY` |
| **X · Trending** | xAI `x_search` — top engagement, last 24h | `XAI_API_KEY` |
| **Reddit** | Public JSON, per-subreddit | — |
| **Hacker News** | Algolia HN — top / new / Ask / Show / search | — |
| **GitHub trending** | GitHub Search API — by language + window | — |
| **GitHub releases** | Repo releases endpoint | — |
| **GitHub issues / PRs** | Issue search syntax (`is:open`, `repo:`, `label:`, `author:`…) | — |
| **GitHub PRs** | Latest PRs on a specific repo | — |
| **GitHub stars** | New stargazers, newest first | — |
| **GitHub forks** | New forks, newest first | — |
| **GitHub search** | Free-form mention monitoring (repos / issues / code / commits) | — |
| **GitHub backlinks** | Multi-source fan-out for repo mentions (HN + Reddit + Google News + Bing News + GitHub issues) | — |
| **RSS** | Any RSS / Atom feed | — |
| **Google News** | Search-driven news, all languages by default | — |
| **News · Topic** | xAI `web_search` — major publications | `XAI_API_KEY` |
| **Web search** | Bing News RSS, keyless | — |
| **Farcaster** | Neynar (search + user via `@handle` / `from:handle`) — falls back to `NEYNAR_API_DOCS` demo key | optional `NEYNAR_API_KEY` |
| **YouTube** | Atom feeds (channel / playlist) + Data API v3 (search) | optional `YOUTUBE_API_KEY` (search only) |
| **Substack** | Per-publication RSS, or keyword-only via xAI `web_search` (`site:substack.com`) | optional `XAI_API_KEY` for keyword mode |
| **LinkedIn mentions** | xAI `web_search` (`site:linkedin.com/posts`) | `XAI_API_KEY` |
| **Facebook mentions** | xAI `web_search` (`site:facebook.com`) | `XAI_API_KEY` |
| **Instagram** | xAI `web_search` (`site:instagram.com`) | `XAI_API_KEY` |
| **Apple reviews** | iTunes RSS, per-app, per-country | — |
| **Google Play reviews** | Public Play store endpoint | — |
| **Wallet · Transactions** | Blockscout REST v2 across 9 EVM chains (Ethereum, Base, Optimism, Arbitrum, Polygon, Gnosis, Scroll, Celo, zkSync) | — |
| **Weibo · Hot search** | NewsNow aggregator | — |
| **Zhihu · Hot** | NewsNow aggregator | — |
| **Douyin · Hot** | NewsNow aggregator | — |
| **Bilibili · Hot search** | NewsNow aggregator | — |
| **Toutiao** | NewsNow aggregator | — |
| **Baidu · Hot search** | NewsNow aggregator | — |

Add a new source by copying `lib/columns/plugins/_template/` — see [`lib/columns/README.md`](lib/columns/README.md) for the full plugin contract.

### Features

| Feature | What it does |
|---|---|
| **`./minitor` launcher** | One command bootstraps deps, env, DB, and dev server. Idempotent — re-running just starts the server |
| **PGlite default** | Embedded real Postgres compiled to WASM — zero install. Swap to node-postgres or Neon by setting `DATABASE_URL` |
| **Plugin architecture** | Every column type is a 3-file plugin (`plugin.ts`, `client.tsx`, `server.ts`). Init-time parity check across the 3 registries catches drift loudly |
| **Zod-validated configs** | Every plugin's config shape is a Zod schema — single source of truth, structured 400s on bad client input |
| **Cursor-based pagination** | Every plugin returns `{ items, nextCursor? }`. The card shows **Load more** when a cursor is present, **End of results** when null |
| **10 items per page** | Standardized across all plugins. Refresh fetches first 10, Load more pages through the rest in 10s |
| **⌘K command palette** | Jump to any deck, column, or action. Driven by `cmdk` |
| **Drag to reorder** | Decks and columns are sortable via `@dnd-kit` with optimistic UI |
| **Auto-refresh beam** | CSS-only conic-gradient border on every refreshing column. No JS animation loop |
| **Live-ticking timestamps** | Single 1Hz `setInterval` for the whole app drives every `<RelativeTime>` via `useSyncExternalStore` |
| **Onboarding flow** | First run drops you into a guided deck-creation screen with curated starter columns |
| **"Hide sources you can't use"** | Add-column dialog dims plugins whose required env keys are missing — server only ever reports presence, never values |
| **Optimistic mutations** | Zustand store with server-action writes. No localStorage — every device sees the same state |
| **Multi-driver Postgres** | Same Drizzle schema works against PGlite, node-postgres, or Neon's serverless HTTP driver, picked at runtime by `DATABASE_URL` |

### Use cases

- **Founder dashboard** — your X mentions, Hacker News, Product Hunt RSS, GitHub stars on your repo, App Store reviews, Substack analytics, all on one screen
- **Crypto desk** — wallet activity across 9 chains, X trending in crypto, Reddit r/cryptocurrency, news search for protocol names
- **Open-source maintainer** — GitHub trending in your language, new issues / PRs across watched repos, new stargazers + forks, backlinks from HN / Reddit / news for your repo URL
- **Journalist** — Google News + Bing + xAI news search on a topic, paired with X trending and Reddit threads, plus Substack publications you trust
- **PM / marketing** — Apple + Google Play reviews on your app, Twitter mentions, LinkedIn / Facebook / Instagram mentions, Substack write-ups
- **China-watcher** — Weibo, Zhihu, Douyin, Bilibili, Toutiao, and Baidu hot boards in one column stack
- **Personal radar** — RSS for the blogs that matter, Farcaster for the casts that matter, no algorithmic feed in sight

### Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Tailwind v4** + **shadcn/ui** (`base-nova` style on `@base-ui/react`)
- **Drizzle ORM** with three runtime drivers (PGlite default / node-postgres / `@neondatabase/serverless`)
- **xAI Agent Tools API** (`/v1/responses` with `x_search` + `web_search`) — Grok-powered search backbone
- **zustand** for client state with server-action writes
- **@dnd-kit** for sortable decks + columns
- **sonner** toasts, **cmdk** command palette, **Instrument Serif** + Geist fonts

### Pointing at a different database

Set `DATABASE_URL` in `.env.local`:

| URL form | Driver picked |
|---|---|
| *unset* / `pglite:` / `file:` / `memory:` | PGlite (file at `.minitor/pgdata/`) |
| `postgres://user:pass@localhost/minitor` | node-postgres |
| `postgresql://…@…neon.tech/…?sslmode=require` | `@neondatabase/serverless` HTTP |

`./minitor migrate` and the runtime client honor the same selector (`lib/db/client.ts:resolveDatabaseConfig`).

### Documentation

| | |
|---|---|
| [Plugin contract](lib/columns/README.md) | The 3-file plugin pattern + how to add a new column type |
| [`lib/columns/types.ts`](lib/columns/types.ts) | `ColumnUI`, `ColumnServer`, `PluginMeta`, `FeedItem`, `PageResult`, `Capabilities` |
| [`lib/columns/plugins/manifest.ts`](lib/columns/plugins/manifest.ts) | Canonical plugin id list — single source of truth |
| [`lib/columns/paginate.ts`](lib/columns/paginate.ts) | Slice-based cursor pagination helper for non-cursor sources |
| [`lib/db/client.ts`](lib/db/client.ts) | Multi-driver Drizzle client (PGlite / pg / Neon HTTP) |
| [`scripts/db-migrate.mjs`](scripts/db-migrate.mjs) | The migration runner used by `./minitor migrate` |

### Deployment

- Vercel or any Node host works. Set `DATABASE_URL` and `XAI_API_KEY` as env vars.
- `@neondatabase/serverless` uses the HTTP driver (no websockets in serverless), so Neon's pooled connection string is required.
- `app/api/columns/[type]/route.ts` is `dynamic = "force-dynamic"` and `maxDuration = 60` for Grok latency.

### Security

- `.env.local` is gitignored — only `.env.example` ships.
- Server actions call xAI / Neynar / GitHub server-side; API keys never reach the client.
- The add-column dialog asks the server which env keys are *present* (boolean only, values never leave the server) to grey out plugins you can't use.
- No auth layer: every browser hitting your deployment sees the same decks. To partition per user, add a `user_id` column to each table and filter in the server actions.

## License

MIT.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=aaronjmars/minitor&type=Date)](https://www.star-history.com/#aaronjmars/minitor&Date)
