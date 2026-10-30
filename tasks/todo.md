# Xbox quota hardening tasks

## Task 1: Bound upstream work

- [x] Add failing tests for 5s timeout/504, 429 cooldown and scan stop, DB-backed upstream budget, and Xbox score 429 classification.
- [x] Implement the minimum changes in `xboxClient`, `attemptLimit`, `scoreRefresh` and their tests.
- Acceptance: no new feed games start after 429; score stops as busy; timeout is a structured retryable error.
- Verify: `npm test -- --runInBand src/lib/xboxClient.test.ts src/lib/scoreRefresh.test.ts src/lib/attemptLimit.test.ts`.

## Task 2: Add explicit stale resilience

- [x] Add failing cache tests for expired success fallback, per-caller stale outcome, retry backoff and excluded error kinds.
- [x] Implement opt-in stale fallback without changing default cache behavior.
- Acceptance: transient failures can use stale success; private/not-found/disabled-key failures cannot; stale is never rewritten fresh.
- Verify: `npm test -- --runInBand src/lib/steamCache.test.ts src/lib/xboxClient.test.ts`.

## Task 3: Instrument Xbox entry points

- [x] Add failing telemetry and route tests for sanitized structured events, request ids, upstream/cache counts and stale/rate-limit headers.
- [x] Add request-scoped telemetry and wrap Xbox read routes in small batches.
- Acceptance: warm and cold route executions report distinct browser/upstream/cache outcomes without ids or secrets.
- Verify: focused telemetry, Xbox route and client tests; `npx tsc --noEmit`.

## Task 4: Cache assembled feeds

- [x] Add failing tests for versioned aggregate keys, latest-played invalidation, language/scope isolation and stale fallback.
- [x] Implement aggregate recent/activity/year caching while preserving entity caches.
- Acceptance: an unchanged warm feed does not repeat per-game scans; moved library activity selects a new key.
- Verify: `npm test -- --runInBand src/lib/xboxClient.test.ts src/app/api/xbox/recentAchievements/route.test.ts`.

## Task 5: Derive home activity from the shared year

- [x] Add failing tests proving MainPageCharts filters the raw Xbox year to 60 days and does not request a second activity feed.
- [x] Expose the raw Xbox year through the existing context/hooks and derive activity in MainPageCharts.
- Acceptance: Classic and Cover keep every cross-platform card; no duplicate activity request or loss of old/new unlock behavior.
- Verify: focused MainPageCharts, year-context and Xbox hook tests.

## Task 6: Bound Following and score fan-out

- [x] Add failing tests for one detailed friend at a time and two Xbox score games per pass.
- [x] Apply the limits without reducing Following's 60-day window.
- Acceptance: statistics remain complete; concurrency and per-pass maxima match the new bounds.
- Verify: focused friends and score-refresh tests.

## Task 7: Document and verify

- [x] Update Xbox/cache/architecture docs, spec measurement notes and worklog.
- [x] Run full tests, lint, typecheck and build.
- [x] Review the warm-cache admin flows in pre/local without deleting shared cache.
- Acceptance: no temporary instrumentation, secrets or unrelated changes; all quality gates and spec criteria are evidenced.

## Checkpoint: ready for review

- [x] `npm test -- --runInBand`
- [x] `npm run lint`
- [x] `npx tsc --noEmit`
- [x] `npm run build`
- [x] Warm Xbox/Activity browser flow and upstream log checked; cold before/after measurement remains open.
