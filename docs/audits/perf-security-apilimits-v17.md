# Audit v1.7: performance, security and API limits

Report-only audit for [#90](https://github.com/Ivanmg10/achivements/issues/90). Sections are completed
independently and appended here. Nothing in this file changes application code.

| Section | Status | Base commit |
|---|---|---|
| Security | **Complete** (2026-10-30) | `c250f4bc21c96e6d6034a49cfa6b2a97ebcbb0e3` (`develop`, after #92) |
| Performance | Not started | n/a |
| API limits | Not started | n/a |

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
  - `rankings` computes the full list per anonymous request with no server-side cache.
- **Impact:** hosting, database and third-party cost under simple scripted traffic. This is a cost and
  availability risk, not data exposure.
- **Proposal:** per-address limits or Vercel WAF rules on these routes. In the proxy, use a streaming size
  cap, `AbortSignal.timeout`, and `redirect: 'manual'` with each hop re-validated. Bound `appid`. Keep a
  short server-side cache of the anonymous rankings.

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

Not started.

---

# API limits

Not started.
