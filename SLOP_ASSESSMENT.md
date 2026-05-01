# Comment & stub assessment

## Overall

This codebase is unusually clean for an LLM-touched repo. The vast majority of comments either capture genuine "why" context (upstream API quirks, rate-limit trivia, race conditions, reasoning behind a workaround) or live in the `_template/` plugin scaffold where narrative is explicitly the point.

What I found:
- ~340 comments across 65 non-`components/ui` files. Roughly 90% are kept as-is.
- A small set of banner / section-divider comments worth removing.
- A few "narration of obvious code" comments to remove.
- One in-motion-change comment ("Backwards-compat aliases") to remove.
- One LARP-flavored block: `lib/integrations/farcaster.ts` keeps three unused paid-tier helpers + a multi-mode dispatcher behind `void fetchFarcaster`. The header comment honestly documents this. Conservative call: keep them — re-enable path is real (the Neynar paid tier exists), comments are accurate, removing forces a future re-implementer to redo upstream-discovery work. Flag, don't delete.

## Top offenders (action taken in this pass)

| # | Location | Current | Action | Why |
|---|---|---|---|---|
| 1 | `lib/integrations/github.ts:606-608` | `// ===========...\n// Stargazers + forks (used by the github-watchers plugin)\n// ===========...` | REMOVE banner box, keep one-line section header | Banner ASCII art adds nothing; one-liner is enough |
| 2 | `lib/integrations/farcaster.ts:201-204` | `// -----------...\n// PAID-TIER HELPERS — kept intentionally for re-enable.\n// All three return 402 PaymentRequired on Neynar's free tier.\n// -----------...` | REMOVE banner rules, keep prose | Banners are visual noise |
| 3 | `lib/integrations/farcaster.ts:3-23` | 21-line ASCII-banner header with "FARCASTER VIA NEYNAR" + box-drawn rules | REWRITE: drop banner rules + the "to re-enable" 4-step recipe, keep the actual factual info | The banner rules + step-by-step "restore the multi-mode dispatch" runbook is in-motion / scratchpad-flavored. Underlying tier-limit info is real and worth keeping. |
| 4 | `lib/integrations/app-reviews.ts:24` | `// ---- App Store (iTunes RSS, keyless) -----...` | KEEP (informative one-liner) | Has real info, just one line, not a banner box |
| 5 | `lib/integrations/app-reviews.ts:105-110` | `// ---- Google Play (batchexecute scrape, keyless) ---...\n// Google Play has no public reviews API...` | KEEP | The text below is genuinely non-obvious upstream info |
| 6 | `lib/integrations/app-reviews.ts:230` | `// ---- Public entry point ------------...` | REMOVE | Pure section divider, no info |
| 7 | `lib/integrations/hackernews.ts:133` | `// ---- Mentions search ----------...` | REMOVE | Pure section divider |
| 8 | `lib/integrations/xai.ts:163` | `// ---------- Public fetchers ----------` | REMOVE | Pure section divider |
| 9 | `lib/integrations/github.ts:347` | `// ---- Free-form search across scopes (used by github-search plugin) ---` | KEEP (one-liner with real info) | Not a banner box; informative |
| 10 | `app/actions.ts:248` | `// ---- env key management (Settings dialog) -----...` | REMOVE rule, keep label | One line is enough |
| 11 | `lib/columns/types.ts:139-141` | `// ---- Backwards-compat aliases (existing call sites) ---\n// Old code imported... New code should prefer the new names.` | REWRITE | In-motion; "old code / new code" is rotted. Aliases are still used in 3 files; just say so plainly. |
| 12 | `lib/integrations/github.ts:650` | `// ignore` | REMOVE | Narrates that an empty catch ignores |
| 13 | `app/actions.ts:193` | `// Gather existing ids to count "new" arrivals` | KEEP | Borderline; explains intent of the lookup which isn't obvious |
| 14 | `app/actions.ts:233` | `// Cap history per column` | KEEP | Borderline; explains intent of the SQL DELETE |
| 15 | `components/relative-time.tsx:65` | `// Subscribe so we re-render once per second.` | REMOVE | Narrates `useSyncExternalStore(subscribe, ...)` — obvious |
| 16 | `lib/integrations/substack.ts:43` | `// Full URL or bare host: extract the subdomain before .substack.com.` | KEEP | Useful — describes branch intent |
| 17 | `lib/integrations/substack.ts:48` | `// Plain handle. Allow alphanumerics and hyphens; reject anything else.` | KEEP | Same |
| 18 | `lib/integrations/substack.ts:178` | `// Prefix with publication to avoid id collisions across feeds.` | KEEP | Genuine why |
| 19 | `lib/integrations/github-backlinks.ts:93/100/107/123` | One-line per-source labels | KEEP | Each is a useful breadcrumb in a fan-out function |
| 20 | `next.config.ts:4-5` | "PGlite ships a WASM binary..." | KEEP | Genuine reason for `serverExternalPackages` entries |
| 21 | `drizzle.config.ts:5-7` | "drizzle-kit's `generate` doesn't need credentials..." | KEEP | Genuine why |
| 22 | `lib/db/client.ts:11-19` | Multi-line driver-selection table | KEEP | Top-of-file map is valuable; non-obvious behavior |
| 23 | `lib/db/client.ts:51` | `// fall through to postgres branch — let the driver surface a real error` | KEEP | Genuine why |
| 24 | `lib/db/client.ts:61-62` | "We declare `db` as the NodePg shape because..." | KEEP | Genuine why; explains a deliberate type choice |
| 25 | `lib/columns/server-registry.ts:75-77` | "Parity check..." | KEEP, but slightly redundant with file header | Mildly chatty but not slop |
| 26 | `lib/columns/server-registry.ts:95-96` | "Verify each registered server's id matches its key (catches typos like `redit` → reddit)..." | KEEP | Genuine why with concrete example |
| 27 | `lib/columns/registry.ts:46-48` | "Keyed by id rather than positional — 'use client' boundary..." | KEEP | Genuine why |
| 28 | `lib/columns/registry.ts:82` | `// Pre-built ordered list, indexed by manifest order. Built once at module init.` | KEEP | Useful one-liner |
| 29 | `components/column/column-card.tsx:50-52` | `// undefined = unknown ... // string = ready ... // null = exhausted` | KEEP | Genuine state-encoding key |
| 30 | `components/column/column-card.tsx:96` | `// Reset pagination cursor on a fresh refresh.` | KEEP | Borderline but explains intent of the next line |
| 31 | `components/column/column-card.tsx:114-117` | "First load after a cold open..." | KEEP | Genuine why for the two-stage logic |
| 32 | `components/column/column-card.tsx:156` | `// consumed by the beam-frame CSS` | KEEP | Useful — CSS custom property usage isn't obvious |
| 33 | `components/sidebar-01/nav-stats.tsx:12-13` | "Re-render every minute so 'Updated' stays fresh — useSyncExternalStore keeps `Date.now()` out of render bodies (React's purity rule)." | KEEP | Genuine why w/ reference to React rule |
| 34 | `hooks/use-min-duration.ts:12-14` | "React's blessed pattern for deriving state from props..." | KEEP | Genuine why |
| 35 | `lib/integrations/farcaster.ts:294` | `// Suppress "declared but never read" — these are intentionally kept for re-enable.\nvoid fetchFarcaster;` | KEEP | The comment IS the warning that makes the larp explicit. Removing the comment without removing the larp would be worse. |
| 36 | `lib/integrations/farcaster.ts:263` | `// Multi-mode dispatcher — wire this back up in route.ts when the plan is upgraded.` | KEEP | Same — pin the dead code with explicit context |
| 37 | All `_template/*` narrative comments | Long pedagogy comments in plugin scaffold | KEEP | Template is documentation by design |

