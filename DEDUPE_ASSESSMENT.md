# Dedupe Assessment

## HIGH confidence (implemented)

### 1. `compact()` number-formatter duplicated 10x
Identical (or nearly identical) `compact(n: number)` body in:
- `lib/columns/plugins/hacker-news/client.tsx:21-26`
- `lib/columns/plugins/youtube/client.tsx:21-28` (adds a B branch)
- `lib/columns/plugins/farcaster/client.tsx:15-20`
- `lib/columns/plugins/github-trending/client.tsx:21-26`
- `lib/columns/plugins/reddit/client.tsx:21-26`
- `lib/columns/plugins/github-issues/client.tsx:19-24`
- `lib/columns/plugins/github-prs/client.tsx:27-32`
- `lib/columns/plugins/github-search/client.tsx:30-35`
- `lib/columns/shared/tweet-renderer.tsx:19-25` (uses `K` upper-case)
- `components/sidebar-01/nav-stats.tsx:6-10` (drops `Math.abs`)

Eight of the ten are byte-for-byte identical. The other two (YouTube B-branch,
sidebar `Math.abs`) are tiny supersets of the same idea — engagement counts are
non-negative anyway. Promoting one canonical `formatCompactCount` to
`lib/utils.ts` removes ~70 lines and makes future tweaks (locale-aware
formatting, threshold) one-touch.

Decision: extract `formatCompactCount` to `lib/utils.ts` and update all call
sites. Keep YouTube's B-branch in the canonical impl (covers the worst case
without regressing the others).

### 2. `dicebear identicon` avatar URL duplicated 19x
The exact pattern
`` `https://api.dicebear.com/9.x/identicon/svg?seed=${encodeURIComponent(x)}` ``
appears in:
- `lib/integrations/github.ts` (10 occurrences)
- `lib/integrations/{newsnow,reddit,blockscout,xai,substack,youtube,telegram,hackernews,rss}.ts`

Decision: extract `identiconUrl(seed: string)` to `lib/utils.ts`. The avataaars
variants (3 occurrences in `xai`, `farcaster`, `mock/generators`) and the
keyword-icons variant (1 occurrence in xai for Grok summaries) stay inline —
they use a different style and are one-of-a-kind, not duplication.

### 3. `truncateWithEllipsis` body trimming repeated 8x
The pattern `body.length > N ? \`${body.slice(0, N).trimEnd()}…\` : body`
appears in:
- `lib/integrations/github.ts:178, 226, 295, 450, 512, 561`
- `lib/integrations/youtube.ts:132-135`
- `lib/integrations/newsnow.ts:81-84`
- `lib/integrations/rss.ts:52` (already abstracted into `clean()` locally)

Decision: extract `truncateText(s, max)` to `lib/utils.ts` and replace direct
use sites in github/youtube/newsnow. Keep `rss.ts`'s local `clean()` — it
combines truncation with HTML stripping; the truncation step now calls the
shared helper. Saves ~16 lines, behavior preserved.

## MEDIUM confidence (NOT implemented; would need broader changes)

### 4. NewsNow plugin server boilerplate is mostly identical
Six servers (`weibo-hot`, `zhihu-hot`, `douyin-hot`, `bilibili-hot`, `toutiao`,
`baidu-hot`) differ only in the platform string passed to `fetchNewsNow` and
the `Config`/`Meta` type names. ~25 lines × 6 = 150 lines that could collapse
to ~20 lines via a `defineNewsNowServer(platformKey)` factory.

Why NOT implementing: each plugin currently lives as a self-contained tuple of
`plugin.ts + client.tsx + server.ts`, mirrored in `manifest.ts`,
`registry.ts`, `server-registry.ts`. Touching the server-only file pattern
would either (a) require a different factory shape that breaks the established
plugin contract, or (b) introduce flag-based generic helpers that complicate
the contract for a one-time cleanup. The repetition is mechanical and matches
the pattern set in `_template/server.ts`. The README at `lib/columns/README.md`
likely treats this as the canonical shape; collapsing it adds indirection
without removing code from the hottest path.

Recommendation: leave for a future refactor that addresses the registry
boilerplate at the same time (manifest + registry + server-registry could be
generated from a single per-plugin descriptor).

### 5. github-stars + github-forks renderers ~95% identical
`lib/columns/plugins/github-stars/client.tsx` and
`lib/columns/plugins/github-forks/client.tsx` differ in: icon, badge color/label,
verb ("starred"/"forked"), and an extra forkUrl link block (forks only).
Server.ts files differ only in which fetcher is called.

Why NOT implementing: the `forkUrl` extension makes a unified renderer either
parameterized (icon, color, verb, optionalSecondaryLink — three flag-style
parameters) or a thin wrapper that passes a render-prop. Both options are uglier
than the current near-duplication. The two plugins are likely to evolve
independently (e.g. forks get `forkCount`, stars get `starredFromOrg`). DRY
here would be a premature abstraction.

