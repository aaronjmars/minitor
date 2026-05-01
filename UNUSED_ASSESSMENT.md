# Unused Code Assessment

This document captures the findings of `npx knip` and `npx ts-prune` runs, with manual verification of every candidate. HIGH confidence items are removed in this branch; MEDIUM/LOW are flagged here for separate review.

Tools used:
- `npx knip@latest --no-config-hints`
- `npx ts-prune`
- Manual `rg` searches across `*.ts`, `*.tsx`, `*.css`, `*.json`, `*.mjs`, `*.md` for each candidate

Conventions: knip's flag is shown verbatim; my verification result and decision follow.

---

## Unused files — REMOVED (HIGH confidence)

| File | Type | knip | Verification | Confidence | Decision |
|---|---|---|---|---|---|
| `components/deck/deck-tabs.tsx` | React component (`DeckTabs`) | unused | `rg DeckTabs` finds zero importers | HIGH | REMOVE |
| `components/sidebar-01/nav-main.tsx` | React component (`NavMain`) | unused | no importers | HIGH | REMOVE |
| `components/sidebar-01/nav-collapsible.tsx` | React component (`NavCollapsible`) | unused | only references itself + `sidebar-01/types.ts` | HIGH | REMOVE |
| `components/sidebar-01/types.ts` | type module (`SidebarData`, `User`, etc.) | unused | only imported by `nav-collapsible.tsx` (also being removed) | HIGH | REMOVE |
| `components/ui/card.tsx` | shadcn primitive | unused | zero importers | HIGH | REMOVE |
| `components/ui/scroll-area.tsx` | shadcn primitive | unused | zero importers | HIGH | REMOVE |
| `lib/integrations/telegram.ts` | integration module | unused | zero importers | HIGH | REMOVE |
| `lib/integrations/weibo.ts` | integration module | unused | zero importers (note: `weibo-hot` plugin uses `newsnow.ts`, not this file) | HIGH | REMOVE |
| `lib/mock/generators.ts` | mock data utilities | unused | zero importers | HIGH | REMOVE |

## Unused files — KEPT (MEDIUM confidence)

| File | Type | knip | Verification | Confidence | Decision |
|---|---|---|---|---|---|
| `lib/columns/plugins/_template/{plugin.ts,client.tsx,server.ts}` | Plugin scaffolding | unused | `rg _template` shows it's referenced from `README.md` and `lib/columns/README.md` as the canonical "copy this to add a source" template; `_template` is intentionally not registered. | MEDIUM | KEEP — documented intentional scaffolding |

---

## Unused dependencies — REMOVED (HIGH confidence)

| Package | knip | Verification | Confidence | Decision |
|---|---|---|---|---|
| `@tabler/icons-react` | unused | `rg tabler` finds only `package.json`/`package-lock.json` entries; zero imports | HIGH | REMOVE |
| `border-beam` | unused | `rg border-beam` finds only CSS *comments* describing visual feel; no actual usage | HIGH | REMOVE |

## Unused dependencies — KEPT (peer / runtime requirement)

| Package | knip | Reason kept |
|---|---|---|
| `react-dom` | "unused" | Required by Next.js at runtime; not directly imported but DOM rendering depends on it. Removing breaks build. |
| `@types/react-dom` | "unused devDep" | Conventional companion to `@types/react` for the Next.js + React 19 type ecosystem; safer to keep. |
| `dotenv-cli` | "unlisted binary `dotenv`" | Used as `dotenv` binary in `npm run db:studio` script. |

---

## Unused exports — REMOVED (HIGH confidence: function/type entirely unreferenced)

| Export | File | Verification | Decision |
|---|---|---|---|
| `grokXUser` | `lib/integrations/xai.ts` | Zero references anywhere | REMOVE function |
| `grokXMentions` | `lib/integrations/xai.ts` | Zero references | REMOVE function |
| `grokAsk` | `lib/integrations/xai.ts` | Zero references | REMOVE function |
| `searchHackerNewsByUrlOrKeyword` | `lib/integrations/hackernews.ts` | Zero references | REMOVE function |
| `fetchSubreddit` | `lib/integrations/reddit.ts` | Only `fetchSubredditPage` is used (by `plugins/reddit/server.ts`); `fetchSubreddit` is a deprecated wrapper with zero refs | REMOVE function |
| `AvatarGroup` | `components/ui/avatar.tsx` | Zero external use; not used internally | REMOVE function + export |
| `AvatarGroupCount` | `components/ui/avatar.tsx` | Zero external use; not used internally | REMOVE function + export |
| `AvatarBadge` | `components/ui/avatar.tsx` | Zero external use; not used internally | REMOVE function + export |

## Unused exports — KEPT (MEDIUM: used internally; only the `export` keyword is redundant)

These functions/types are referenced inside their own modules (callers, type aliases, JSDoc-by-type-position). Dropping the `export` would be mechanical churn rather than removing code. Listed here for completeness.

