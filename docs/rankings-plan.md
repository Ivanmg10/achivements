# Rankings plan — Vault Points, levels and a rankings page

Status (2026-10-20): **built, released as a beta in 1.6.0** on `feat/social-rankings`
(together with Following, presence and the showcase). Analysis, balance tests and mockups
were shared with the user as a page (Claude artifact "Puntos Vault y rankings"); this file
keeps what was decided. Where the code differs from the first design, it says so below.

## Goal

An internal score ("Puntos Vault", PV) and levels that are worth the same on RetroAchievements,
Steam, PSN and Xbox, and a rankings page: everyone, and only the people you follow. Later the
user wants CheevoVault's own achievements; those are out of scope here (see the end).

## Why native values cannot be added up

| | Native unit | Rarity is measured over | What inflates it |
|---|---|---|---|
| RA | points chosen by the set's developer: 0–5, 10, 25, 50, 100 (no per-set cap since June 2019, 400 before) | players who loaded the game (many try and leave, so rarities run low); hardcore and softcore apart | softcore save states; games with a handful of players |
| Steam | none: every achievement is one | not documented by Valve; behaves close to *owners* (bundled games look rare) | games with hundreds/thousands of achievements (Valve caps unproven games at 100 and leaves them off profiles, but the API does not say which); unlock tools |
| PSN | grade: bronze 15, silver 30, gold 90, platinum 300 (180 before 2020) | players with the game in their trophy list | regional/console stacks; one-hour platinums |
| Xbox | gamerscore, 1000 per full game (Arcade 200, later 400) | players who started it; 360 lists from OpenXBL often have none | easy 1000 G games; repeated versions |

