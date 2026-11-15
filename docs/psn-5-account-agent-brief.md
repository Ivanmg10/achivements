# PSN 5-account rollout — agent brief

**Status:** ready to implement
**Audience:** the next coding agent
**Operator:** Ivan
**Date:** 23 October 2026

**Read first:**
1. `docs/psn-implementation-brief.md` — phase-by-phase contract for verification, pool, queue, snapshots and UX.
2. `docs/psn-account-operations.md` — account lifecycle, refresh, Telegram, 20-account analysis.
3. `docs/psn-multi-account-pool.md` — pool schema, routing, capacity, admin.
4. `docs/psn-scaling-and-rate-limits.md` — capacity math and no-live-Sony rules.
5. `CLAUDE.md` — project invariants, PSN section, performance rules.

This file binds the general plan to the **actual rollout: 5 PSN service accounts**.

---

## 1. The 5 accounts

The operator has:

- **3 existing personal PSN accounts** that can be used as service accounts.
- **2 additional accounts** that will be obtained separately.
- **1 daily-use main account that must NOT be used** as a service account. Do not ask for it, do not link it, do not store it.

Use labels only:

| Label | Source | Role | Weight | Concurrency |
|---|---|---|---:|---:|
| `PSN-1` | existing personal #1 | active | 2 | 2 |
| `PSN-2` | existing personal #2 | active | 2 | 2 |
| `PSN-3` | existing personal #3 | active | 2 | 2 |
| `PSN-4` | new dedicated | active / warm reserve | 1 | 2 |
| `PSN-5` | new dedicated | active / warm reserve | 1 | 2 |

Rules:

- **The agent must not create PSN accounts, sign in to Sony, or ask for passwords/NPSSO in chat.**
- The operator adds each account through the admin UI; the agent builds the UI/API.
- Do not hardcode online IDs, NPSSO or emails in the repository.
- Add accounts **one at a time**, 1–2 days apart, and test each with a canary.
- If all 5 expire on the same date, fix it: re-login one every ~12 days so renewals are staggered.
- Keep all 5 active with weights; a fully cold “reserve” wastes 20 % capacity. `PSN-4`/`PSN-5` can have lower weight and act as warm failover.
- Do not use the daily main account, even temporarily.

---

## 2. Capacity of 5 accounts

Assumptions: 40 calls/min per account, 70 % utilisation, 28 calls/min effective per account.

| Metric | Value |
|---|---:|
| Nominal rate | 5 × 40 = 200/min |
| Effective rate | 5 × 28 = 140/min |
| Calls/day | ~201,600 |
| Concurrent calls | 5 × 2 = 10 |
| NPSSO renewals | ~5 per 60 days = one every ~12 days if staggered |

Practical planning:

- Comfortable: **~1,000 PSN links/day + ~5,000 active users/day** with core + recent, history queued.
- At 50 % PSN link rate, that is **~2,000 signups/day**.
- If every new user needs full history of 100 games, drop to **~400 links/day** with 5,000 active.
- If libraries are heavy (300 recent games), drop to **~150 links/day**.
- Profile views do not consume NPSSO; only sync does.

Do not add `PSN-4`/`PSN-5` to fix slow page reads. The first fix is snapshots, not more accounts.

---

## 3. Non-negotiable decisions

1. **PSN counts in Vault Points.** Do not remove it.
2. **100 % = all trophies, DLC included**, and gets the +20 % completion bonus.
3. **Platinum is a separate milestone.** Do not call a platinum “100 %” if DLC is pending.
4. **Verification is a trust layer, not a tax.** Unverified PSN still links and scores. The badge says verified/unverified. Ranking gating is `PSN_RANK_REQUIRES_VERIFICATION`, **default false**, and only after a product decision.
5. **No Sony call in a user-facing read.** Profiles, libraries, bootstrap, status and public pages read DB/snapshots.
6. **Persist first, then pool.** Do not add `PSN-4`/`PSN-5` before the queue/snapshot path exists.
7. **No jargon in UI:** no “NPSSO”, “429”, “rate limit”, “pool”, “token”, “job”.
8. **No secrets in Telegram, logs, URLs or client responses.**
9. **All user-facing copy goes through `T` in all 9 translations.**