- `pageFromCursor` (`lib/columns/paginate.ts`) — used by `sliceForPage` in same file
- `buttonVariants` (`components/ui/button.tsx`) — used by `Button` props internally
- `LOCAL_PGLITE_DIR`, `resolveDatabaseConfig`, `DatabaseKind`, `DatabaseConfig` (`lib/db/client.ts`) — used internally
- `SUPPORTED_CHAINS`, `Chain`, `WalletTxMeta`, `getChainInfo`, `explorerTxUrl`, `explorerAddressUrl`, `isValidEvmAddress`, `encodeCursor`, `decodeCursor` (`lib/integrations/blockscout.ts`) — used internally
- `compact` (`lib/columns/shared/tweet-renderer.tsx`) — used internally
- `normalizeRepo`, `BacklinkSource`, `BacklinksConfig`, `NormalizedRepo` (`lib/integrations/github-backlinks.ts`) — internal
- `normalizeGitHubRepo`, `GHMode`, `GHSearchScope`, `GHPRItemMeta`, `GHWatcherItem`, `GHWatcherPage` (`lib/integrations/github.ts`) — internal
- `HNMode`, `HNSearchScope`, `HNSearchSort`, `HNSearchHitMeta` (`lib/integrations/hackernews.ts`) — internal
- `FCMode`, `FCWindow` (`lib/integrations/farcaster.ts`) — internal
- `YTMode`, `YTOrder` (`lib/integrations/youtube.ts`) — internal
- `SubstackMeta`, `ParsedHandle` (`lib/integrations/substack.ts`) — internal
- `NewsNowPlatform`, `PLATFORM_LABELS` (`lib/integrations/newsnow.ts`) — internal
- `AppReviewPlatform` (`lib/integrations/app-reviews.ts`) — internal
- `GrokTool` (`lib/integrations/xai.ts`) — internal
- `EnvKeySpec` (`lib/env-keys.ts`) — used by `ENV_KEYS` typing
- `FeedAuthor`, `ColumnCategory`, `ColumnCapabilities`, `ColumnUI`, `ColumnServer` (`lib/columns/types.ts`) — these are the documented public typing surface for the plugin contract; `defineColumnUI`/`defineColumnServer` consume them. Removing exports would weaken the documented API.
- `ColumnType<T>` (`lib/columns/types.ts`) — back-compat alias; types.ts comments say "old code imported `ColumnType`". Could be dropped if no consumers remain. Flagged but kept for now (low-risk to keep).
- `NewsNowItemMeta` (`lib/columns/plugins/_newsnow/renderer.tsx`) — leave alone for plugin-shape consistency
- `schema` exports across all 30+ plugins (`lib/columns/plugins/<id>/plugin.ts`) — consistent plugin pattern; the `meta.schema` field re-exposes them. Stylistic, leave alone.

## Unused shadcn UI re-exports — KEPT (MEDIUM)

These shadcn components export several named primitives (e.g. `Command`, `CommandShortcut`, many `Sidebar*`, several `Select*`, `Sheet*`, `Dialog*`, `DropdownMenu*`, `InputGroup*`) that are unused externally but are part of the shadcn primitive's standard surface. Several are also used *internally* by the same file (e.g. `useSidebar`, `DialogPortal`, `DialogOverlay`). Removing each one is mechanical churn that diverges from upstream shadcn templates and complicates future component additions. Recommend a separate cleanup pass if/when these primitives are confirmed not needed.

Specifically:
- `components/ui/avatar.tsx`: `AvatarGroup`, `AvatarGroupCount`, `AvatarBadge` — REMOVED (unused everywhere; not standard shadcn primitives that ship with it)
- `components/ui/dialog.tsx`: `DialogOverlay`, `DialogPortal`, `DialogTrigger` — KEPT (DialogOverlay/Portal used internally; DialogTrigger commonly part of dialog DX surface)
- `components/ui/dropdown-menu.tsx`: 9 unused subcomponents — KEPT (standard shadcn API)
- `components/ui/sidebar.tsx`: 10 unused subcomponents incl. `useSidebar` (internally used) — KEPT
- `components/ui/select.tsx`, `components/ui/sheet.tsx`, `components/ui/input-group.tsx`, `components/ui/command.tsx` — same, KEPT

---

## Other knip findings — informational

- "Unlisted dependency `server-only`": this package ships with Next.js (not in package.json directly). Safe to ignore.
- "Unlisted binaries `next`, `eslint`, `drizzle-kit`, `dotenv`, `postcss`": these come from devDependencies of installed packages or are dependencies-of-dependencies. Safe to ignore.

---

## Verification commands run

```
npx knip@latest --no-config-hints
npx ts-prune
rg <symbol> -g '*.ts' -g '*.tsx'           # for each export candidate
rg <symbol> -g '*.ts' -g '*.tsx' -g '*.md' # for files referenced from docs
```
