# Implementation Plan: Xbox quota hardening (#87)

## Overview

Implement the approved spec in thin, testable slices: first stop unbounded/upstream retry behavior, then add stale and telemetry contracts, then reduce repeated scans and fan-out. Tasks are tracked in `tasks/todo.md`.

## Architecture decisions

- Keep quota enforcement in the shared OpenXBL wrapper so current routes, score jobs and the future BFF inherit it.
- Extend `withSteamCache` only through opt-in options; default Steam/PSN behavior remains unchanged.
- Use Node `AsyncLocalStorage` for request-scoped telemetry and stale response headers instead of threading counters through every loader signature.
- Cache assembled feeds in addition to per-game entities; include the library activity fingerprint in the key.
- Preserve complete Following statistics and the cross-platform streak rather than reducing their windows silently.

## Task list

1. Upstream timeout, 429 guard and global attempt budget.
2. Opt-in stale-if-error with retry backoff in the shared cache.
3. Request-scoped Xbox telemetry and read-route response headers.
4. Versioned aggregate feed cache.
5. Derive home activity from the shared year feed.
6. Following and score-refresh limits.
7. Documentation, full verification and warm-cache browser review.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Stale data looks fresh | Standard `Warning` plus explicit `X-Xbox-Stale` response contract and route tests. |
| Privacy or disabled-key errors expose old data | Allow stale only for transient failure kinds; test every excluded kind. |
| Aggregate feed misses new activity | Include latest-played fingerprint and language in a versioned key. |
| Header telemetry misses concurrent stale callers | Return cache outcome through the shared in-flight promise and apply it per caller. |
| Pre and production share the OpenXBL key but not a DB | Treat response headers as authoritative; do not claim the DB counter is cross-environment. |
| Year removal makes the streak wrong | Keep year global and optimize its assembled response instead. |

## Verification checkpoints

- After tasks 1–2: focused lib tests and typecheck.
- After tasks 3–4: focused route/lib tests and lint.
- After tasks 5–6: focused client/lib tests and typecheck.
- After task 7: full Jest, lint, typecheck, build and warm-cache pre review.