---

## 4. Phase plan

### Phase 0 — Baseline (½–1 day)

- Instrument PSN calls by function: `summary`, `titles`, `played`, `sets`, `gameTrophies`, `gameGroups`, `recent`, `history`, `score`.
- Measure one cold profile with 500 and 1,000 games, and one refresh after 15 min.
- Check whether 429 is per account or per IP: load one account while another is idle.
- Record results in `docs/worklog.md`.

**Done when:** a baseline table exists and the cold-profile call count is known.

---

### Phase 1 — PSN verification (About Me) — first PR

**Goal:** prove a PSN account is the user’s with a code in “About Me”; keep PSN counting while unverified.

#### Migration

Use the next free migration number (suggested `043_psn_verification.sql`):

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verified_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verification_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS psn_verification_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS users_psn_verification_code
  ON users (psn_verification_code)
  WHERE psn_verification_code IS NOT NULL;
```

#### Library

`src/lib/psnVerification.ts`:

- `PSN_VERIFICATION_TTL_MS = 24h`.
- `makePsnVerificationCode()` → `CV-` + 8 chars from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I).
- `normalizePsnVerification(value)` → uppercase, strip non `[A-Z0-9]`.
- `aboutMeHasCode(aboutMe, code)`.
- Unit tests: format, case/spacing/wrapping, false positives, empty.

`src/lib/psnClient.ts`:

```ts
export async function psnAboutMe(accountId: string): Promise<string> {
  const auth = await authorization()
  const profile = await psnCall(() => getProfileFromAccountId(auth, accountId))
  return profile.aboutMe ?? ''
}
```

#### API `src/app/api/psn/verify/route.ts`

`GET`:

- `requirePsnSession()`.
- If verified → `{ verified: true, code: null, expiresAt: null }`.
- If code exists and is valid → return it.
- Else generate, store with `NOW() + 24h`, return.
- `Cache-Control: no-store`.

`POST`:

- `requirePsnSession()`.
- Rate limit `psn-verify` (6 / 15 min per user) in `src/lib/attemptLimit.ts`.
- If verified → `{ verified: true }`.
- No code/expired → 409 `{ error: 'no-code' }`.
- `psnAboutMe(accountId)`; if `aboutMeHasCode` → `UPDATE users SET psn_verified_at = NOW(), psn_verification_code = NULL, psn_verification_expires_at = NULL`; `forgetUser`; `{ verified: true }`.
- Not found → 422 `{ error: 'not-found' }`.
- Sony errors through `psnFailure`.

`DELETE`:

- Clear verification fields; `forgetUser`; `{ verified: false }`.

#### Session/public plumbing

- `src/lib/userRecord.ts`: add `psn_verified_at` to `UserRecord` and `COLUMNS`.
- `src/types/next-auth.d.ts`: add `psnVerified?: boolean`.
- `src/lib/authOptions.ts`: `tokenFields` → `psnVerified: Boolean(row.psn_verified_at)`; session callback copies it.
- `src/app/api/psn/link/route.ts` and `src/app/api/psn/unlink/route.ts`: clear all three verification fields on link/unlink.
- `src/app/api/admin/users/accounts/route.ts`: clear verification on admin PSN link/unlink.
- `src/lib/publicUser.ts`: `psnVerified` in `PublicUserRow`/`PublicProfileRow`; select `(psn_verified_at IS NOT NULL)`.
- `src/app/api/users/[username]/route.ts`: return `psnVerified`.
- `src/hooks/useCheevoUser.ts`: add `psnVerified?: boolean`.
- `PublicUserPlatformChips`: small verified check on the PSN chip, with text/aria-label.

#### UI

`src/hooks/usePsnVerification.ts`:

- GET status on mount when linked.
- POST check; on success `useSession().update()`.
- DELETE reset.
- State: `verified`, `code`, `expiresAt`, `loading`, `checking`, `error`, `copied`.
- Errors: `no-code`, `not-found`, `private`, `not-configured`, `rate-limited`, `failed`.

`src/components/user-page/user-psn-card/psn-verification/PsnVerification.tsx`:

- Code box, Copy, link to `https://profile.playstation.com/{onlineId}`.
- “I pasted it, check”.
- “Later” collapses; small “Verify” remains.
- Verified badge.
- `aria-live="polite"`.

