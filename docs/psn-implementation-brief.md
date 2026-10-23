# PSN implementation brief — next agent

**Status:** ready to implement
**Date:** 23 October 2026
**Concrete rollout:** `docs/psn-5-account-agent-brief.md` — 5 service accounts (3 existing personal, 2 new; the daily main account is excluded). It starts the pool with 3 accounts, lands snapshots/queue, then adds the other 2, so capacity never hides a live-call architecture.
**Read first, in this order:**
1. `docs/psn-scaling-and-rate-limits.md` — capacity, queue, budgets, Exophase/YourGamerProfile/PSNProfiles.
2. `docs/psn-multi-account-pool.md` — multi-NPSSO pool, routing, UX, admin.
3. `docs/exophase-psn-analysis.md` — competitive context and the EXP model.
4. `CLAUDE.md` — project invariants, PSN section, performance rules.

This brief is the **implementation contract**. The other documents explain why; this one says what to build, in what order, and how to know it is done.

---

## 1. Context

CheevoVault currently:

- Links PSN by online ID only (`src/app/api/psn/link/route.ts`). Nothing proves the account belongs to the user.
- Uses **one** NPSSO (`psn_credentials`, id = 1) and reads Sony on demand.
- Has caches: `psn:summary` 15 min, `psn:titles` 15 min, `psn:trophies` 30 days keyed by `lastTrophyAt`, `psn:sets` 90 days.
- Has no persistent PSN player/game/trophy snapshot.
- Has a global budget only for score reads (`psn-score`, 300 games / 15 min); profile reads are not budgeted.
- Serves several PSN routes in parallel on the main page (`summary`, `titles`, `recentTrophies?scope=recent`, `recentTrophies?scope=year`).
- Is auth-gated except public SEO pages, `/rankings` and the landing.
- Scores PSN with `psnPlan` + `psnScoreInputs`; all trophies (DLC included) count, and `scoreGame` gives +20 % only when the whole set is earned.

The goal is to make PSN **trustworthy, fast, resilient and pleasant**, without breaking existing features or making Sony the runtime dependency.

---

## 2. Decisions already made (do not re-litigate)

1. **PSN counts in Vault Points.** Do not remove PSN from scoring. A PSN game at 100 % (all trophies, DLC included) counts as completed and gets the +20 % bonus.
2. **Platinum is a separate milestone.** A platinum without DLC is not 100 %. Do not change the score formula to call it 100 % in this work. Add a badge/filter later if product asks.
3. **Verification is a trust layer, not a tax.** The user can link and see PSN data unverified. Verification proves ownership via the PSN “About Me” code. It is shown as a badge. Do **not** exclude unverified PSN from Vault Points by default. Ranking gating is a separate feature flag and product decision (see §9).
4. **No Sony call in a user-facing read.** Profile, library, bootstrap, status and public pages must read snapshots/DB. Sony is called by workers only.
5. **Persist first, then pool.** Adding NPSSO accounts without a queue/snapshot layer only delays the 429.
6. **Progressive onboarding.** Core data first (summary + titles), then recent/playtime, then history, then score.
7. **No jargon in UI.** Never show “NPSSO”, “429”, “rate limit”, “pool”, “token” or “job”.
8. **Use accounts the operator owns.** No fake accounts, no automated Sony login, no bypass of Sony’s protections. Treat NPSSO as a live session secret.

---

## 3. Non-negotiable invariants

- Every new DB column/table is additive and has an `IF NOT EXISTS` migration.
- No secret (NPSSO, tokens) is returned to the client or written to logs.
- `psnaccountid` stays deliberately non-unique (a squatter must not lock the owner out). Verification, not uniqueness, is the anti-impersonation tool.
- Existing RA, Steam and Xbox behavior must not change.
- All user-facing copy goes through `T` and all 9 translation files (`en`, `es`, `de`, `fr`, `it`, `ja`, `pl`, `pt`, `ru`).
- Every new route validates its input and returns a real status code and a stable `{ error }` code.
- Reads are cached/served from DB; writes are explicit.
- Follow the project style: comments explain *why*, tests next to the code, no new dependencies without need.

