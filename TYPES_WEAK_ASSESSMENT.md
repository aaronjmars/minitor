# Weak Types Assessment

Searched 171 .ts/.tsx files (excluding node_modules, .next, components/ui).

## Summary

The codebase is in good shape type-wise. There are no `: any` annotations,
no `Record<string, any>`, no `: Function`, no `: object`, no `@ts-ignore`,
no `@ts-expect-error`, and no `eslint-disable @typescript-eslint/no-explicit-any`.

Most `unknown` usage is legitimate (boundary input pre-validation, pagination
cursor blobs, plugin config erasure). What remains:

| Location | Current | Recommended | Source | Confidence | Action |
| --- | --- | --- | --- | --- | --- |
| `app/actions.ts:88` | `(itemResult as unknown as { rows?: ItemRow[] }).rows ?? []` (with `Array.isArray` branch) | direct `itemResult.rows` access | All three drivers (`drizzle-orm/pglite`, `drizzle-orm/neon-http`, `drizzle-orm/node-postgres`) return `{ rows: T[] }` from `db.execute()`. Confirmed in node_modules: `pglite/session.d.ts` `Results<T>`, `node-postgres/session.d.ts` `QueryResult<T>`, `neon-http/session.d.ts` `NeonHttpQueryResult<T>` — all have `.rows`. The `Array.isArray` branch is dead code. | HIGH | FIX |
| `components/column/column-card.tsx:157-158` | `["--beam-radius" as never]: "10px"` | Use `CSSProperties & Record<\`--${string}\`, string>` for the style object so CSS custom property keys are valid statically | TS lib `React.CSSProperties` doesn't include `--*` keys; canonical pattern is to widen the style type. | HIGH | FIX |
| `lib/db/client.ts:69,73` | `drizzlePglite(client, { schema }) as unknown as Db` and same for `drizzleNeonHttp` | Keep as is | Drizzle's three driver types are *structurally* compatible at the call sites we use, but TS sees them as nominally distinct because of the HKT brand. Inventing a unifying type would require duplicating Drizzle's internals. The cast is documented in the comment immediately above. | LOW | KEEP (legitimate) |
| `lib/columns/types.ts:129,136` | `return ui as unknown as AnyColumnUI` in `defineColumnUI`/`defineColumnServer` | Keep as is | `TConfig` is invariant in `ConfigForm: ComponentType<ConfigFormProps<TConfig>>` (because of `onChange: (next: TConfig) => void`). Erasing to `Record<string, unknown>` is the explicit design — the JSDoc spells it out. Trying to make this sound would require either GADTs (TS doesn't have them) or runtime tagging that adds no value. | LOW | KEEP (legitimate, documented) |
| `components/column/{add-column,configure-column}-dialog.tsx` `as never` casts on `ConfigForm`/`defaultTitle` calls | `as never` to bypass invariance of `TConfig` | Keep as is | Same root cause as above — the registry erases `TConfig`. The dialogs reconstitute the typed form by feeding the erased config back. `as never` is the standard escape hatch when you've deliberately erased a type parameter. Replacing with `as Record<string, unknown>` doesn't compile (the parameter is `TConfig`, not the erased type). | LOW | KEEP (architectural) |
| `lib/integrations/github.ts:44` `pull_request?: unknown` on `GHIssue` | Used only for `!!i.pull_request` boolean check | Keep as `unknown` | The shape is irrelevant — only existence matters. `unknown` is the strongest type that supports a boolean coercion. | LOW | KEEP (legitimate) |
| `lib/integrations/blockscout.ts:64,107,131,141` `Record<string, unknown>` for cursor blobs | Cursor is an opaque base64 of unknown JSON shape | Keep | Blockscout's `next_page_params` is intentionally schemaless (the API treats it as opaque too). The decoder only stringifies values, never inspects fields. | LOW | KEEP (legitimate) |
| `lib/integrations/telegram.ts:214`, `lib/integrations/blockscout.ts:64` `[key: string]: unknown` index signatures on `Meta` types | Allow extension fields | Keep | The `Meta` types are stored as JSONB in the DB. Permissive index signature is intentional for forward compatibility. | LOW | KEEP (legitimate) |
| `lib/integrations/app-reviews.ts` (`parsePlayReview`, `safeArrayAt`, JSON.parse → `unknown[]`) | Multiple `unknown` casts when parsing Google Play's untyped batchexecute response | Keep | This is exactly the pattern `unknown` was designed for: hostile/undocumented JSON, narrow with `typeof` / `Array.isArray` checks before use. | LOW | KEEP (legitimate) |
| `app/actions.ts:25,79,139,157` `Record<string, unknown>` for column `config`/`meta` | JSONB column, schema is per-plugin | Keep | The DB column is `jsonb` and the runtime schema lives in plugin Zod definitions. The server action is intentionally schema-agnostic — narrowing happens in the API route via `entry.meta.schema.safeParse(rawConfig)`. | LOW | KEEP (legitimate) |
| `lib/store/use-deck-store.ts:43,45`, `components/onboarding/welcome.tsx:18`, `components/column/{add,configure}-column-dialog.tsx`, `lib/columns/api-client.ts:5` `Record<string, unknown>` for column `config` | Store/dialog/API-client parameters | Keep | Same reason as above — the store is plugin-agnostic. | LOW | KEEP (legitimate) |
| `lib/integrations/xai.ts:75` `return parsed as GrokItem[]` after `JSON.parse` | LLM-generated JSON cast as `GrokItem[]` (which has all-optional fields) | Keep | `GrokItem` is fully optional; subsequent code defensively reads each field. Adding a Zod parse here for an LLM response would over-engineer "best-effort" parsing. | LOW | KEEP (legitimate) |

## HIGH-confidence changes to implement

1. `app/actions.ts:86-88` — drop `Array.isArray` branch and `as unknown as` cast; access `.rows` directly.
2. `components/column/column-card.tsx:154-159` — type the inline style as `CSSProperties & Record<\`--${string}\`, string>` (or use a named type) and drop the `as never` casts on the keys.

## What was NOT changed (and why, briefly)

- All `Record<string, unknown>` configs/meta — the architecture is genuinely
  type-erased at the registry boundary; per-plugin types live in Zod schemas.
- All driver-cast `as unknown as Db` — different Drizzle driver brand types,
  identical call surface; cast documented at the cast site.
- All JSON-parse `unknown` paths — correct usage of `unknown` at trust
  boundaries.
- Catch blocks — `err` is implicit `unknown` in modern TS, narrowed via
  `err instanceof Error` before use throughout.