### 6. `instagram/linkedin/facebook/google-news/bing` plugins all delegate to `LinkItem`
Already deduplicated via the `LinkItem` shared renderer. The remaining
per-plugin client.tsx files are mostly distinct ConfigForms — those have to
stay distinct because each platform's input semantics differ. No further
abstraction available.

### 7. Toast format `count > 0 ? \`${count} new item${count === 1 ? "" : "s"}\` : "No new items"`
Duplicated in `lib/store/use-deck-store.ts:210` and
`components/column/column-card.tsx:98`. Would save ~2 lines via a tiny helper.

Why NOT implementing: it's a UX string; abstracting it would require a helper
that returns toast args (description differs by call site). The savings (2
lines) don't justify a new helper; if the message ever needs i18n, the call
sites are easy to grep.

### 8. `paginate.ts` already exists; unused page-cursor pattern in github-* servers
`github-search`, `github-issues`, `github-trending`, `github-prs` all
re-implement page-cursor with the same body:

```ts
const page = cursor ? Number(cursor) || 1 : 1;
const items = await fetcher(...args, PAGE_SIZE, page);
return { items, nextCursor: items.length === PAGE_SIZE ? String(page + 1) : undefined };
```

Why NOT implementing: this is technically "page-from-1" cursor, while
`paginate.ts:pageFromCursor` defaults to 1 too. Could collapse via a helper
`fetchPaged(fetchFn, cursor)`, but the four call sites pass different argument
shapes (varargs into the per-source fetcher). A typed helper would either need
generics + tuple-spread or a closure-based fetcher signature. The line savings
are ~3 lines × 4 = 12 lines for ~10 lines of helper code + extra imports —
net wash that costs readability.

### 9. `normalizeGitHubRepo` (lib/integrations/github.ts) vs `normalizeRepo` (lib/integrations/github-backlinks.ts)
Both validate `owner/repo` and accept full GitHub URLs. They differ in:
- Return type: string vs `{ ownerRepo, canonicalUrl }`
- Error message text
- `github-backlinks` strips `.git` suffix; the other doesn't

Why NOT implementing: the two are already in different integration files with
clear ownership. Unifying would require either picking one signature
(breaking the other's call sites) or layering, neither of which is obviously
better. Keep separate.

## LOW confidence (deliberately left alone)

### 10. Repeated badge class string
`"inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium text-foreground ring-1 ring-black/5"`
appears 21 times across plugin clients.

Why NOT extracting: this is Tailwind composition. shadcn convention is
co-located classes, and extracting to a `<Badge>` component would add 1 layer
of indirection per render. The string is grep-able and the inline style is
the way the rest of the codebase reads. Plus each badge has a different
`backgroundColor` style — they're not really "the same" badge.

### 11. Repeated `font-serif text-[16px]...fontFeatureSettings` h3 style
~16 occurrences of essentially the same headline style.

Why NOT extracting: same reasoning as #10. Tailwind classes are fine to
repeat; a Headline component would force prop-drilling for color overrides,
hover variants, etc. Each plugin tweaks the hover color differently.

### 12. Plugin file structure (`plugin.ts`/`client.tsx`/`server.ts`) is repeated 30 times
Each plugin has the same file layout and similar imports.

Why NOT touching: this is the documented plugin contract (see
`lib/columns/README.md`). The "repetition" is the contract itself. Collapsing
it would require a different DSL/generator for plugins.

### 13. `[title, ...rest] = item.content.split("\n\n"); rest.join("\n\n").trim()` repeats ~10x in renderers
Splits the content blob into title/snippet.

Why NOT extracting to a util: it's a 2-line idiom, and several renderers do
slight variations (e.g. bing inlines it, others use `description` rather than
`snippet`). Extracting would be marginal at best, and it's already a stable
shape. If someone wanted to change the content encoding (`\n\n` → something
else) they'd grep and replace 10 spots; that's tractable.

### 14. `reorderColumnsInDeck` and `reorderDecks` share an UPDATE...FROM VALUES SQL pattern
Both use the same trick to bulk-update positions.

Why NOT extracting: they update different tables and `reorderColumnsInDeck`
also writes `deck_id`. A generic helper would need to take a table identifier
and column list as parameters, which is uglier than the current 7-line
duplication. SQL helpers that take dynamic identifiers are also more
error-prone (escaping, drizzle quirks). Leave alone.

### 15. `RelativeTime` usage with `addSuffix`/`compact`
~40 call sites pass either `addSuffix` or `compact` props. Already a shared
component — no further dedupe needed.

### 16. `ConfigForm` Input + Label pattern in plugin clients
~30 occurrences of `<div className="grid gap-1.5"><Label>X</Label><Input ...></div>`.

Why NOT extracting: each Input has different placeholder, helper text, and
sometimes adjacent Selects. A shared FormField component would either add
prop-drilling (helper text, error state, regex) or end up looking exactly like
shadcn's. The current shape is the shadcn-recommended composition.
