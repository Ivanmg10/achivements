# Audit v1.7: performance, security and API limits

Report-only audit for [#90](https://github.com/Ivanmg10/achivements/issues/90). Sections are completed
independently and appended here. Nothing in this file changes application code.

| Section | Status | Base commit |
|---|---|---|
| Security | **Complete** (2026-10-30) | `c250f4bc21c96e6d6034a49cfa6b2a97ebcbb0e3` (`develop`, after #92) |
| Performance | **Complete** for this base (2026-10-30); post-BFF comparison pending | same |
| API limits | **Complete** for this base (2026-10-30); post-BFF comparison pending | same |

**Reading this later.** Findings describe that commit. Work that landed after it, including #88 (hidden
games in lists, in progress when this was written), was not reviewed. Check `git diff c250f4bc..HEAD` on
the named files before acting on a finding.

**Disclosure.** This repository is public and these findings were unfixed when written. Per #90's process
rules, this file gives the class of each problem, its surface, impact, verification status and fix
direction. Step-by-step reproductions and one sensitive hypothesis (H-01) are kept with the maintainer,
outside GitHub. Add them here once the matching fix has shipped.

---

# Security

## Summary

Threat model: a public app with per-user accounts, platform linking, an image proxy, an admin panel and
rate-limited auth. Assets, most valuable first: account control, users' RetroAchievements keys, the app's
platform credentials (PSN NPSSO, Steam and OpenXBL keys), email addresses, private-profile data, and
platform quota and hosting budget.

The foundations hold. Across 119 anonymous calls to every route handler, the only one that answered with
data was the public rankings. Authorization between accounts, the admin locks, cron authentication, SQL
parameterization and server-only handling of RA keys all held under test. The weak area is what happens
**around** the sign-in flows, and how little limits the size and rate of accepted input.

| ID | Severity | Status | Finding |
|---|---|---|---|
| H-01 | Unrated; Critical if it proves true | Hypothesis | Steam sign-in response handling (detail withheld) |
| [SEC-01](#sec-01) | High | Confirmed | A session can add a Steam sign-in that survives a password change and cannot be removed |
| [SEC-02](#sec-02) | Medium | Confirmed, exploit precondition unverified | Image proxy serves active content on the site's origin |
| [SEC-03](#sec-03) | Medium | Confirmed | Password attempt limits do not hold under concurrent requests |
| [SEC-04](#sec-04) | Medium | Confirmed | Private profiles still expose public groups and uploaded avatars |
| [SEC-05](#sec-05) | Medium | Confirmed | A viewer with no RA key can spend another user's key at volume |
| [SEC-06](#sec-06) | Medium | Confirmed | Unbounded user-supplied writes |
| [SEC-07](#sec-07) | Medium | Confirmed | RA keys are stored in plain text and copied to pre-production |
| [SEC-08](#sec-08) | Medium | Confirmed gap | Admin access is one factor, used twice |
| [SEC-09](#sec-09) | Medium | Confirmed | Anonymous endpoints have no budget |
| [SEC-10](#sec-10) | Low | Confirmed | `next` is behind security releases; dependency alerting is off |
| [SEC-11](#sec-11) | Low | Confirmed | CSP allows inline script; no COOP |
| [SEC-12](#sec-12) | Low | Confirmed | CSRF protection rests on `SameSite` alone |
| [SEC-13](#sec-13) | Low | Confirmed | Markup reaches the "email changed" notice |
| [SEC-14](#sec-14) | Low | Confirmed | Reset tokens survive an email or password change |
| [SEC-15](#sec-15) | Low | Confirmed | Steam cookies survive sign-out |
| [SEC-16](#sec-16) | Low | Confirmed | Xbox rows reach non-admin viewers |
| [SEC-17](#sec-17) | Low | Confirmed | Sign-up reveals which addresses are registered |
| [SEC-18](#sec-18) | Low | Confirmed | 30-day sessions, no per-session revocation, RA key in the token |
| [SEC-19](#sec-19) | Low | Confirmed | Malformed input answers 500 |
| [SEC-20](#sec-20) | Low | Confirmed | Some admin reads and failed unlocks are not logged |
| [SEC-21](#sec-21) | Low | Confirmed by code | Cached personal data outlives unlink and deletion |

Severity follows #90's scale. Status separates what was observed from what was inferred:

- **Confirmed**: observed in the local test environment, or unambiguous from the code where noted.
- **Hypothesis**: depends on something that could not be tested within the rules (see
  [Hypotheses](#hypotheses)).

## Method

- Read all 91 route handlers, the auth, session, admin and rate-limit libraries, the proxy, the Next
  config, the email templates, the validators, the migrations and the two CI workflows.
- Built commit `c250f4bc` for production and ran it locally against a throwaway PostgreSQL database with
  all 41 migrations applied. The repo has no migration for the base `users` table, so it was reconstructed
  from the code.
- The environment had no `.env` file, throwaway secrets and fake test accounts. Every outbound `fetch` was
  answered by a local stub that blocked all other traffic, so **nothing reached production, the preview
  environment, real users or a third party**.
- One browser check, on `localhost`. Bursts were capped at 30 local requests.
- Dependency triage used `npm audit`, each advisory's text and a check of whether this app uses the
  affected feature.

## Findings

### SEC-01

**A session can add a Steam sign-in that survives a password change and cannot be removed. High, confirmed.**

- **Surface:** `src/app/api/auth/steam/callback/route.ts:37-41`, `src/app/api/steam/unlink/route.ts:14`,
  `src/app/api/admin/users/accounts/route.ts:162`.
- **Evidence:** on a test account, linking Steam required no password and set both `steamid` and
  `steam_login_id`. Unlinking cleared only `steamid`. After unlink **and** a password change, signing in
  with that Steam account still produced a session for the user. No user or admin action in the app clears
  `steam_login_id`, and no email is sent when it is set.
- **Impact:** email and password changes and account deletion all require the current password, because
  "a stolen session must not be able to keep the account". Linking is the gap in that rule. A session
  stolen once, an unattended browser or any future script injection (see SEC-02) can become lasting access
  that a password reset does not end. The victim sees no warning and cannot remove it, and "Unlink" looks
  as if it did.
- **Reproduction:** with one fake account and a stubbed Steam: link, unlink, change the password, sign in
  through the Steam flow, read the session.
- **Proposal:**
  1. Ask for the current password before a link starts (`checkCurrentPassword`, then a short-lived signed
     intent consumed by the callback). Steam-only accounts prove themselves through their existing Steam
     sign-in or set a password first.
  2. Make user and admin unlink clear `steam_login_id`, once the account has another way in.
  3. Mail the account's address on link and unlink, like `sendEmailChangedNotice`.
  4. Update CLAUDE.md, which records today's behaviour as intended.

### SEC-02

**Image proxy serves active content on the site's origin. Medium, confirmed; exploit precondition unverified.**

- **Surface:** `src/app/api/image-proxy/route.ts:37`, with `next.config.ts:21`.
- **Evidence:** the route accepts any `image/*` type. With a stubbed allow-listed upstream, an SVG was
  returned as `image/svg+xml`, and a real browser opening the URL ran its script on the site's origin under
  the site's real CSP. `src/lib/avatarImage.ts` leaves SVG out of uploads for this exact reason. Non-allowed
  hosts, plain http, metadata addresses, host-suffix tricks and same-site paths were all refused.
- **Impact:** script on the site's origin can act as whoever opens the link: the session cookie stays
  `HttpOnly`, but same-origin API calls carry it. Exploitation needs an attacker-controlled SVG on one of
  the allow-listed hosts. **Whether that is possible was not tested**, because it would mean probing third
  parties. It would be High if such a host exists.
- **Proposal:** accept raster types only, ideally verified from the bytes by reusing `sniffImageType`. The
  only consumer is a canvas reading colours. Keep `X-Content-Type-Options: nosniff`.

### SEC-03

**Password attempt limits do not hold under concurrent requests. Medium, confirmed.**

- **Surface:** `src/lib/authOptions.ts:68-76`, `src/lib/currentPassword.ts:14-20`, `src/lib/attemptLimit.ts:69`.
- **Evidence:** the check and the count are separate steps. A local burst of 30 parallel wrong passwords
  against a limit of 10 had **all 30 evaluated**. Sequential attempts are limited correctly. The current
  password check, which also guards the admin unlock, has the same shape by code.
- **Impact:** guesses per window scale with concurrency rather than the configured limit, and each attempt
  that gets through costs a bcrypt hash.
- **Proposal:** count before checking, as `allowAttempt` already does for sign-up, and remove the attempt on
  success. Group IPv6 addresses by /64 in `clientAddress` (see H-04).

### SEC-04

**Private profiles still expose public groups and uploaded avatars. Medium, confirmed.**

- **Surface:** `src/app/api/groups/[id]/route.ts:14-35`, `src/app/api/avatar/[file]/route.ts:19-26`.
- **Evidence:**
  - A group marked public on a **private** profile was readable with no session. The response included its
    title, its games and progress, and the owner's internal user id.
  - Any signed-in account could fetch a private profile's uploaded avatar, including with a guessed version.
  - Both identifiers are sequential.
  - Other private-profile reads were correctly refused (`?user=` reads answer 401, the profile 404).
- **Impact:** `/privacy` tells people they can make their profile private, and the app's rule is that a
  private profile is for its owner only. These two paths break that rule, and sequential ids make them
  walkable.
- **Proposal:** in the group read, require a session and `profile_public` or ownership, and drop `user_id`
  from the response. In the avatar read, apply the same visibility rule and match the full version.

### SEC-05

**A viewer with no RA key can spend another user's key at volume. Medium, confirmed.**

- **Surface:** `src/lib/apiAuth.ts:49`, `src/app/api/getGamesLastPlayed/route.ts:10-13`.
- **Evidence:** one request from a test account with no RA link produced 100 upstream calls, all signed with
  another test user's key. Nothing limits repeats beyond the cache. The key itself never reached the
  response or the browser. CLAUDE.md already records the fallback as an open question for RA; this finding
  adds that it is an amplifier.
- **Impact:** a free account can push a real user's key into RA's rate limit, or draw RA's attention to it.
  Their own pages then fail. RA's position was "each user with their own key".
- **Proposal:** while the question is open, apply a per-viewer limit and a much smaller id cap when the key
  is not the viewer's. Prefer serving cached data in that case. Ask RA, as the roadmap already says.

### SEC-06

**Unbounded user-supplied writes. Medium, confirmed.**

- **Surface:** `src/app/api/updateUserProfile/route.ts:86`, `src/app/api/favorites/route.ts:63-98`,
  `src/app/api/updateFavoriteGame/route.ts:41`, `src/app/api/pinnedGames/route.ts:102-137`,
  `src/app/api/perfectGamesOrder/route.ts`, `src/app/api/hiddenGames/route.ts:53`.
- **Evidence:**
  - A 1 MB avatar link, a 1 MB pin snapshot and a 200 KB favourite title were all accepted and stored.
  - The avatar and favourites are copied into the session token. With the 1 MB avatar, sign-in failed with
    a response-header overflow, locking the account out. An 8 KB avatar already made the cookie about 12 KB
    across three chunks.
  - Pins and hidden games have no row cap.
  - The two order routes run one statement per entry inside a transaction, with no length cap: 2,000 entries
    (58 KB) took 349 ms locally, and with a network between the app and the database that time grows.
    `favorites` PUT and `groups/[id]/games` PUT already show the fix.
- **Impact:** a free account can grow database storage without limit, hold a connection from a pool of five,
  and ship oversized values to everyone who loads a list showing that user (rankings, followers, profile).
- **Proposal:** add length limits (the 500-character cap used elsewhere for image links; 300 for titles; a
  few KB for snapshots), per-user row caps and `order` length caps. Use one `unnest` statement as the group
  route does. Add database `CHECK`s. Stop copying `avatar` and favourites into the token.

### SEC-07

**RA keys are stored in plain text and copied to pre-production. Medium, confirmed.**

- **Surface:** `users.raid`, `src/lib/userRecord.ts:14`, `src/lib/authOptions.ts:25`, `src/lib/secretBox.ts`.
- **Evidence:** `raid` is written and read as plain text, while the PSN credentials are sealed with
  `secretBox`. CLAUDE.md states that the pre-production database is a copy of production data. The contents
  of that database were not inspected.
- **Impact:** read access to any copy of the database (a leaked `PREVIEW_DATABASE_URL`, a backup, a preview
  deployment) yields every user's personal RA key in usable form.
- **Proposal:** seal `raid` with `secretBox` and keep a keyed hash for its uniqueness check. Scrub keys and
  addresses from the preview branch each time it is reset from production.

### SEC-08

**Admin access is one factor, used twice. Medium, confirmed gap.**

- **Surface:** `src/lib/adminAuth.ts`, `src/app/api/admin/unlock/route.ts`.
- **Evidence:** the two locks are sound. Under test, the role was read fresh, the unlock cookie was required,
  and wrong, forged and non-admin attempts were all refused. But both locks rest on the same password,
  minimum 8 characters, with no second factor and no breach check.
- **Impact:** one phished or reused admin password opens every user's email, account edits and replacement
  of the app's PSN credential.
- **Proposal:** a TOTP or passkey step at unlock, a longer minimum for admins, and a mail to the admin on
  each unlock.

### SEC-09

**Anonymous endpoints have no budget. Medium, confirmed.**

- **Surface:** `src/app/api/image-proxy/route.ts:32-38`, `src/app/api/steam/icon/route.ts:22`,
  `src/app/api/rankings/route.ts`, `src/app/api/auth/steam/callback/route.ts`.
- **Evidence:**
  - Three anonymous `steam/icon` calls with new ids wrote three cache rows and made three third-party calls.
    Those rows are kept for the long `settledProgress` TTL.
  - The image proxy reads the whole upstream body before applying its 3 MB cap: a 12 MB stub was refused
    only after it was held in memory. It has no timeout, and it follows redirects, validating only the final
    URL, so intermediate hops are requested.
  - `rankings` by points uses a 5-minute per-instance cache and answered in about 75 ms warm, but
    `?sort=streak|best` recomputes everyone's streaks on each anonymous request, uncached: 1.1 s at 60,000
    `score_games` rows and 12.2 s at 600,000, locally (see PERF-03).
- **Impact:** hosting, database and third-party cost under simple scripted traffic. This is a cost and
  availability risk, not data exposure.
- **Proposal:** per-address limits or Vercel WAF rules on these routes. In the proxy, use a streaming size
  cap, `AbortSignal.timeout`, and `redirect: 'manual'` with each hop re-validated. Bound `appid`. Cache or
  precompute the streak orderings.

### SEC-10

**`next` is behind security releases; dependency alerting is off. Low, confirmed.**

`npm audit` reports 9 vulnerable packages (1 critical, 3 high, 5 low). Triaged by reachability, **none is reachable in
production on this commit**, so the rating comes from the app rather than the advisory. Full table:
[Dependency triage](#dependency-triage). Dependabot alerts and security updates are disabled, and no workflow
runs `npm audit`. Secret scanning and push protection are on.

**Proposal:** upgrade to `next` ≥ 16.4.1 (16.4.3 is current), since GHSA-673q-mjm6-r5xr advises upgrading even
without the affected pattern. Fresh `sharp` comes with it. Enable Dependabot alerts. Coordinate the upgrade
with in-flight branches.

### SEC-11

**CSP allows inline script; no COOP. Low, confirmed.**

`next.config.ts:21` keeps `'unsafe-inline'` in `script-src`, a known trade-off noted in the file. The CSP is
therefore no second line of defence, which is why SEC-02 ran under it. No injection sink was found: the only
`dangerouslySetInnerHTML` uses are static JSON-LD and theme scripts. The other headers are present on pages
and API responses alike. `Cross-Origin-Opener-Policy` is missing.

**Proposal:** add `Cross-Origin-Opener-Policy: same-origin` (checking the Steam redirect flow). Evaluate
nonces or Next's hash-based option against the static pages.

### SEC-12

**CSRF protection rests on `SameSite` alone. Low, confirmed.**

With the cookie attached by hand, a state-changing POST carrying a foreign `Origin` and `Content-Type:
text/plain` was accepted. Handlers parse JSON without checking either header. `SameSite=Lax` does block this
from other sites, and the only state-changing GETs (email verification, the Steam callback) need a signed token
or the browser's `state`. It does not separate same-site origins, such as
`dev.cheevovault.com` and `www`.

**Proposal:** one `Origin` check for non-GET `/api/*` requests, in one shared place.

### SEC-13

**Markup reaches the "email changed" notice. Low, confirmed.**

`src/utils/authValidation.ts:13` accepts angle brackets in an address, and
`src/lib/emailChangedNotice.ts:43` puts the masked address into HTML unescaped. A test address carrying markup
arrived raw in the mail body. It takes the account's password, but this mail exists to warn the owner during
a takeover, so an attacker controls part of the warning.

**Proposal:** escape values in mail HTML with one helper and tighten the address shape.

### SEC-14

**Reset tokens survive an email or password change. Low, confirmed.**

A reset token issued before an email change still set a new password afterwards. `src/lib/passwordReset.ts:18`
retires tokens only when a new one is issued. The exposure lasts up to one hour.

**Proposal:** delete unused tokens on email and password change, for users and admins.

### SEC-15

**Steam cookies survive sign-out. Low, confirmed.**

After sign-out, `steam-login` and `steam-state` were still in the browser. The ticket stays valid for up to
10 minutes, which matters on a shared computer.

**Proposal:** clear both after use and on sign-out.

### SEC-16

**Xbox rows reach non-admin viewers. Low, confirmed.**

`src/app/api/users/[username]/route.ts:54` and `src/app/api/perfectGamesOrder/route.ts:17` returned another
user's `xbox` rows to a non-admin. The data is only numeric ids, but it breaks the "to anyone else it is not
there at all" rule. Recheck after #88, which works near the hidden-games lists.

**Proposal:** filter both with `sourceAllowed`, as the other paths do.

### SEC-17

**Sign-up reveals which addresses are registered. Low, confirmed.**

`src/app/api/users/route.ts:70` and the Steam sign-up answer `email-taken`, while `forgotPassword` is carefully
built not to reveal this. Sign-up is limited to 5 per hour per address, so the rate is low.

**Proposal:** treat it as an accepted trade-off and write that down, or move to a neutral "check your email"
sign-up.

### SEC-18

**30-day sessions, no per-session revocation, RA key in the token. Low, confirmed.**

Sessions use NextAuth's 30-day default and cookies are `HttpOnly; SameSite=Lax`. Sign-out does not invalidate a
copied token, and only a password change ends other sessions (within the 60 s row cache). The encrypted token
also holds `raid`. Neither the browser's session object nor the page HTML exposed it under test.

**Proposal:** a shorter `maxAge`, a per-user token version for "sign out everywhere", and loading `raid` on the
server instead of carrying it in the token.

### SEC-19

**Malformed input answers 500. Low, confirmed.**

Invalid JSON, non-numeric ids and out-of-range ids answered 500 on several routes, for example
`DELETE /api/pinnedGames?gameId=abc`. **No internals leaked**, but the project's rule is that an error asking
again will not fix must be a 4xx, since clients retry 5xx.

**Proposal:** validate at the boundary with one small parser for ids and bodies.

### SEC-20

**Some admin reads and failed unlocks are not logged. Low, confirmed.**

`GET /api/admin/users` (all users' emails), `GET /api/admin/xbox/achievements` and failed unlock attempts leave no
`admin_actions` row, though the project's rule is that everything is logged.

**Proposal:** log them, with the failed unlock recording the attempt only.

### SEC-21

**Cached personal data outlives unlink and deletion. Low, confirmed by code.**

RA rows are written to `steam_cache` with no `user_id` (`src/lib/raCache.ts:92`), so neither the deletion cascade
nor `clearUserCache` removes them before they expire, and `unlinkRaUser` does not clear anything. Expired Xbox
rows stay 30 days longer (`src/lib/steamCache.ts:211`).

**Proposal:** pass `user_id` when a key belongs to a user, and check `/privacy` against the real retention.

## Hypotheses

Not confirmed, and not counted as findings.

| ID | Hypothesis | Why unverified | Would change |
|---|---|---|---|
| H-01 | A gap in how the Steam sign-in response is handled (detail withheld). Our side's behaviour was observed locally. | The outcome depends on Steam's own handling, and probing Steam is out of bounds. | Critical if true. A cheap strict-parsing fix is proposed privately and is worth shipping without waiting for proof. |
| H-02 | An allow-listed image host serves attacker-controlled SVG. | Third-party probing is out of bounds. | Raises SEC-02 to High. |
| H-03 | `NEXTAUTH_SECRET` is shared between Preview and Production. | Vercel settings were not read. | If shared, a preview deployment can forge production sessions and open sealed credentials. **Check this.** |
| H-04 | IPv6 clients can rotate within a /64 to avoid per-address limits. | Keys use the full address, but IPv6 reachability on Vercel was not measured. | Weakens every per-address limit. |
| H-05 | Vercel replaces `x-forwarded-for`, so clients cannot choose their address. | Vercel behaviour, documented in code. Locally the header is spoofable, as expected without Vercel. | Would void per-address limits if wrong. |
| H-06 | `/_next/image` is also off on Vercel. | It answers 404 in `next start` with `images.unoptimized`; Vercel was not tested. | Would reopen two advisories below. |

## Dependency triage

`next` 16.3.6, `sharp` 0.35.4, `next-auth` 4.24.15. `npm audit` on the lockfile; `npm audit signatures` verified.

| Advisory | Package | Audit severity | Reachable here? | Why |
|---|---|---|---|---|
| GHSA-2464-fhr4-w9xw (RCE via SVG, image optimizer) | next | Critical | No | `images.unoptimized: true`; `/_next/image` answered 404 locally (H-06). |
| GHSA-673q-mjm6-r5xr (RCE, `use cache`) | next | Critical | No | No `use cache` in the app. The advisory still advises upgrading. |
| GHSA-cjq9-62q9-8jv4 (SSRF, image optimizer) | next | High | No | Optimizer unused, as above. |
| GHSA-p3m5-59mp-jv5r (DoS, Server Actions) | next | High | No | No Server Actions. |
| GHSA-wq5f-xc86-pv6w (librsvg) | sharp | High | No | Only via Next's optimizer; the app does not use `sharp`. |
| GHSA-f87g-xv8r-7p7x (metadata image routes) | next | Medium | No | Applies to webpack builds using `dynamicParams`; builds use Turbopack. |
| GHSA-mcj8-r9mp-w47p (SSG/ISR cache poisoning) | next | Medium | No | Needs a root-level catch-all; the only page catch-all is nested. |
| GHSA-4jqv-mc3x-m676 (SSG/ISR, self-hosted) | next | Medium | No | Pages Router and self-hosted only. |
| GHSA-3w37-wq28-93x7, GHSA-h694-7cp9-m8p3 (`use cache`) | next | Medium | No | No `use cache`, no Cache Components. |
| GHSA-39w2-rjm5-chcv (dev server MCP) | next | Low | Developer machines only | Only under `next dev`, while visiting a hostile site. |
| GHSA-68fv-2mgg-jv7q | source-map-js | High | No | Build tooling; no attacker-supplied source maps. |
| GHSA-mrhx-c7xc-m3w5 | zod | High | No | Dev lint plugin only; the app does not use `zod`. |
| GHSA-gcqx-w48m-w2h4 | deepmerge (via jest) | Low | No | Test tooling only. |

Installing with `--ignore-scripts` worked from the lockfile. No `Dependabot` config exists.

## Reviewed, no finding

| Area | Result |
|---|---|
| Authentication on routes | 119 anonymous calls: 107 refused with 401; the rest were public on purpose, bad-input 400/404s or redirects. |
| Authorization between users | Writes to another user's groups, showcase and pins were refused or had no effect. `?user=` reads of a private profile were refused. `/api/favorites` ignores `?user=`. |
| Admin | Role, unlock, forged cookie and non-admin paths held. The unlock cookie is `HttpOnly; SameSite=Strict; Path=/api/admin`, and `Secure` in production. |
| Cron | Fails closed without `CRON_SECRET`; constant-time comparison. |
| RA key exposure | Absent from the browser's session, the page HTML and API responses. No route returns a session object. |
| Passwords and resets | bcrypt cost 12, dummy hash for unknown users, tokens hashed, single use, one hour. `forgotPassword` answers identically. |
| Sessions | Rebuilt from the row, `update()` payload ignored, password change revokes. |
| Steam `state` | Bound to the browser and to the signed `return_to`. |
| Signed tokens | `NEXTAUTH_SECRET` signs several formats without a purpose label; their payload shapes cannot overlap, so no confusion was found. A label would still be cheap. |
| SQL injection | All values parameterized. Every interpolated identifier comes from a fixed allowlist. |
| XSS | No sink for user data. Stored strings render through React. |
| SSRF | The image proxy is the only server fetch shaped by user input. Its host checks held, and a spoofed `Host` or `x-forwarded-host` was refused. The profile preview never fetches pasted avatars. |
| Uploads | Avatars are verified from their bytes; an SVG posing as PNG was refused. |
| Redirects | No open redirect: Steam return paths are allow-listed and no `callbackUrl` is taken from a request. |
| Secrets | Nothing real in the tree or history (test fixtures only). `.env*` ignored; `NEXT_PUBLIC_` holds only public values. Logs do not print keys. |
| CI | `pull_request` only, minimal permissions, user text passed through `env`. |
| Security headers | CSP, HSTS, `X-Frame-Options`, `nosniff`, Referrer and Permissions policies present on pages and API. No CORS headers. No `X-Powered-By`. |
| Caching | Per-user reads are `private` with `Vary: Cookie`. `public` appears only on the image proxy and Steam icons. |
| BFF aggregates | **None exist at this commit.** See [Re-audit](#re-audit-when-the-bff-lands). |

## OWASP Top Ten

| Category | Result |
|---|---|
| A01 Broken access control | SEC-04, SEC-16. Core ownership checks are sound. |
| A02 Cryptographic failures | SEC-07. Hashing and token design are sound. |
| A03 Injection | None found. SEC-13 is minor (mail HTML). |
| A04 Insecure design | SEC-01, SEC-05. |
| A05 Security misconfiguration | SEC-11, SEC-12. H-03 needs checking. |
| A06 Vulnerable components | SEC-10: nothing reachable, alerting off. |
| A07 Identification and authentication | SEC-01, SEC-03, SEC-08, SEC-14, SEC-15, SEC-18, H-01. |
| A08 Software and data integrity | CI sound. `npm audit` is not part of CI. |
| A09 Logging and monitoring | SEC-20. Sign-in anomalies are not alerted on. |
| A10 SSRF | Host allow-list sound; SEC-09 covers redirect handling. |

## Not audited, and limits

- **Production and Preview were not touched.** Vercel settings, environment scoping, WAF rules, Neon roles,
  Resend and DNS configuration were not read. Header and cookie results come from `next start`, not from
  Vercel's edge. In particular, `Secure` on the session cookie depends on an https `NEXTAUTH_URL` and was not
  observed.
- **Platforms were stubbed.** Real Steam, RA, PSN, Xbox and IGDB behaviour was not exercised, so
  `psn/*`, `xbox/*` and most `steam/*` success paths were reviewed by code and through their guards only.
- **The local schema is an approximation** for the base `users` table (no migration exists).
- **Client code** was searched for dangerous patterns, not read file by file.
- **Rate limit tests** were deliberately small. Figures show mechanisms, not production capacity.
- **Privacy compliance** (data export, full erasure, consent) was only touched by SEC-21.
- **Performance and API quota behaviour** belong to the next sections. SEC-05 and SEC-09 overlap them.
  No #86 or #87 measurement was repeated.

## Re-audit when the BFF lands

For each new aggregate from the #86 rollout, check:

- `dataOwner` on the aggregate, and on each platform inside it.
- Private-profile behaviour for every sub-read.
- Per-platform authorization, including Xbox staying admin-only.
- Cache keys carrying the subject, and the viewer where results differ.
- `private` with `Vary: Cookie`.
- That one aggregate cannot multiply upstream calls on someone else's key (SEC-05).

---

# Performance

## Summary

This section covers what #86 did not: bundle weight, Web Vitals and how server reads scale. #86's Network
audit stands, and its main conclusion (retire the global provider cost before building aggregates) is not
repeated here. The local run agrees with it: routes with little data of their own, such as `/groups`, still
made 18 `/api` requests with mock platforms.

The biggest gains are cheap. The two public entry pages are slow for reasons unrelated to data, and every page
downloads all nine languages.

| ID | Severity | Status | Finding |
|---|---|---|---|
| [PERF-01](#perf-01) | High | Confirmed (synthetic) | The landing hides its headline until JavaScript hydrates |
| [PERF-02](#perf-02) | Medium | Confirmed | Every page downloads all nine languages |
| [PERF-03](#perf-03) | Medium | Confirmed (synthetic volume) | Streak orderings recompute everything on each request |
| [PERF-04](#perf-04) | Medium | Confirmed | The sign-in page ships empty HTML |
| [PERF-05](#perf-05) | Low | Confirmed | Font weight is above budget |
| [PERF-06](#perf-06) | Low | Unverified with real data | Layout shift on `/user` and `/allGames` |
| [PERF-07](#perf-07) | Unrated | Hypothesis | Long lists are not virtualized |

## Method

- Production build of the audited commit, `next start`, throwaway database, fake accounts, mock platforms.
- First-load JS comes from the build's manifests, gzip level 9.
- Web Vitals used Chrome with an empty cache, 4× CPU throttling and 1.6 Mbps / 150 ms RTT. Three samples per
  route, median shown, at 390 px and 1440 px.
- Rankings volume is synthetic: 200 games per user with 20 unlocks each, on a local database, five samples.
  The server was restarted so cold and warm reads could be told apart.

**How far these numbers go.** Localhost has no CDN, HTTP/2 or brotli, so production should be faster on a
first load. Absolute times are for comparison; the causes are what carry over. Chrome also loaded the landing's
and sign-in page's public game art from `media.retroachievements.org` and `cdn.akamai.steamstatic.com`, as any
visitor's browser does. Those were ordinary image loads, not probes. Signed-in LCP is **not reported**: with mock
platforms the page has no real content, so LCP landed on unrelated text.

## Measurements

First-load JS per route, gzipped (budget: 200 KB):

| Route | JS |
|---|---:|
| Smallest page (`_global-error`) | 437 KB |
| `/privacy`, `/terms` | 456 KB |
| `/compare`, `/track` | 463 KB |
| `/authPage` | 480 KB |
| `/welcome` | 494 KB |
| `/rankings` | 517 KB |
| Game pages | 521–523 KB |
| `/user/[username]` | 625 KB |
| Home | 628 KB |

Of this, 166 KB is the framework's root bundle and 214 KB is the translations chunk. Recharts stays out of first
load as intended (`CLAUDE.md`), arriving lazily on the home, where about 717 KB of JS was transferred in total.

Public routes under throttling (target: LCP ≤ 2.5 s, CLS ≤ 0.1):

| Route | LCP 390 px | LCP 1440 px | CLS | Blocking time |
|---|---:|---:|---:|---:|
| `/` | **12.9 s** | **12.8 s** | 0 | under 50 ms |
| `/authPage` | **4.5 s** | **7.1 s** | 0 | under 110 ms |
| `/rankings` | 1.2 s | 1.2 s | up to 0.02 | 0 |
| `/compare/exophase` | 1.7 s | 1.6 s | 0 | 0 |

`/rankings` and `/compare` show that the transport and base bundle allow a good LCP. Main-thread blocking was
low everywhere, so the slow pages are waiting on the network, not on the CPU.

## Findings

### PERF-01

**The landing hides its headline until JavaScript hydrates. High, confirmed (synthetic).**

- **Surface:** `src/components/landing-page/landing-hero/LandingHero.tsx:22-23`, `:47-49`,
  `src/components/landing-page/landing-bento/LandingBento.tsx`.
- **Evidence:** the hero uses Framer Motion with `initial: { opacity: 0 }`, so the server's HTML holds an invisible
  headline. FCP was 1.3 s but LCP, on that same headline, came much later. Isolating the cause at 1440 px:

  | Condition | LCP |
  |---|---:|
  | Fast network, 4× CPU, external images blocked | 1.2 s |
  | Throttled network, no CPU throttling, images blocked | 5.1 s |
  | Throttled network and CPU, images blocked | 5.9 s |
  | Throttled network and CPU, images allowed | 12.8 s |

- **Impact:** the page that introduces the product, and that search engines measure, sits three times over
  Google's "poor" line in these conditions. The network matters more than the CPU: about 100 requests and 860 KB
  on load, and the game art competes with the scripts that reveal the headline.
- **Proposal:**
  1. Show the headline in the server's HTML, with CSS keyframes for any entrance. CLAUDE.md's entrance-animation
     note already asks for this.
  2. Load off-screen art lazily and with explicit sizes.
  3. Reduce the images fetched on first view.
  4. Measure on Vercel with Lighthouse and field data before and after.

### PERF-02

**Every page downloads all nine languages. Medium, confirmed.**

- **Surface:** `src/context/LanguageContext.tsx:5-13`.
- **Evidence:** all nine translation files are imported statically into one chunk of 214 KB gzipped (688 KB
  uncompressed). It is in the first load of every route, and a person reads one language.
- **Impact:** a third to a half of first-load JS on the lighter pages, parsed on every visit, on phones too.
  It also keeps every route over the 200 KB budget by itself.
- **Proposal:** load only the active language. The server already knows it on app pages (`serverLanguage()`).
  Import the others on demand when someone switches, keeping the rule that the first paint is already in the
  person's language. Expect to save about 190 KB. Measure it, and add a bundle budget check.

### PERF-03

**Streak orderings recompute everything on each request. Medium, confirmed (synthetic volume).**

- **Surface:** `src/app/api/rankings/route.ts`, `src/lib/rankings.ts:204-216`.
- **Evidence:**

  | `score_games` rows | Users | Points, cold | Points, warm | By streak or best |
  |---:|---:|---:|---:|---:|
  | 60,000 | 300 | 190 ms | 72 ms | **1.1 s** |
  | 600,000 | 3,000 | 468 ms | 77 ms | **12.2 s** |

  By points is protected by a 5-minute per-instance cache and scaled well. `/api/rankings/me`, called on every route,
  stayed at 7–10 ms: an expected hotspot that turned out not to be one. The streak orderings expand the unlocks of
  every listed user on each request, uncached, and the route is public.
- **Impact:** linear growth in database work on a public endpoint. With today's user count it is not urgent. It
  becomes an availability and cost problem as the rankings grow, and it is the cheapest way to load the database
  anonymously (see SEC-09).
- **Proposal:** keep each user's current and best streak as columns, written by the score refresh, and order by
  them. A short cache of the ordering is the smaller first step.

### PERF-04

**The sign-in page ships empty HTML. Medium, confirmed.**

- **Surface:** `src/app/(auth)/authPage/page.tsx:12-22`.
- **Evidence:** `useSearchParams` at page level forces client rendering. The built `authPage.html` is 20 KB with no
  visible text and a client-rendering bailout marker. FCP was 4.3 s under throttling, against 1.3 s on the landing.
- **Impact:** people arriving to sign in or register see a blank page until the JavaScript finishes.
- **Proposal:** render the forms statically, and move the parameter read into a small client child inside `Suspense`.

### PERF-05

**Font weight is above budget. Low, confirmed.**

About 180 KB of fonts loaded on every route measured, against a 100 KB budget. Which files make up that figure was not
broken down. **Proposal:** list the files fetched per route, then drop unused weights and subset the rest.

### PERF-06

**Layout shift on `/user` and `/allGames`. Low, unverified with real data.**

CLS reached 0.42 on `/user` and 0.47 on `/allGames` at 1440 px, over the 0.25 "poor" line. With mock platforms these
pages replace empty or error states, so the real figure may differ. **Proposal:** recheck on a real account, and reserve
space for notices that appear after load, such as the email verification banner.

### PERF-07

**Long lists are not virtualized. Unrated hypothesis.**

No virtualization library or `content-visibility` is in use, and paging exists only in a few lists. #86 saw 144 `/api`
resources on `/playing`, 116 of them images or icons. A test with a 2,000-game mock library **did not render the games**, so
it proves nothing. **Proposal:** measure with a real large library before adding any virtualization.

## Attempts that did not stand

| Idea | Result | Verdict |
|---|---|---|
| `rankings/me` is a hotspot, since every route calls it | 7–10 ms at 600,000 rows | Not a problem |
| Rankings by points has no server cache | It has a 5-minute one; SEC-09 was corrected | Withdrawn |
| 2,000-game library render cost | Mock did not produce a rendered list | Not measured |
| Signed-in LCP | Not representative with mock platforms | Not reported |

## Not audited

Field data (CrUX, RUM), production Vitals, INP on real interactions, signed-in routes with real data, re-render
profiling, and everything in #77's scope. **Post-BFF comparison is pending:** no aggregate exists at this commit.
When the rollout lands, compare calls, bytes, latency and failure isolation against #86's table.

---

# API limits

## Summary

Every platform has a working mitigation story, and a refresh loop cannot burn quota: an entry can be replaced at most
once a minute per cache key, whoever asks (`src/lib/wantsFresh.ts`). The weak spots are between the layers. A
platform's "slow down" is turned into something the browser retries, some calls have no timeout, and PSN and Steam
each depend on one shared credential with only part of the traffic budgeted.

| ID | Severity | Status | Finding |
|---|---|---|---|
| [API-01](#api-01) | High | Confirmed in code; Sony's limits not measured | One PSN account serves everyone, with only scoring budgeted |
| [API-02](#api-02) | Medium | Confirmed | A rate limit becomes a retryable 503 |
| [API-03](#api-03) | Medium | Confirmed | Timeouts are missing or longer than the client's patience |
| [API-04](#api-04) | Medium | Confirmed in code | Page loads ignore RA's measured pace |
| [API-05](#api-05) | Medium | Confirmed in code | Steam has no app-wide budget |
| [API-06](#api-06) | Low | Confirmed | Only Xbox has quota telemetry |

## Limits, usage and mitigations

**"Sent today" figures are rough estimates from reading the code**, for one active user with an average library.
Nothing here was measured against a real platform.

| | Limit | Sent today (estimate) | Mitigations | Failure reach |
|---|---|---|---|---|
| **Steam** | [100,000 calls a day](https://steamcommunity.com/dev/apiterms) per key. Burst limits unpublished; a code comment assumes 100–200 per 5 minutes, while a fill was measured at 29 games/s (2026-10-20). | About 40–50 calls for a cold load, 100–200 a day. A first fill costs up to 2 calls per played game (the second is shared and cached). | `steam_cache`, batch counts, `loadOwnedGames`, `PACE`. | **Everyone**: one app key. |
| **RA** | [Unpublished; "a reasonable burst for each user"](https://api-docs.retroachievements.org/). Project measurement: a burst of about 7 gets 429; one call per 250 ms never failed. | Tens per session, up to 100 from one `getGamesLastPlayed`. | Two-level cache, `Retry-After` honoured up to 5 s, scoring at 300 ms spacing. | One user's key, plus whoever reads through it (SEC-05). |
| **PSN** | Unpublished. #51 research works with a conservative 40 calls/minute; not validated. | Per #51: over 100 calls for a cold 500-game profile, about 600 calls per 15 minutes at most for scoring. | `psn:` cache, one retry after 2 s, `psn-score` budget. | **Everyone**: one app account. |
| **Xbox** | 150 calls an hour for the app (OpenXBL free plan, per project docs). | See #87. Admin-only. | #87: hourly budget, 5 s timeout, 429 cooldown, stale-if-error. | Admins only today. |

## What happens when it breaks

Measured with a mock upstream, one API call per row:

| Upstream answer | Route answers | Upstream attempts | Time |
|---|---|---:|---:|
| RA 429, no `Retry-After` | 503 | 3 | 3.0 s |
| RA 429, `Retry-After: 60` | 503, without the header | 1 | 12 ms |
| RA 500 | 503 | 3 | 1.5 s |
| RA hangs | 503 | 3 | **37.6 s** |
| Steam 429 | 503 | 1 | 8 ms |
| Steam 500 | 503 | 3 | 1.5 s |
| Steam hangs | 503 | 3 | **37.6 s** |

Other scenarios, from code and project measurements:

| Scenario | What the user sees |
|---|---|
| RA key revoked | `403 ra-key-invalid` and a notice to link again. Not retried. Good. |
| NPSSO expired | PSN pages fail for everyone until an admin pastes a new one. `/api/cron/psnToken` warns from 7 days before. |
| Sony rate-limits the account | One retry after 2 s, then 429 with `Retry-After: 60`, read as a plain failure with a retry button. |
| Private profile | A distinct message per platform, as CLAUDE.md's failure table requires. Good. |
| Huge library | Fills run in passes and show progress. PSN is capped at 100 games a pass, so a 1,000-game account needs many passes across the shared budget. Xbox reads play time for the 300 most recent games only. |
| Refresh in a loop | Bounded to one upstream read per key per minute. Good. |

## Findings

### API-01

**One PSN account serves everyone, with only scoring budgeted. High, confirmed in code; Sony's limits not measured.**

- **Surface:** `src/lib/psnClient.ts:136-145`, `src/lib/scoreRefresh.ts`, `src/lib/attemptLimit.ts`.
- **Evidence:** `allowAttempt('psn-score', 'app')` covers score reads only. Summaries, title lists, trophies, recent
  feeds and linking reach Sony with no shared budget. #51's research puts a cold 500-game profile above 100 calls,
  and estimates that 10 cold users at once could already draw a 429. That research is unvalidated and this audit did
  not test against Sony.
- **Impact:** a rate limit or block on that one account takes PSN away from **all** users at once, and sign-ups arriving
  together are what would trigger it. The app cannot tell how close it is, because Sony's limit is unknown.
- **Proposal:** one global budget for all Sony calls, as #87 did for Xbox: a Postgres counter, a cooldown after a rate
  limit shared across instances, and stale data served meanwhile. It does not require #51's queue, which remains a
  separate decision.

### API-02

**A rate limit becomes a retryable 503. Medium, confirmed.**

- **Surface:** `src/lib/raFailure.ts`, `src/lib/fetchWithRetry.ts`, the Steam routes' catch blocks,
  `src/lib/fetchSteam.ts`.
- **Evidence:** RA and Steam 429s reached the browser as 503 with no `Retry-After`. `fetchWithRetry` retries 5xx up to
  four times. For RA, that means up to 12 upstream attempts per client call under a 429 (3 × 4), in about 17 s.
  `fetchSteam` says a 429 is "surfaced immediately rather than retried into the limit", yet the browser retries it
  anyway, up to four times.
- **Impact:** retries arrive exactly when the platform asks for fewer, and each page fires many such calls. On Steam,
  one key shared by all users takes that pressure.
- **Proposal:** answer 429 with `Retry-After` from these routes, as PSN and Xbox already do. Make the client treat 429 as
  no immediate retry. A short per-instance cooldown after a 429, as in #87, would stop the rest of the page's calls.

### API-03

**Timeouts are missing or longer than the client's patience. Medium, confirmed.**

- **Surface:** `src/lib/fetchRA.ts`, `src/lib/fetchSteam.ts`, `src/lib/fetchWithRetry.ts`, `src/lib/psnClient.ts`,
  `src/lib/igdbClient.ts`, `src/lib/psnCredentials.ts`, `src/lib/email.ts`.
- **Evidence:**
  - A hung RA or Steam upstream held the route for **37.6 s** (three 12 s attempts). The browser gives up at 20 s and asks
    again while the first function keeps running, so a request can overlap with its own retry.
  - With `fetchWithRetry`, a person can wait over 80 s for an error (four 20 s attempts plus backoff).
  - `psn-api` sets no timeout, and neither do the IGDB, PlayStation Store and Resend calls. How long a hung Sony call
    lasts is bounded only by the function's own limit.
- **Impact:** function time and connections are held during an outage, when they matter most, and a slow platform looks
  like a frozen page. A slow platform also holds a read that the rest of the page may be waiting on.
- **Proposal:** a single deadline per platform call and per route, shorter than the client's, with few retries. #87 chose
  5 s per call for Xbox, a reasonable starting point. Add timeouts around `psn-api` with `Promise.race`, since it accepts no signal.

### API-04

**Page loads ignore RA's measured pace. Medium, confirmed in code.**

- **Surface:** `src/app/api/getGamesLastPlayed/route.ts` (5 at a time, no gap).
- **Evidence:** the score fill respects the measured pace, one call at a time 300 ms apart, because a burst of about 7
  draws a 429 with no `Retry-After`. Interactive reads do not: `getGamesLastPlayed` fires batches of 5 back to back,
  alongside the page's other RA calls on the same key. The fill and a page can also run on the same key at once.
- **Impact:** a person with many games can rate-limit their own key by opening a page. See SEC-05 for the same effect from
  another account.
- **Proposal:** serialize per key: one small in-process queue per RA key, spacing calls by the measured 250 ms. Reduce the
  requested games to those on screen.

### API-05

**Steam has no app-wide budget. Medium, confirmed in code.**

- **Surface:** `src/lib/fetchSteam.ts`, `src/lib/scoreRefresh.ts:43-47`, `src/lib/steamCache.ts`.
- **Evidence:** `PACE.steam` has 8 workers and no per-pass cap, per user. Nothing counts calls across users. The documented
  ceiling is 100,000 calls a day, and a code comment assumes a far stricter burst limit than the fill's measured rate, so
  the real margin is unknown. In the worst case, 50 fills of 1,000-game libraries in one day would reach the daily cap, before
  any browsing. Shared caching of global percentages lowers that.
- **Impact:** comfortable at today's size. But a growth spike has no brake, and the key's failure reaches everyone. It is
  also not known here whether Preview shares the production key.
- **Proposal:** count daily calls in the same Postgres counter style, alert at 70%, and pause fills before browsing is hurt.
  Use separate keys per environment.

### API-06

**Only Xbox has quota telemetry. Low, confirmed.**

#87 added upstream counts and cache outcomes for Xbox. RA, Steam and PSN have error logs only, so nobody can say how close
production is to a limit. **Proposal:** extend the same sanitized telemetry to the other three, by operation, never with
account identifiers.

## Not audited

No call reached a real platform, so all limits come from documentation or earlier project measurements. Real 429 behaviour,
Sony's limits and production call volumes were not measured, and OpenXBL's current plans could not be confirmed online.
Xbox relies on #87's work, which was not repeated. PSN and Xbox failures were read in code, not run. **Post-BFF validation is
pending**: the shared loader, its timeout and stale policy, and whether one aggregate multiplies upstream calls.

---

# Fix status

Added on the development branch `fix/audit-v17-findings`, 2026-10-30. Everything above describes the audited
commit and is left as it was written. Results use the same local method as the audit, not production.

| ID | Status | Result or what is left |
|---|---|---|
| H-01 | Fixed | Repeated parameters are refused. Whether Steam was affected stays unknown. |
| SEC-01 | **Partly** | Unlink ends the sign-in and link/unlink mail the owner. Asking for the password before linking needs a decision (UI, welcome flow). |
| SEC-02 | Fixed | Raster types only. |
| SEC-03 | Fixed | Attempts counted before the work. |
| SEC-04 | Fixed | Groups and avatars follow the owner's privacy; `user_id` left the response. |
| SEC-05 | Fixed for now | Per-viewer limit and a 10-game cap on a borrowed key. RA's answer is still pending. |
| SEC-06 | Fixed | Length and row caps, single-statement order saves. Database `CHECK`s not added. |
| SEC-07 | **Open** | Needs a migration and a backfill on real databases, and depends on H-03. |
| SEC-08 | **Open** | Needs a decision on the second factor. |
| SEC-09 | Partly | Proxy and `appid` bounded, streak orderings cached. Per-address limits are Vercel WAF settings. |
| SEC-10 | Partly | `next` 16.4.2: no critical left, production advisories no longer reported for `next`. Dependabot is a repository setting. |
| SEC-11 | Partly | COOP added. Inline scripts remain: nonces would cost the static pages. |
| SEC-12 | Fixed | Cross-site writes refused in the proxy. |
| SEC-13 | Fixed | Mail values escaped, address shape tightened. |
| SEC-14 | Fixed | Unused tokens retired on email and password change. |
| SEC-15 | Fixed | Cookies end after use. |
| SEC-16 | Fixed | Both reads filter Xbox. |
| SEC-17 | Accepted | Kept: a neutral sign-up would change the flow for a low-rate leak. |
| SEC-18 | Partly | 14-day sessions, RA key out of the token. "Sign out everywhere" needs a migration. |
| SEC-19 | Fixed | Bad ids and bodies answer 4xx. |
| SEC-20 | Fixed | Logged. |
| SEC-21 | Partly | RA rows cleared on unlink and deletion. Xbox's 30 days remain, for stale-if-error. |
| PERF-01 | Fixed | LCP 12.8 s → 1.4 s. |
| PERF-02 | Fixed | 190 KB less on every route; home 628 → 438 KB, minimum 437 → 246 KB. |
| PERF-03 | Partly | 12.2 s → 15 ms warm. A cold read still took about 23 s at 600,000 rows; columns need a migration. |
| PERF-04 | Fixed | FCP 4.3 s → 1.7 s. Desktop LCP is still about 6 s, on a collage image. |
| PERF-05 | **Open** | Dropping weights changes the look: needs checking by eye. |
| PERF-06 | **Open** | Needs a real account. |
| PERF-07 | **Open** | Needs a real large library. |
| API-01 | Fixed | One budget for every Sony call, deadline and cooldown. The 900/15 min figure is a guess until measured. |
| API-02 | Fixed | 429 with `Retry-After`. |
| API-03 | Fixed | Deadlines under the client's. |
| API-04 | Fixed | Pace per key, per instance. 100 uncached games now take about 25 s. |
| API-05 | Partly | Daily count and a brake for fills. Separate keys per environment are Vercel settings. |
| API-06 | Partly | RA, Steam and PSN counted per day. Steam warns in the logs; there is no admin view yet. |