---

## 4. Phase 0 — Baseline (½–1 day)

**Goal:** know what the current code costs before changing it.

- Add lightweight server logs/ counters for each PSN function: `summary`, `titles`, `played`, `sets`, `gameTrophies`, `gameGroups`, `recent`, `history`, `score`.
- Record: calls, 429, 401/403, latency, cache hit/miss.
- Measure one cold profile with 500 and 1,000 games, and one refresh after 15 min.
- Check whether 429 is **per account** or **per IP**: one account under load while another is idle.
- Write the numbers in `docs/worklog.md`.

**Acceptance:** a baseline table exists and a cold profile’s call count is known.

---

## 5. Phase 1 — PSN verification (About Me) — highest priority

**Goal:** let a user prove the PSN account is theirs, with a code in the PSN profile’s “About Me”. Unverified links keep working and keep counting; the badge is the trust signal.

### 5.1 Migration `043_psn_verification.sql`

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verification_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verification_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_psn_verification_code
  ON users (psn_verification_code)
  WHERE psn_verification_code IS NOT NULL;
```

### 5.2 Library

Add `src/lib/psnVerification.ts`:

- `PSN_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000`.
- `makePsnVerificationCode()` → `CV-` + 8 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I). Use `crypto.randomBytes`.
- `normalizePsnVerification(value)` → uppercase, strip everything not `A-Z0-9`.
- `aboutMeHasCode(aboutMe, code)` → normalized includes.
- Unit tests: format, case/spacing/wrapping, false positives, empty.

Add to `src/lib/psnClient.ts`:

```ts
export async function psnAboutMe(accountId: string): Promise<string> {
  const auth = await authorization()
  const profile = await psnCall(() => getProfileFromAccountId(auth, accountId))
  return profile.aboutMe ?? ''
}
```

- It reuses the existing auth/cache/error path. Do not add a second PSN client.
- If Sony says private, let `psnFailure` map it.

### 5.3 API `src/app/api/psn/verify/route.ts`

`GET`:

- `requirePsnSession()`; 401/400 as today.
- If `psn_verified_at` → `{ verified: true, code: null, expiresAt: null }`.
- If a code exists and is not expired → return it.
- Else generate a code, store it with `NOW() + 24 hours`, return it.
- `Cache-Control: no-store`.

`POST`:

- `requirePsnSession()`.
- Rate limit: add `psn-verify` to `src/lib/attemptLimit.ts` (6 / 15 min per user id).
- If already verified → `{ verified: true }`.
- If no code or expired → 409 `{ error: 'no-code' }`.
- Call `psnAboutMe(accountId)`.
- If `aboutMeHasCode` → `UPDATE users SET psn_verified_at = NOW(), psn_verification_code = NULL, psn_verification_expires_at = NULL WHERE id = $1`; `forgetUser(userId)`; return `{ verified: true }`.
- If not found → 422 `{ error: 'not-found' }`.
- Sony errors via `psnFailure` (403 private, 429 rate-limited, 502 failed, 503 not-configured).

`DELETE`:

- `requirePsnSession()`.
- Clear `psn_verified_at`, code and expiry; `forgetUser`; return `{ verified: false }`.

**Do not** put the code in a URL, log it, or send it anywhere except the authenticated client.

### 5.4 Auth/session/user plumbing

- `src/lib/userRecord.ts`: add `psn_verified_at` to `UserRecord` and `COLUMNS`.
- `src/types/next-auth.d.ts`: add `psnVerified?: boolean` with a comment.
- `src/lib/authOptions.ts`: `tokenFields` adds `psnVerified: Boolean(row.psn_verified_at)`; `session` callback copies it.
- `src/app/api/psn/link/route.ts`: clear all three verification fields on every new link (a new account must be reverified); return `psnVerified: false`.
- `src/app/api/psn/unlink/route.ts`: clear the three fields too.
- `src/app/api/admin/users/accounts/route.ts`: when an admin links PSN, clear verification as well. When unlinking, clear.

### 5.5 Public user

- `src/lib/publicUser.ts`: `PublicUserRow` adds `psnVerified: boolean`; select `(psn_verified_at IS NOT NULL) AS "psnVerified"` in both `findPublicUser` and `findSubject`.
- `src/app/api/users/[username]/route.ts`: return `psnVerified: user.psnVerified`.
- `src/hooks/useCheevoUser.ts`: add `psnVerified?: boolean`.
- `src/components/public-user-page/public-user-platform-chips/PublicUserPlatformChips.tsx`: show a small verified check on the PSN chip when `user.psnVerified`. Use text/aria-label too, not only colour.

### 5.6 UI: verification card

Add `src/hooks/usePsnVerification.ts`:

- `GET /api/psn/verify` on mount when PSN is linked.
- `check()` → `POST`; on success call `useSession().update()`.
- `reset()` → `DELETE`.
- State: `verified`, `code`, `expiresAt`, `loading`, `checking`, `error`, `copied`.
- Error type: `'no-code' | 'not-found' | 'private' | 'not-configured' | 'rate-limited' | 'failed'`.

Add `src/components/user-page/user-psn-card/psn-verification/PsnVerification.tsx`:

- Props: `onlineId: string`, `onVerified?: () => void`.
- If verified: a small badge with `T.psn.verification.verified`.
- If unverified:
  - Title/body (`T.psn.verification.*`).
  - Code in a monospace box, a Copy button (clipboard, fallback), and a link to `https://profile.playstation.com/{onlineId}`.
  - “I pasted it, check” button; disabled while checking.
  - “Later” collapses the panel; a small “Verify” button remains.
  - Error messages mapped from `error`.
  - `aria-live="polite"` for success/error.