Add `notice?: ReactNode` to `UserPlatformCard`, render after identity. Pass the verification panel from `UserPsnCard`.

Translations under `psn.verification` in all 9 files (English base in `docs/psn-implementation-brief.md` §5.7).

#### Tests

- `src/lib/psnVerification.test.ts`.
- `src/app/api/psn/verify/route.test.ts`: 401, no PSN, already verified, GET creates code/expiry, POST no code 409, not found 422, success updates + forgets, 429, private 403, DELETE.
- `src/lib/psnClient.test.ts`: `psnAboutMe`.
- Component test for `PsnVerification`.

**Done when:** link → code → check → verified; unverified PSN still shows data and scores; no secrets leak.

---

### Phase 2 — Fast core and budget (single account first)

**Goal:** a new profile costs ~5 Sony calls, not ~300; no page waits on Sony.

- `psnTitlesCore`: only `getUserTitles` (limit 800). No played/sets/IGDB.
- `psnTitlesEnriched`: old path as background for top 20 recent.
- `psn-call` budget for **every** PSN call (600/15 min or token bucket).
- `PsnBusyError`; routes 202/429; workers requeue with jitter.
- `readStale` up to 7 days; negative cache `psn:private` 10 min, `psn:notfound` 1h.
- `pg_try_advisory_lock` per account for `psnTitles`/`psnSummary`.
- Manual refresh 1/10–15 min; “last synced/next sync”.
- Do not load `recentTrophies?scope=year` on first render; use `recent` 3 games.
- Split caches: `psn:defs:${npwr}:${lang}` global; `psn:earned:${accountId}:${npwr}:${lastTrophyAt}` per user; groups likewise.

**Done when:** cold profile ≤10 calls; stale data never blocks; 429 does not blank the page.

---

### Phase 3 — Pool with PSN-1..PSN-3, refresh and Telegram

**Goal:** build and prove the pool with the first three accounts, with per-account refresh and alerts. **Do not add `PSN-4`/`PSN-5` until Phase 4 (snapshots/queue) is live**; otherwise extra capacity hides a live-call architecture.

#### Schema

Use `docs/psn-multi-account-pool.md`:

- `psn_service_accounts`
- `psn_account_leases`
- `psn_account_budget`
- `psn_account_stats`
- `psn_sync_jobs` (shared with Phase 4)
- `psn_alert_state` (Telegram dedupe)

Migration from `psn_credentials`:

- Copy row 1 to `PSN-1`; keep the legacy row as fallback for one release.
- Re-seal secrets with a dedicated `PSN_SECRET_KEY` and versioned purpose; do not depend on `NEXTAUTH_SECRET`.
- Do not delete the old row until the pool works.

#### Pool

- `src/lib/psn/accounts.ts`: `PsnAccountPool`.
- Any account can read any public profile; no user affinity.
- Per-account token bucket, leases, health, cooldown, weight.
- `withPsnAccount`: retry 429/5xx on another account (max 2); 401 quarantines and retries another; 403 private does not retry.
- Per-account refresh:
  - Access token: refresh at ~50 min, `SELECT ... FOR UPDATE` on the account row.
  - Refresh token: refresh at ~7 days; if it fails, exchange NPSSO.
  - NPSSO: expires at 60 days; quarantine and alert; manual renew.
  - Process in batches of 2–3 with jitter; never all 5 at once.

#### Admin