## Stubs / LARP / overengineered

- `lib/integrations/farcaster.ts`: `fetchTrending`, `fetchChannel`, `fetchSearch`, `fetchFarcaster` — three of these are unused; `fetchFarcaster` is suppressed via `void`. They are real, working calls into the Neynar paid tier. Keeping per author intent (commented as such).
- `defineColumnUI` / `defineColumnServer`: looked like potential larp ("factory pattern producing one type") but used at 126 call sites and provides a non-trivial typing seam (`as unknown as AnyColumnUI`). Real abstraction.
- The `_template` plugin folder is scaffolding-by-design, not larp — it's intentionally not registered, makes adding a plugin fast.
- No empty stub functions, no "TODO: implement" placeholders, no abandoned interfaces with single implementations that aren't actually used, no over-abstracted factory patterns.

## Summary of changes applied

- 4 banner-box comments removed (`farcaster.ts`, `github.ts`, multi-rule dividers).
- 1 `// ignore` deletion.
- 1 obvious-narration comment removal (`relative-time.tsx:65`).
- 1 in-motion comment rewritten (`types.ts` "Backwards-compat aliases").
- 4 single-line section dividers without info content removed (`hackernews.ts`, `xai.ts`, `app-reviews.ts:230`, `actions.ts:248`).
- The `farcaster.ts` 21-line header trimmed: kept the factual upstream context (free vs paid tiers, demo-key trick, hub-fallback ruling), dropped the in-motion runbook ("To re-enable: 1. ... 2. ... 3. ...") and the ASCII rules.

Net result: ~25 lines of comment removed, no behavior changes, build still green.