- Keep it usable on mobile without a modal.

Add a `notice?: ReactNode` prop to `src/components/user-page/user-platform-card/UserPlatformCard.tsx` and render it after `identity` (or after `status`). Pass `<PsnVerification ... />` from `UserPsnCard` when linked.

`src/components/user-page/user-psn-card/UserPsnCard.tsx`:

- Show `verified` / `unverified` badge next to the online ID.
- Render the verification notice before stats.
- On successful verification, call `useSession().update()` so the badge updates.

### 5.7 Translations

Add under `psn.verification` in all 9 files. English base:

```ts
verification: {
  title: 'Verify your PSN account',
  body: 'Copy this code into the About Me section of your PSN profile. It proves the account is yours.',
  codeLabel: 'Your verification code',
  copy: 'Copy code',
  copied: 'Copied',
  openProfile: 'Open PSN profile',
  check: 'I pasted it, check',
  checking: 'Checking…',
  verified: 'Verified',
  unverified: 'Not verified',
  verify: 'Verify',
  later: 'Later',
  success: 'PSN account verified',
  notFound: 'We could not find the code in About Me. Save it there, wait a moment, and try again.',
  noCode: 'Generate a new code to verify your account.',
  why: 'Why verify?',
  whyBody: 'It proves the PSN account is yours, so nobody can use it to enter the rankings.',
  reset: 'Verify again',
  resetDone: 'Verification removed',
}
```

Translate naturally; do not leave English in non-English files.

### 5.8 Tests

- `src/lib/psnVerification.test.ts`.
- `src/app/api/psn/verify/route.test.ts`: 401, no PSN, already verified, GET generates code/expiry, POST no code 409, POST not found 422, POST success updates + forgets user, POST rate-limited 429, Sony private 403, DELETE clears.
- `src/lib/psnClient.test.ts`: `psnAboutMe` returns `aboutMe` and uses `getProfileFromAccountId`.
- `src/components/user-page/user-psn-card/PsnVerification.test.tsx`: unverified shows code and check; success shows verified; error copy; copy button.
- Update tests that assert `UserRecord`/session fields if they do exact object matches.

