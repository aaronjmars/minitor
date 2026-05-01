# Types assessment

Survey of every `type`/`interface` declaration outside `node_modules`,
`.next`, and `components/ui/*` (shadcn). Roughly 60 plugins/integration files
plus ~10 component files contain declarations.

## Existing organization (mostly already good)

- **`lib/columns/types.ts`** — canonical home for the column-plugin contract:
  `FeedItem`, `FeedAuthor`, `PageResult`, `ColumnUI`, `ColumnServer`,
  `PluginMeta`, `Column`, `Deck`, `defineColumnUI`/`defineColumnServer`, etc.
  Imported by every plugin and the store. This is the right shape.
- **Plugin folders** (`lib/columns/plugins/<id>/plugin.ts`) own the
  per-plugin `XxxConfig` (`z.infer<typeof schema>`) and `XxxMeta` shape and are
  the canonical source for both client & server. This is also correct — meta
  shapes are tightly coupled to the renderer + fetcher, not to the underlying
  HTTP integration's internal types.
- **`lib/columns/shared/tweet-renderer.tsx`** — `TweetMeta` is shared across
  the X plugins (re-exported from each plugin); good.
- **`lib/integrations/app-reviews.ts`** — `AppReviewMeta` is the canonical
  "review" meta and is correctly imported as `AppReviewMeta` by both the
  apple-reviews and play-reviews plugins (no duplication).
- **`lib/integrations/github.ts`** — `GHWatcherItemMeta` is correctly imported
  by both github-stars and github-forks plugins (no duplication).
- **`components/sidebar-01/types.ts`** — local sidebar types
  (`NavItem`, `User`, `FavoriteItem`, `TeamItem`, `TopicItem`, `SidebarData`).
  Used only inside `components/sidebar-01/`. Should stay local.
- **`app/actions.ts`** exports `Snapshot` and `EnvKeyStatus`; both are
  consumed via `import type` from the same module — this is fine (server
  actions module is the canonical owner).
- **`lib/db/client.ts`** exports `DatabaseKind` and `DatabaseConfig`; only
  used inside the same module — fine.
- **`lib/env-keys.ts`** exports `EnvKeySpec`; only consumed by `app/actions.ts`
  via `ENV_KEYS` — fine.
- **Drizzle inferred types** — none are currently re-exported, but no consumer
  imports them either. `loadSnapshot` reads via raw SQL and constructs
  `Snapshot` directly. Not an issue today; only worth re-deriving if a future
  consumer needs `typeof columns.$inferSelect`.

The existing organization is solid — there is no `lib/types/` directory, and
there shouldn't be one: domain types already live with the abstraction that
owns them (columns contract in `lib/columns/types.ts`, plugin metas with the
plugin, sidebar widgets with the sidebar). Component prop types are
appropriately local.

## Real duplications (HIGH confidence)

Three integration files declare types that are **byte-for-byte duplicates** of
the canonical types in their corresponding plugin folder. The plugin owns the
authoritative shape (it's `z.infer<typeof schema>` for configs, and the meta
is what the renderer + server actually consume). The integration version is a
hand-written copy that drifts silently.

| # | Type | Duplicate locations | Canonical home (recommend) |
|---|------|---------------------|----------------------------|
| 1 | `WalletTxMeta` | `lib/integrations/blockscout.ts:53` (with `[key:string]:unknown` index sig) **and** `lib/columns/plugins/wallet-tx/plugin.ts:24` | Plugin (`wallet-tx/plugin.ts`). Integration should `import type { WalletTxMeta }` from the plugin. |
| 2 | `BacklinkSource` + `BacklinksConfig` | `lib/integrations/github-backlinks.ts:7,14` **and** `lib/columns/plugins/github-backlinks/plugin.ts:10,12` | Plugin. Integration should import from the plugin. |
| 3 | `SubstackMeta` | `lib/integrations/substack.ts:16` **and** `lib/columns/plugins/substack/plugin.ts:12` | Plugin. Integration should import from the plugin. |
| 4 | `GHPRItemMeta` (integration) ↔ `GHPRMeta` (plugin) | `lib/integrations/github.ts:250` **and** `lib/columns/plugins/github-prs/plugin.ts:16` | Same shape, different name. Plugin's `GHPRMeta` is the consumed name (used in client.tsx `ItemRendererProps<GHPRMeta>`). Integration should import `GHPRMeta` from the plugin and drop its own. |

For all four, the plugin file is server-safe (it imports nothing client-only —
just zod + a lucide icon ref), so an integration importing from it stays inside
the server bundle.

Note: an integration → plugin import is the inverse of the typical plugin →
integration import path used elsewhere. That's fine because the meta type is a
shared *contract* between fetcher (integration) and renderer (plugin), not a
fetcher implementation detail. We could equally move the meta to a third file,
but the plugin file is already the source of truth that every consumer reads.

## Borderline / coincidentally similar — DO NOT consolidate

- `HNMeta` (plugin) vs `HNSearchHitMeta` (integration) — *different* shapes
  (the search variant has `kind`, `storyTitle`, `commentsUrl`); they evolve
  independently.
- `FCMeta` (plugin) vs `NeynarCast` (integration) — totally different; one is
  domain, other is API DTO.
- The various `Xxx*Response` / DTO interfaces inside integrations
  (`AlgoliaResponse`, `WeiboSearchResponse`, `GHRepo`, `GHIssue`,
  `NeynarCastsResponse`, `BSResponse`, etc.) are private to a single
  integration file. Keep local.
- `Chain` (blockscout) and the wallet-tx plugin's `z.enum([...chains])` — the
  list of chain ids is duplicated as a const tuple and a zod enum, but
  consolidating would require deriving the zod enum from `SUPPORTED_CHAINS`
  with `z.enum(SUPPORTED_CHAINS as unknown as readonly [string, ...string[]])`
  — adds friction without reuse benefit. Leave alone.

## Component prop types — keep local

All `interface Props { ... }` blocks in
`components/{column,deck,dialogs,sidebar-01,onboarding,settings}/*` and
`components/relative-time.tsx` are component-local prop shapes that aren't
reused anywhere else. Standard React practice. No action.

## Plan

Apply the four HIGH-confidence consolidations:

1. Make `lib/integrations/blockscout.ts` re-export `WalletTxMeta` from
   `lib/columns/plugins/wallet-tx/plugin.ts`.
2. Make `lib/integrations/github-backlinks.ts` re-export `BacklinkSource` and
   `BacklinksConfig` from `lib/columns/plugins/github-backlinks/plugin.ts`.
3. Make `lib/integrations/substack.ts` re-export `SubstackMeta` from
   `lib/columns/plugins/substack/plugin.ts`.
4. Make `lib/integrations/github.ts` re-export `GHPRMeta` (renaming
   `GHPRItemMeta` → `GHPRMeta`) from `lib/columns/plugins/github-prs/plugin.ts`.

Each consolidation is a re-export so existing call sites that already
`import { ... } from "@/lib/integrations/..."` keep working.

Verified after the fact with `npx tsc --noEmit` and `npm run lint`.
