# Spec: Xbox quota hardening (#87)

## Objective

Reduce OpenXBL consumption and contain upstream failures without opening Xbox beyond admins, hiding private profiles, returning incomplete statistics as complete, or moving quota logic into a future BFF response wrapper.

The approved capability map is:

| Module | Responsibility | Depends on |
|---|---|---|
| `upstream-guard` | Timeout, global attempt budget, 429 stop, score error classification | — |
| `cache-resilience` | Explicit stale-if-error and retry backoff for successful cached data | `upstream-guard` |
| `quota-observability` | Sanitized per-entry-point counts, latency, cache outcome and rate-limit headers | `upstream-guard` |
| `scan-budget` | Aggregate feed caching, lazy home activity, bounded Following/score work | `upstream-guard`, `cache-resilience` |

Build order: `upstream-guard` → `cache-resilience` + `quota-observability` → `scan-budget`.

## Contracts and success criteria

### Upstream guard

- Every OpenXBL fetch has a 5 second timeout. A timeout becomes `XboxError('timeout')`; API routes answer 504 `{ error: 'timeout' }` and existing UI treats it as a retryable Xbox failure.
- A 429 stops scheduling new games in the current feed. In-flight work may settle, but a rate-limited feed is not returned as a complete fresh feed.
- A short per-instance 429 cooldown uses the reset header when available, otherwise 60 seconds.
- A PostgreSQL-backed `xbox-upstream` attempt scope limits calls shared by server instances in one environment. The initial budget is 150 permitted attempts per sliding hour, matching the current Free plan; refused attempts are removed and cannot extend the lockout. The counter fails closed on database errors. OpenXBL headers remain authoritative because another environment can share the key.
- `classifyFailure('xbox', new XboxError('rate-limited', …))` returns `busy`, so score refresh stops instead of continuing through the pass.

### Cache resilience

- `withSteamCache` keeps its current API and default behavior. Stale fallback is opt-in and emits an outcome; existing Steam/PSN callers do not change.
- Xbox may serve the last successfully cached value only for `failed`, `timeout` and `rate-limited` failures. It never does so for `private`, `not-found`, `not-configured` or `unauthorized`.
- Stale data is never written back as fresh, including nested account/library/achievement reads, and transient errors are never cached as valid empty data. A 60 second per-key retry backoff prevents immediate retry storms. Shared in-flight and backoff results re-evaluate each caller's failure policy, so feed consumers cannot accept a 429 stale value allowed by a detail/score caller.
- Any response built with stale data carries `Warning: 110 - "Response is stale"` and `X-Xbox-Stale: true`. This is the machine-readable freshness contract; response JSON shapes remain backward compatible.
- Play-time and per-game achievement partial results remain marked on the initial response and later cache hits. Expired Xbox successes are retained for 30 days before the daily sweep deletes them.

### Observability

The signals answer: how many real upstream calls did this entry point make, how long did they take, which cache/failure path was used, and what quota did OpenXBL report?

- Structured logs use stable event names and contain entry point, request id, sanitized operation, outcome and duration. They never contain gamertags, XUIDs, URLs containing ids, API keys, cookies or request bodies.
- Xbox read routes expose additive `X-Request-Id`, `X-Xbox-Upstream-Calls`, `X-Xbox-Cache-Hits` and, when observed, rate-limit response headers. Browser request counts remain separate from upstream counts.
- No metrics dependency or external observability service is added.

### Scan and fan-out budget

- Assembled `recent`/`activity`/`year` responses receive versioned `xbox:feed:v2:` server cache entries. Keys include XUID, scope, window, language and the library's latest-played fingerprint so a newly played game cannot reuse the old assembled feed. Cached values carry their own partial marker.
- Existing per-entity TTLs and achievement keys remain intact. Refreshing the library changes the feed key when activity moved.
- Home derives Xbox `activity` from the raw `year` feed already loaded by the global provider. This removes the duplicate activity request in Classic and Cover while preserving every cross-platform card. Global `year` remains because the header streak must include Xbox.
- Following keeps its complete 60-day statistics but loads detailed friends one at a time instead of two, limiting simultaneous Xbox scans.
- Xbox score refresh reads at most two changed games per pass. Provisional gamerscore remains the documented settled fallback.

## Commands

- Focused tests: `npm test -- --runInBand src/lib/xboxClient.test.ts src/lib/steamCache.test.ts src/lib/scoreRefresh.test.ts`
- Full tests: `npm test -- --runInBand`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`
- Build: `npm run build`
- Local browser: `npm run dev`
- Pre baseline/manual verification: `https://dev.cheevovault.com`

## Project structure and style

- Server integration and cache: `src/lib/xboxClient.ts`, `src/lib/steamCache.ts`, `src/lib/attemptLimit.ts`.
- Request telemetry: a focused server-only module under `src/lib/` and the existing `src/app/api/xbox/` / `src/app/api/admin/xbox/` routes.
- Client triggers: `src/components/main-page/main-page-charts/`, `src/hooks/useFriendsData.ts`.
- Tests live beside the code and use Jest/testing-library conventions already present.
- TypeScript, named functions, existing kebab-case folders and concise comments only for non-obvious Xbox/cache invariants. No new dependency.

## Testing strategy

- RED first for timeout, 429 scan stop, score classification, stale/privacy behavior, stale headers, aggregate cache keys and lazy triggers.
- Unit tests prove upstream call counts separately from cache hits and browser requests.
- Route tests prove status/error/header contracts and auth/private behavior.
- Hook/component tests prove Classic does not request inactive Xbox activity while Cover still does.
- Run focused tests after every slice, then full tests, lint, typecheck and build before review.
- Use pre for warm-cache admin verification only. No cold-cache deletion or quota-burning production experiment.

## Boundaries

- Always: preserve admin-only access, per-entity versioned cache keys, private-profile behavior and independent platform failure.
- Ask first: database migrations, paid-plan budget changes, new dependencies, pushing/deploying the feature, or removing year data from the streak.
- Never: log secrets/PII, cache transient failures as valid data, silently truncate Following statistics, or weaken tests to make the feature pass.

## Non-goals

- Building the BFF or changing public DTO shapes.
- Opening Xbox to non-admins.
- A distributed lock for every concurrent cache miss.
- Removing the global year load without a replacement streak summary.

## Open measurement note

Issue #86 supplies the warm-server browser baseline. This feature adds upstream counts so before/after comparisons can distinguish browser, cache and OpenXBL work. Theoretical maxima from the static audit are not reported as measured consumption.

## Verification (2026-10-30, local)

- Full suite: 812 suites / 5,076 tests passed; production build and TypeScript passed. ESLint reported only the two pre-existing `.playwright-mcp` warnings.
- A warm local admin load rendered the Xbox profile and the cross-platform Activity cards, including Minecraft Xbox 360 unlocks.
- Server telemetry for that load recorded one real `account` call for `xbox/summary` (624 ms, 147 remaining). No activity/year upstream retry was logged. This is a warm functional check, not a cold benchmark or a before/after quota estimate.
- No shared cache was cleared and pre was not deployed. Cold-cache before/after measurements remain open.