### 5.9 Acceptance

- A user can link PSN and immediately get a code.
- The code can be pasted into PSN About Me and checked.
- Success shows “Verified” in the account card and public profile.
- Unverified users still see all PSN data and still score.
- No NPSSO/secret in logs or responses.
- Existing PSN tests pass.

---

## 6. Phase 2 — Stop the bleed (single account)

**Goal:** a new profile costs ~5 Sony calls, not ~300; a page never waits on Sony.

### 6.1 `psnTitlesCore`

In `src/lib/psnClient.ts` (or `src/lib/psn/*`):

- `psnTitlesCore(accountId, userId)`: only `getUserTitles` pages (limit 800). No `getUserPlayedGames`, no `trophySetsOf`, no IGDB.
- `psnTitlesEnriched(accountId, userId, { recentOnly: 20 })`: the old `playedGames` + `trophySetsOf` + `withPlayData` + IGDB path, as a background job.
- Keep `psnTitles` as a compatibility wrapper for consumers that need everything, but the main page must use `psnTitlesCore`.

### 6.2 Global budget for every PSN call

- Add `psn-call` to `attemptLimit` (600 / 15 min, address `app`) **or** a token bucket (`psn_budget`).
- Wrap every `psnCall` through `psnCallBudgeted`; not just score.
- If no budget: throw a typed `PsnBusyError`; routes return 202/429 with `Retry-After`; workers requeue with jitter.

### 6.3 Stale + negative cache + single-flight

- `readStale(key, staleMs)`: serve an expired entry up to 7 days; queue a refresh.
- `psn:private:${accountId}` 10 min; `psn:notfound:${onlineId}` 1 h.
- `pg_try_advisory_lock(hashtext('psn:'+accountId))` for `psnTitles`/`psnSummary`; if not acquired, return stale/202.
- `psnSummary`, `psnTitles`, `psnRecentTrophies` must **never** block a page on Sony when stale data exists.

### 6.4 UI cooldown and status

- Manual refresh: 1 / 10–15 min per user.
- “Last synced” and “Next sync” visible.
- “Refresh now” enqueues; returns 202; toasts when done.
- Do not load `recentTrophies?scope=year` on the first render; use `recent` (3 games) and show “calculating history”.

### 6.5 Cache split

- `psn:defs:${npwr}:${lang}` global, 90 days.
- `psn:earned:${accountId}:${npwr}:${lastTrophyAt}` per user, 30 days.
- `psn:groups-defs`, `psn:groups-earned` likewise.
- Stop caching definitions + earned together per account.

### 6.6 Acceptance

- Cold profile with 500 games: **≤ 10 Sony calls** to show the library.
- No profile request > 500 ms waiting on Sony when a snapshot/stale exists.
- 429 does not blank the page.
- Existing PSN UI still works.

---

## 7. Phase 3 — NPSSO pool

**Goal:** use the operator’s multiple PSN accounts safely, with health, failover and admin control.

### 7.1 Schema

Use the SQL in `docs/psn-multi-account-pool.md`:

- `psn_service_accounts`
- `psn_account_leases`
- `psn_account_budget`
- `psn_account_stats`
- `psn_sync_jobs` (shared with Phase 4)

### 7.2 Migration from the single account

- Create `psn_service_accounts`.
- Copy `psn_credentials` row 1 into account `PSN-1` (decrypt with the old purpose, re-seal with the new dedicated purpose/key).
- Keep `psn_credentials` as a read-only fallback for one release; remove later.
- Do not delete the old row until the pool works and is verified.

### 7.3 Pool/router