- `GET /api/admin/psn/accounts` (no secrets)
- `POST /api/admin/psn/accounts` `{ label, npsso, weight?, concurrency?, ratePerMin? }`
- `PATCH /api/admin/psn/accounts/[id]` `{ status?, weight?, concurrency?, ratePerMin? }`
- `POST /api/admin/psn/accounts/[id]/test`
- `POST /api/admin/psn/accounts/[id]/rotate` `{ npsso }`
- `DELETE /api/admin/psn/accounts/[id]`
- `GET /api/admin/psn/pool`
- UI: `src/components/admin-panel/admin-psn-accounts/` table + add/rotate/test/drain modals.
- Audit every action with `logAdminAction`.

#### Telegram

Env:

```env
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_ADMIN_IDS=
```

- `src/lib/telegram.ts`: `sendTelegram(text)` with HTML escaping; no secrets.
- `src/app/api/cron/psn-alerts/route.ts`: 15-min urgent check + 09:00 digest; dedupe via `psn_alert_state`.
- Alerts: NPSSO 14/7/3/1 days (per account), refresh failed/quarantine, 429 high, <2 active, queue p95 >15 min, sync failures >5%.
- Optional `src/app/api/telegram/webhook/route.ts`: `/status`, `/accounts`, `/queue`, `/admin`; verify secret; only admin chat IDs; **never accept NPSSO**.
- If Telegram is not configured, fall back to the existing email.

#### 5-account operations

- Add `PSN-1..PSN-3` first and test; add `PSN-4`/`PSN-5` only after Phase 4 is live, 1–2 days apart.
- Labels only; no hardcoded IDs.
- Stagger expiry: one renewal every ~12 days.
- Warm reserve: `PSN-4`/`PSN-5` weight 1; all can take jobs.
- Canary each account to its own profile every 30 min.
- Do not use the daily main account.

**Done when (with PSN-1..PSN-3):** accounts can be added/tested/drained/rotated; one account 429/401 does not affect users; Telegram sends expiry and pool-down alerts; no secret leaves the server.

---

### Phase 4 — Snapshots, queue, bootstrap, delta sync

**Goal:** reads come from Postgres; sync is a fair background job.

- Tables: `psn_players`, `psn_player_games`, `psn_player_trophies`, `psn_games`, `psn_trophies`, `psn_sync_jobs`.
- Worker `/api/cron/psn-worker` every minute; `maxDuration=60`; `CRON_SECRET`.
- Phases: `summary`, `titles`, `recent`, `history`, `score`.
- Priorities: link/verify 0, manual 1, first sync 2, cron 3, history 4, score 5.
- Chunk history 20 games/job; requeue at the end.
- `GET /api/psn/bootstrap`: summary + first 50 games + recent + sync state; 202 if no snapshot.
- `GET /api/psn/status`; `POST /api/psn/refresh` (202/409/429).
- `GET /api/psn/games?page=&limit=50&q=&sort=`; `GET /api/psn/game/[npwr]`.
- Delta sync: only changed `lastTrophyAt`/new games; `getUserPlayedGames` only when needed.
- Score from `psn_player_trophies`; no Sony.
- Public pages: `s-maxage=60, stale-while-revalidate=300`; private `Vary: Cookie`.
- Images through proxy/CDN; DTOs light.

**Done when:** no PSN read route calls Sony; cold profile from DB; 100 simulated links no 5xx; score parity fixture passes.

After this phase, add `PSN-4` and `PSN-5` through the same admin flow, one at a time, 1–2 days apart. Their acceptance is the full **5-account pool**: 5 labels, staggered expiry, canary green, failover tested.

---

### Phase 5 — UX, metrics, load test

