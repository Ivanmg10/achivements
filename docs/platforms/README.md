# Platforms

One file per platform, moved out of `CLAUDE.md` on 2026-11-07 (#124): [`ra.md`](ra.md),
[`steam.md`](steam.md), [`psn.md`](psn.md), [`xbox.md`](xbox.md). `CLAUDE.md` → Platforms keeps the
invariants that bite on any task. Sign-in and linking through Steam and RetroAchievements:
[`../accounts.md`](../accounts.md).

## How each platform fails — keep these distinct (audited 2026-10-16)

A person must be able to tell "nothing here" from "I cannot read it" from "try later".

| | Unknown account | Private / unreadable | Credential refused | Busy |
|---|---|---|---|---|
| **RA** | RA says 401 for a bad key, for any username; a game or thing RA does not know (its 404 or 422) is `404 not-found` from `raUnavailable()`, not retried | n/a (profiles are public) | `raUnavailable()` → `403 ra-key-invalid`, not retried; `RaKeyInvalidNotice` | 429 waits `Retry-After`, then 429 with `Retry-After`, not retried |
| **Steam** | link goes through Steam (no unknown account); ids that do not exist answer 400 | a private profile links; **after linking**, `{ response: {} }` → `ownedGames` answers `403 private` (not an empty library) and the list page says so | key is the app's | 429 with `Retry-After` (`steamFailure`), not retried |
| **PSN** | link: not found | `psnFailure` → 403 | NPSSO expiry, admin panel | 429 + `Retry-After: 60` |
| **Xbox** | `code: 404` in the body → `not-found` | no titles and no `achievementSummary` → `private` | app key: `503 unauthorized` | 429 |

An error that asking again will not fix must be a 4xx: the client retries 5xx
(`fetchWithRetry`, then `scheduleRetry`) and never a 4xx.