- `src/lib/psn/accounts.ts`: `PsnAccountPool`.
- `acquire({ priority, userId })`: pick `status='active'`, `cooldown_until <= now()`, free slot, tokens, order by health/weight/last used.
- Per-account token bucket and leases; no in-memory-only concurrency.
- `withPsnAccount(fn)`: retry 429/5xx on another account (max 2); 401 quarantines the account and retries another; 403 private does **not** retry; all reads are idempotent.
- `reportSuccess/RateLimit/AuthError/ServerError` update health.
- No user affinity: any account can read any public profile.

### 7.4 Token/NPSSO lifecycle

- Per-account encrypted NPSSO/tokens.
- Refresh access token before expiry; `SELECT … FOR UPDATE` on the account row to avoid concurrent refreshes.
- 401 → quarantine; 429 → cooldown with exponential backoff + jitter; 5xx → short cooldown.
- Cron warns per account at 7/3/1 days; stagger renewals.
- Keep one reserve account; drain before rotate; never delete before the new one is validated.

### 7.5 Admin API/UI

- `GET /api/admin/psn/accounts` → labels, status, online ID, days left, calls/min, 429 %, p95, in-flight; never secrets.
- `POST /api/admin/psn/accounts` `{ label, npsso, weight?, concurrency?, ratePerMin? }` → validate, exchange tokens, canary, store.
- `PATCH` → pause/resume/drain/weight/concurrency.
- `POST /api/admin/psn/accounts/[id]/test` → canary.
- `POST /api/admin/psn/accounts/[id]/rotate` `{ npsso }`.
- `DELETE` → drain/remove; delete secrets.
- `GET /api/admin/psn/pool` → active/cooling/reserve, capacity, queue, 429.
- UI in `src/components/admin-panel/admin-psn-accounts/` following the existing admin panel style (English, second password already in place).
- Audit every action with `logAdminAction`.

### 7.6 Acceptance

- 2 accounts can be added; one can be paused/drained/rotated without user-visible errors.
- A 429 on one account routes to the other.
- A 401 quarantines only that account.
- No secret leaves the server.
- Capacity per account is enforced by DB, not memory.

---

## 8. Phase 4 — Snapshots, queue, bootstrap and delta sync

**Goal:** PSN reads come from Postgres; sync is a background, phased, fair job.

### 8.1 Schema

Use `docs/psn-scaling-and-rate-limits.md`:

- `psn_players`
- `psn_player_games`
- `psn_player_trophies`
- `psn_games`
- `psn_trophies`
- `psn_sync_jobs`

Notes:

- `psn_games` one row per `NPWR`.
- Definitions are global; progress is per user.
- `psn_player_trophies` stores only earned trophies, with `grade`, `earned_at`, `rarity`, `exp`; FK to `psn_trophies`.
- Write definitions before player trophies.
- Index `(user_id, earned_at DESC)`, `(user_id, last_played_at DESC)`, `(user_id, last_trophy_at DESC)`.

### 8.2 Worker

- `/api/cron/psn-worker` every minute; `maxDuration` 60; `CRON_SECRET`.
- Reclaim `running` jobs with `locked_until < NOW()`.
- Claim with `FOR UPDATE SKIP LOCKED`.
- Phases: `summary`, `titles`, `recent`, `history`, `score`.
- Priorities: link/verify 0, manual 1, first sync 2, cron 3, history 4, score 5.
- Chunk history (20 games/job) and requeue at the end for fairness.
- Use `psnCallBudgeted` per call; if no token, requeue with jitter.
- Do not run `history`/`score` when the pool is saturated; keep core.

### 8.3 APIs

`GET /api/psn/bootstrap?user=...` — one call for the first paint:

```json
{
  "user": { "onlineId": "...", "avatar": "...", "verified": true, "level": 512, "tier": 8 },
  "summary": { "games": 1240, "platinum": 98, "trophies": 18420, "playtimeMinutes": 207000 },
  "games": { "items": [ ...50... ], "total": 1240, "hasMore": true },
  "recentTrophies": [ ...6... ],
  "rarest": [ ...5... ],
  "sync": {
    "state": "ready_partial",
    "lastSyncedAt": "...",
    "nextSyncAt": "...",
    "phases": { "summary": "done", "titles": "done", "recent": "running", "history": "queued" },
    "progress": 0.42,
    "etaSeconds": 180,
    "canRefresh": false,
    "refreshAvailableAt": "..."
  }
}
```