- State machine: `not_linked`, `linked_unverified`, `syncing_core`, `ready_partial`, `enriching`, `ready`, `stale`, `error`.
- Copy from `docs/psn-multi-account-pool.md` §9; all 9 languages; no jargon.
- Progress with real `aria-valuenow`; `aria-live`; reduced motion; mobile sheet.
- Cooldown with countdown; “last synced/next sync”; toast when done.
- Admin pool dashboard and runbook.
- Metrics: calls/min by function/account, 429 %, 401/403, p95, queue depth/lag, cache hit, token days.
- Alerts: 429 >1% 5 min; queue p95 >15 min; account <7 days; <2 active; bootstrap p95 >1s.
- Load test 10/100/1,000 links with a fake Sony adapter; chaos: 429, 401, 5xx, token expired, worker dead.
- Feature flags: `PSN_MODE=live|queue|stale`; `PSN_RANK_REQUIRES_VERIFICATION=false`; `PSN_POOL_ENABLED`.

**Done when:** 1,000 simulated links no 5xx; core p95 <60s; one account down invisible; all down serves stale; all copy translated/accessible.

---

## 5. Ranking policy

- PSN counts **always** in Vault Points.
- 100 % (all trophies, DLC included) gets +20 %.
- Platinum is a separate badge/club, not a 100 % substitute.
- Verification is a badge; do **not** exclude unverified PSN from scoring by default.
- If `PSN_RANK_REQUIRES_VERIFICATION=true`, add a 30-day grace and manual admin verification. Apply in `src/lib/rankings.ts` (`LINKED_ACCOUNT`/audience) and `vaultTotals`, with tests. Do not enable without product sign-off.

---

## 6. Tests and commands

- `npm test`
- `npm run lint`
- `npm run build`
- Fake Sony adapter for load/chaos; never hit Sony in tests.
- E2E: link → verify → core ready → enriched → refresh cooldown → private → retry.
- Pool: 5 accounts, one 429, one 401, all 429, token expiry, rotate/drain.
- Score parity: old live path vs snapshot path on a fixture.

---

## 7. Definition of done

- 5 accounts in the pool; add/test/rotate/drain works.
- Verification works end-to-end; unverified PSN still counts.
- No PSN read route calls Sony when a snapshot/stale exists.
- Cold profile ≤10 Sony calls.
- Refresh per account works; 5 NPSSO renewals are staggered and alerted.
- Telegram alerts and `/status` work; no secrets in messages.
- Snapshots/queue/bootstrap/status/refresh live; delta sync and score-from-DB.
- 9 translations complete; no jargon; accessibility checks.
- Metrics/alerts/runbook documented.
- `docs/worklog.md` and `CLAUDE.md` updated.

---

## 8. Do not

- Do not create PSN accounts or automate Sony login.
- Do not use the operator’s daily main PSN account.
- Do not store NPSSO in the repo, env for 5 accounts, or Telegram.
- Do not send tokens/secrets in messages or logs.
- Do not gate PSN scoring by verification by default.
- Do not remove PSN from Vault Points.
- Do not call Sony in page reads.
- Do not add `PSN-4`/`PSN-5` before queue/snapshots.
- Do not create fake accounts or bypass Sony protections.
- Do not copy Exophase/YourGamerProfile data.

---

## 9. Open decisions (do not block Phase 1)

1. Ranking gate: default false; enable later with grace/manual verification.
2. Platinum: separate badge/club; keep +20 % for 100 %.
3. 5 accounts: all active with weights; no cold reserve.
4. Telegram: alerts first; commands optional.
5. Public PSN pages/SEO: separate growth phase.

---

## 10. Operator checklist (human, before/while the agent works)

- [ ] Confirm the 3 existing accounts are not the daily main.
- [ ] Prepare 2 dedicated accounts with their own email, no purchases.
- [ ] Set PSN gaming history to public.
- [ ] Add `PSN-1..PSN-3` first; add `PSN-4`/`PSN-5` after Phase 4 (snapshots/queue), one at a time.
- [ ] Test canary; record expiry dates.
- [ ] Stagger renewals (~every 12 days).
- [ ] Create Telegram bot with BotFather; set token/chat/secret.
- [ ] Review Sony ToS and ban risk; keep a reserve plan.
- [ ] Do not paste NPSSO into Telegram or chat.