The same illustrative AAA game sums to 49 natively on Steam and 1,440 on PSN; a Steam game
with 5,000 achievements beats both. Rarity is the only signal all four give, and comparing it
**inside the game** (against the game's most common achievement) removes the owners-vs-players
difference.

## The formula (per earned achievement)

```
PV = 1000 × weight × rarity × gameDifficulty        (× 1.2 for the whole game at 100 %)

weight          = 0.75 × 1/n + 0.25 × native / Σnative      n = achievements in the list, DLC included
rarity          = 1 + log10(1 / rRel),  rRel = r / r(most common in the game), floored at 0.1 %   → ×1 … ×4
gameDifficulty  = 0.4 + 0.6 × min(1, log10(1 / rRel of the rarest achievement))               → ×0.4 … ×1
```

- Native: Xbox gamerscore, PSN grade (platinum weighed as a gold), RA points; Steam has none
  (both terms equal).
- Games with fewer than 5 achievements use the raw rarity (no reliable "most common").
- RA: hardcore uses hardcore rarity; softcore × 0.5 with all-player rarity; the 100 % bonus
  needs hardcore. Under 50 players, shrink: `(unlocks + 20 × median) / (players + 20)`.
- No rarity (Xbox 360, private Steam stats): rarity × 1.5, difficulty × 0.7, weight 100 % native,
  marked provisional.
- Stacks (same normalised title, same platform): 2nd copy × 0.5, 3rd on × 0.1; the best copy
  counts as the first. Not across platforms.
- Measured on illustrative data: the same game completed on the four platforms lands within
  ±5 % (1,621–1,784); a one-hour platinum, an easy 1000 G and a 5,000-achievement Steam game get
  31–38 % of a demanding game, alike on every platform. With native weight at 100 % the "story
  only" gap between platforms was 86 %; at 25 % it is 27 %.
- **Calibrate with real data before opening** (phase 2): an admin "balance" view with median PV
  per achievement and per completed game by platform; a per-platform factor (starts at 1.0)
  if one drifts beyond ±10 %. A rule change bumps `rules_version` and recomputes from the DB.

Levels: PV to reach level L = `60 × L^2.2`, no cap (500 PV → 2, 28k → 16, 126k → 32, 500k → 60,
2M → 113). Tiers: Novato 1–9, Aprendiz 10–19, Cazador 20–29, Veterano 30–44, Experto 45–59,
Maestro 60–74, Gran maestro 75–89, Leyenda 90+ (deliberately not bronze/silver/gold: those are
PSN's words).

## Decisions taken (2026-10-20, the user)

1. **No verification for now** (decided after the analysis below): linking stays by name and
   whoever links someone else's account is responsible for it. An account linked by two users
   scores for both. To be revisited with more care later.
2. **Design:** proposal A (podium + table) with B's "your level" panel on the right from `lg`,
   and C's "close rivals" list for Following when you follow few people.
3. **Names** "Puntos Vault (PV)" and the tier names stay for now; a later spike may change them
   with a logo of our own from a designer.
4. **Periods:** all-time, monthly and weekly.
5. **Hidden games and unticked consoles do not score** (they already leave the stats).
6. **Public without a session**, with users told (privacy policy, a note in Preferences, an
   opt-out `show_in_rankings`). Consequences: `/rankings` goes in the proxy's public prefixes;
   a signed-out viewer is never an admin, so no Xbox; and **no presence dots for signed-out
   viewers** (`/privacy` says only signed-in users see presence).

## Verification — analysis (kept for later; not built)

Steam, PSN and Xbox are linked by typing a name, nothing proves ownership, and on purpose they
are not unique (`migrations/028`). In a public ranking anyone could link a famous hunter's
account and top it. Options:

**Sign-in per platform (OAuth/OpenID)**
- Steam: OpenID 2.0 still works and costs no API calls. The app had it (`8c1d6f2`,
  `34d479e`) and dropped it on 2026-10-09 (`d41a3d7`) to link without signing in, like PSN, and
  to let one person keep several CheevoVault accounts.
- PSN: **no sign-in for third parties.** psn-api works with an NPSSO cookie; asking users for
  theirs is asking for their session. Not possible.
- Xbox: Microsoft's own Xbox Live sign-in is for Xbox partners. OpenXBL offers sign-in for
  apps (a XenForo add-on uses it); registration, price and whether those calls count against
  our 150/hour are unverified.
- RA: the user's key already proves the account; OAuth waits for RA's API v2.
- → Sign-in cannot be the one answer: PSN has none.

**A code in the profile's free text**
- PSN "About me" (`aboutMe` from `getProfileFromAccountId`, 1 call with the app's NPSSO),
  Steam "real name" (`realname` in GetPlayerSummaries, public profile, 1 call), Xbox bio
  (already mapped as `bio` in `xboxMappers`, 1 call of the 150/hour).
- Same flow on all three: "put CV-7K3Q in your About me, press Check, then remove it".
  Friction: editing a profile on the console/app, a few minutes of propagation; the check must
  bypass our caches.

**Rejected:** a friend request to a bot account (PSN friend-request reading, account limits),
"unlock something now" (no proof), screenshots (manual moderation).

**Recommendation:** keep linking by name (tracking needs no proof) and add verification as a
separate step: RA by key (already), **Steam with a one-click "Verify with Steam" (OpenID,
recovered from history)**, PSN with a code in About me, Xbox with a code in the bio while it is
admin-only (look at OpenXBL sign-in when Xbox opens). `account_verifications(user_id, source,
external_id, method, verified_at)` with `UNIQUE (source, external_id)`: one verified owner per
external account; whoever proves control later takes it (logged). Codes signed, not stored
(like `emailVerification`), 15 minutes, bound to user + source + account; the check route
rate-limited (`attemptLimit`). Unlinking or changing the account drops it; admin linking does
not verify. Effect: **only the global ranking requires it** (Steam/PSN/Xbox points count there
only when verified); Following counts everything and marks the unverified; the public profile
shows a tick per verified platform. Nothing else is gated, in the spirit of the soft email
verification. `/privacy` must say what is read during a check.

## As built (2026-10-20), where it differs from the design

- **RA rarity** uses everyone who loaded the game (`NumAwarded / NumDistinctPlayers`) for
  hardcore and softcore alike; softcore unlocks are worth half. Rarity is relative to the
  game's most common achievement, so the denominator cancels out anyway.
- **Unlocks are stored by day** (`[unix day, points]`), enough for weeks and months.
- **No `inputs` column:** a formula change bumps `RULES_VERSION` and games are read again
  at the refresh's pace, from caches where the platform's own cache is keyed by activity
  (PSN, Xbox). RA and Steam games are read straight from the platform.
- **No per-platform factor yet:** the admin panel's "Rankings balance" shows the medians per
  platform; add a factor only if one drifts beyond ±10 % with real data.
- **Arrows** (places moved since Monday) only on the global, all-time, every-platform view,
  and only once a Monday snapshot exists.
- **Following without a podium** below 15 people. The list shows 20 at a time; when you are not
  in it, **your zone** below it (two above and below you, widened ten at a time) replaced the
  "close rivals" panel (2026-10-20, the user's choice of three options). Each row has its last
  8 weeks as a small line (`VaultSparkline`). Under your level, the five most active this week
  (`RankingsPageHot`), with a way to the weekly ranking.
- `show_in_rankings` is **not in the session** on purpose (unlike `show_presence`): it is read
  with the rankings, so a database without migration 040 breaks only the rankings.

## The first fill (2026-10-20, after the beta)

The user wanted a new account to see itself in the rankings at once, and to be told what is
happening. Measured that day with the user's own libraries (read-only): Steam 8 at once, 29
games/s, no error; PSN 4 at once, 10 games/s, no error; RA a burst of ~7 then 429 without
Retry-After, 0 errors at one call every 250 ms, 5 of 20 at every 120 ms. Hence `PACE` (PSN kept
below what was measured: it is one account for everyone). A typical new account (190 Steam, 35
RA, 21 PSN games) is fully read in ~15 s; 500 RA games take ~3.5 min, with "≈" estimates
meanwhile. Mockups shared as a Claude artifact ("Cálculo de Puntos Vault").

Open: whether RA's limit is per key or per IP (if per IP, fills running at once share it); PSN's
real limit is unknown (the budget follows PSNAWP's self-imposed 300 calls / 15 min in spirit).

## Data and computation (summary)

- `migrations/040`: `score_games` (user, source, game; points, provisional, completed, earned,
  total, last_unlock_at, compact `inputs` jsonb — weight/rarity/period of what was earned —,
  rules_version, flag) and `score_periods` for weekly/monthly; `users.show_in_rankings`,
  `users.score_refreshed_at`.
- Refresh: list each library once, recompute only games whose last unlock changed, through the
  cached functions that already exist (RA `GetGameInfoAndUserProgress`, Steam unlocks + global
  %, `psnGameTrophies`, `xboxGameAchievements`). Unfetched games score provisionally from the
  list's progress. Triggered from the presence heartbeat with `after()` when older than 6 h,
  and by a daily cron for users seen in the last 14 days; Xbox capped per run.
- Steam unlock tools: ≥ 90 % of a game's (≥ 10) achievements in the same second → flagged, not
  counted until an admin reviews it (logged).
- Ranking = `SUM … GROUP BY` over `score_games`, cached 10 min; Xbox rows only for admins.
- Code: `src/utils/vaultScore.ts`, `src/utils/vaultLevel.ts` (pure, tested; extend the
  per-platform mappers in `gameInsights.ts`), `src/lib/scoreRefresh.ts`, `/api/rankings`,
  `/rankings` + `loading.tsx`; `FollowingRankingsTeaser` becomes its link.

## Phases

1. Engine in private: formula, levels, migration, refresh, cron; only you see your PV.
2. Calibrate with real data (balance view, per-platform factor).
3. Rankings page (Following and Global; all-time, month, week), level on profiles, cards and
   header, opt-out, `/privacy`. Minor version bump.
4. Verification and movement (weekly snapshots for the arrows, history chart). The global
   ranking waits for this.

## Later: CheevoVault's own achievements

Advice given: they should not give PV (or a small fixed amount), or the ranking rewards using
the site over playing; better as badges or avatar frames with their own showcase.