- If no snapshot: 202 with `state: "syncing"` and minimal user info; never a blank page.
- `GET /api/psn/status` — same `sync` object only; cheap.
- `POST /api/psn/refresh` — 202 + job; 409 if syncing; 429 if cooldown.
- `GET /api/psn/games?page=1&limit=50&q=&sort=...` — server-side pagination/search/sort.
- `GET /api/psn/game/[npwr]` — game + trophies + groups + sync state in one response.

All read routes use snapshots. No `psnTitles`/`psnSummary` on the page path.

### 8.4 Delta sync

- `getUserTitles` is the change source: compare `lastUpdatedDateTime` and counts.
- Only fetch `psnGameTrophies` for games whose `lastTrophyAt` changed or that are new.
- Fetch `getUserPlayedGames` only for playtime changes/new games; keep it out of the core.
- History only for changed/new games.
- Score from `psn_player_trophies`; no Sony calls.

### 8.5 Serving and caches

- L1 memory LRU for definitions/summaries; L2 Postgres.
- Public profile/game pages: `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` and `revalidateTag` on sync.
- Private APIs: `private, max-age=...`, `Vary: Cookie`.
- DTOs light; no duplicated `meta`; images through a proxy/CDN.

### 8.6 Acceptance

- Profile opens from DB with no Sony call (verify with logs).
- New link: core data visible p95 < 60 s.
- Manual refresh: 202, then status flips to ready; no page reload needed.
- 100 simulated links do not produce 5xx; queue/ETA works.
- `psn_player_trophies` produces the same Vault Points as the old live path (compare on a fixture).

---

## 9. Phase 5 — UX, observability, rollout

### 9.1 UX states

Implement exactly the state machine from `docs/psn-multi-account-pool.md` §9:

- `not_linked`, `linked_unverified`, `syncing_core`, `ready_partial`, `enriching`, `ready`, `stale`, `error`.
- Copy keys (English base; translate all 9):
  - `syncing_core`: “We are reading your trophies. This usually takes a few seconds.”
  - `ready_partial`: “Your trophies are here. We are adding playtime and history in the background.”
  - `queued`: “Your update is queued (position 2). It may take a few minutes.”
  - `stale`: “Showing data from 8 h ago. Updating in the background.”
  - `cooldown`: “You can update again in 8 min.”
  - `private`: “Your PSN gaming history is private. Set it to Public in Settings → Privacy → Gaming History.”
  - `psn_down`: “PSN is not responding. Your saved data is still here; we will retry automatically.”
  - `unverified`: “Not verified: you will not appear in rankings until you verify.”
  - `verified`: “Account verified.”
- No jargon. No raw error codes.
- `aria-live="polite"`; progress bars with real `aria-valuenow`; reduced motion; keyboard focus.
- Mobile: status in a bottom sheet/chip, not a blocking modal.

### 9.2 Admin dashboard

Pool summary, account cards, add/test/pause/drain/rotate/remove, mode `live|queue|stale`, alerts (expiry, 429, <2 active, queue lag).

### 9.3 Feature flags

- `PSN_MODE` (`live|queue|stale`) — default `live`; `stale` makes no Sony calls.
- `PSN_RANK_REQUIRES_VERIFICATION` — **default false**. PSN counts regardless. Flip only after a product decision + 30-day grace + manual verification path. If enabled, apply in `src/lib/rankings.ts` (`LINKED_ACCOUNT`/audience) and `vaultTotals`, with tests.
- `PSN_POOL_ENABLED` — allows falling back to the legacy single account during rollout.

### 9.4 Observability

- Calls/min by function/account, 429 %, 401/403, p95, queue depth/lag, cache hit, token days left.
- Alerts: 429 > 1 % 5 min; queue p95 > 15 min; account < 7 days; < 2 active accounts; bootstrap p95 > 1 s.
- Runbook in `docs/psn-multi-account-pool.md` §14.

### 9.5 Rollout

1. Verification to 100 % (independent, low risk).
2. Fast core + budget + stale/negative/single-flight behind a flag; canary 5 %.
3. Pool with 2 accounts; canary; then enable for all.
4. Snapshots/queue/bootstrap; dual-read compare; then make DB the only read path.
5. Add accounts 3–5 only if metrics demand it.

### 9.6 Acceptance

- 10/100/1,000 simulated links: no 5xx; core p95 < 60 s; queue ETA honest.
- One account down: no user-visible error.
- All accounts down: stale data + banner.
- Token expired: quarantine + alert; pool continues.
- All copy translated; axe/Lighthouse clean.

---

## 10. Test/commands

- `npm test` (Jest).
- Targeted: `npm test -- src/lib/psnVerification.test.ts` etc.
- `npm run lint`.
- `npm run build`.
- Existing tests must stay green. If a test asserts exact SQL/objects, update it deliberately, not by weakening the assertion.
- Add a fake Sony adapter for load/chaos; never hit Sony in tests.
- E2E: link → verification code → check → verified; link → unverified data still visible; refresh cooldown; private profile; all accounts down.

---

## 11. Definition of done

- Verification works end-to-end; unverified PSN still counts.
- No PSN read route calls Sony when a snapshot/stale exists.
- Cold profile ≤ 10 Sony calls to show the library.
- Pool supports 2+ accounts, health, cooldown, failover, rotation, admin UI.
- Snapshot tables + queue + bootstrap/status/refresh are live.
- Delta sync and score-from-DB work; score parity fixture passes.
- 9 translations complete; no jargon; accessibility checks pass.
- Metrics/alerts documented; runbook updated.
- `docs/worklog.md` has an entry with what changed, what was measured and what is open.
- `CLAUDE.md` PSN section updated with the new invariants (verification, pool, no live reads, budgets).

---

## 12. Out of scope for this brief

- Public profiles/SEO/gamercards (separate growth work; the docs describe them).
- A full forum or social features.
- Xbox changes.
- Premium/payment for faster sync (can reuse the cooldown model later).
- Copying Exophase data/API.
- Creating fake PSN accounts or automating Sony login.

---

## 13. Open product questions (do not block Phase 1)

1. When `PSN_RANK_REQUIRES_VERIFICATION` is enabled, should there be a 30-day grace? Default: yes, with manual admin verification.
2. Should platinum get a separate leaderboard/club? Default: yes, a badge/club; keep Vault Points 100 %-based.
3. How many service accounts at launch? Default: 2 (one primary + one reserve), add 3–5 only if metrics demand.
4. Should public PSN-ID pages be indexable? Default: only verified accounts, canonical to `/u/[username]`; unverified `noindex`.
5. Should the pool be visible on a status page? Default: no account details; only “PSN operational/degraded”.

---

## 14. Quick summary of the existing analysis

- **Exophase:** persists everything, scans in background (4–6 h + manual), verifies PSN via About Me, public SSR game/profile pages, EXP formula `3300/rarity` capped 480, platinum vs 100 % clubs.
- **YourGamerProfile:** user-triggered sync with cooldown 2 h free / 1 h Premium / 30 min Premium Plus, daily scheduled sync, background jobs + notifications, admin reset.
- **PSNProfiles/TrueTrophies:** batch + quotas (6 h/daily/weekly; 3 manual/24 h). Nobody live-syncs per visit.
- **CheevoVault:** better analytics, privacy, scoring and UX; missing persistence, verification, public surfaces and pool.
- **The order:** verify → fast core/budget → pool → snapshots/queue → UX/metrics. Do not add accounts before removing live reads.
