# CLAUDE.md — Achievements Tracker

## Project
Multi-user RetroAchievements companion. Public tracker with groups,
stats, and personalization. Next.js 16 App Router + PostgreSQL + Tailwind v4.

## Stack
- Framework: Next.js 16 (App Router; the auth gate is `src/proxy.ts`, the old middleware)
- Auth: NextAuth.js
- DB: PostgreSQL via `pg` pool
- Styles: Tailwind CSS v4
- Animations: Framer Motion
- Data: RetroAchievements API

## Code structure

### Folder / naming
- Component: `kebab-case/PascalCase.tsx`
  e.g. `main-side-panel/MainSidePanel.tsx`
- Sub-component: `parent-name-sub-name/ParentNameSubName.tsx`
- Hooks: `src/hooks/useXxx.ts` — never inline in component
- Pure transforms: `src/utils/utils.tsx` (NOT apiCallsUtils)

### File internal order
1. `'use client'` (if needed)
2. External imports (react, next, next-auth)
3. Internal: types → hooks → utils → components
4. Constants (ALL_CAPS)
5. Inline helpers (only if <15 lines + presentational + single use)
6. Default export component
7. Inside component: state → refs → hooks → useEffect → derived → handlers → return

### Custom hooks
- All hooks in `src/hooks/`
- Hooks own: session check, hasFetched guard, fetch, state
- `hasFetched = useRef(false)` pattern lives in hook, not component

### Sub-component extraction — MANDATORY
**Goal: pages and components as independent and self-contained as possible.**

Extract to its own file+folder when:
- Used in 2+ places, OR
- Has complex or independent meaning (card, grid, list, section, modal content), OR
- Adds meaningful visual/logical separation to the parent

Keep inline ONLY if: <15 lines + purely presentational + single file.

**Any JSX block added in a session that qualifies MUST be extracted before the task is considered done.**
When in doubt, extract. Prefer more files over bloated components.

## State and effects

`react-hooks/set-state-in-effect` is an **error**: an effect must not call
setState in its body (nor through a function it calls before its first await).
What to use instead:

- **State that starts over when something changes** (a modal opening, a session
  ending, another game): `useWhenChanged(deps, () => { setX(…) })`
  (`src/hooks/useWhenChanged.ts`). It runs while rendering, the React-endorsed
  alternative. Only setState of that component goes in it; timers, focus and
  fetches stay in an effect.
- **What the browser holds** (localStorage, sessionStorage): `useStorageValue`
  (`undefined` on the server and while hydrating, so there is no mismatch).
  `useStoredChoice`, `useCookieConsent` and the language sit on it.
- **"Only in the browser"**: `useIsClient` (a portal into `document.body`, a
  random hand), `useLocationHash` (the `#fragment`).
- **A fetch**: the effect only starts it; the answer is applied in the `.then`.
  Loading is derived (`answered !== wanted`) or reset in `useWhenChanged`, not
  set at the start of the effect. A request function that returns its outcome
  and a separate `settle` is what the compiler accepts for an `async` load.
- A retry button is a handler, so it can set state before it asks again.

## Telling the user how an action went — toasts

`notify.success(T.toast.x)` / `notify.error(T.toast.y)` from `src/lib/notify.ts`,
callable from components, hooks or contexts; `<Toaster />` (root layout) draws
them bottom right: green with a check, red with an alert icon, gone after 4 s
(errors 7 s), never while hovered or focused.

- **Use a toast** for actions that happen outside a form — pin/unpin, reorder,
  delete, unlink — and for the success of a modal that closes on save.
- **Do not** for an error inside a modal that stays open: show it inline, next
  to what needs fixing. And never both for the same outcome.
- A silent failure is a bug: an optimistic update that rolls back must say so.
- Texts live in `T.toast` (all languages). The admin panel's are in English.

## API calls — error handling MANDATORY
Every API call added or modified must have its own error handling. No exceptions.

- `fetch` calls: check `response.ok`, handle non-2xx explicitly
- Catch network/unexpected errors with `try/catch`
- Set appropriate error state so the UI can reflect failure (error message, empty state, retry)
- Do not let errors propagate silently or swallow them with empty catch blocks
- API route handlers (`route.ts`): always return structured error responses with correct HTTP status codes

## Testing — MANDATORY
Every new feature, hook, or utility must include tests. Tests live alongside the code they cover.

- Hooks: test with `renderHook` from `@testing-library/react`
- Components: test with `@testing-library/react` — cover render, interactions, edge cases
- Utils: plain unit tests (input → output)
- API routes: test happy path + error cases
- Run `npm test` before marking any task done
- Do not leave untested code — if it's complex enough to extract, it's complex enough to test

## Non-negotiable standards (apply to ALL work)

### 1. Responsive
Mobile-first. Tailwind sm/md/lg prefixes. No fixed widths that break mobile.

### 2. Accessible (WCAG 2.1)
- Interactive = `<button>` or `<a>`, never `<div onClick>`
- Icon-only buttons → `aria-label`
- Decorative icons → `aria-hidden="true"`
- Inputs → `<label htmlFor>` + `id`
- Toggles → `role="switch"` + `aria-checked`
- Errors → `role="alert"`, success → `role="status"`
- Selected states must not rely on color alone

### 3. i18n
- All user-facing strings via `T.*` from `useLanguage()` hook
- New strings → add to both `src/translations/en.ts` and `src/translations/es.ts`
- Admin panel exempt

## Versioning

Single source of truth: `src/lib/version.ts` → `APP_VERSION`.

**Scheme (semver):**
- `x.0.0` — major: huge integrations or platform shifts (e.g. Steam)
- `0.x.0` — minor: new pages, sections, significant feature changes
- `0.0.x` — patch: small fixes, optimizations, tweaks

**Pre-release suffixes** (optional, for WIP features):
- `0.9.0-beta` — feature in progress
- `0.9.0-rc.1` — release candidate, near-final

**Auto-bump via git hook (`.githooks/pre-commit`):**
- Every commit auto-bumps patch (`0.8.0` → `0.8.1`)
- To do a minor/major bump: edit `src/lib/version.ts` manually before committing — hook detects the change, skips auto-bump, and syncs `package.json`
- Hook is activated via `npm run prepare` (already wired in `package.json`)

**Milestones:**
- `0.8.x` — login/register polish + optimizations
- `0.9.x` — stats page reorganization, Steam, email, analytics
- `1.0.0` — current: Steam integration, every release gate below closed,
  privacy policy and account deletion (2026-10-02)
- `1.0.x` — fixes; `1.x.0` for new sections (see Roadmap)

## Release gates — things that must be true before 1.0

**Warn the user, unprompted, whenever they talk about cutting 1.0, tagging a
release, or 'going live' while any of these is still open.** They asked for
this reminder on purpose, because it is easy to forget.

- [x] **`cheevovault.com` verified in Resend, with `EMAIL_FROM` set on it**
      (2026-10-02). Password recovery reaches every user, not only the Resend
      account owner.
- [x] `NEXTAUTH_URL` set to `https://www.cheevovault.com` in Vercel. **www, not
      the apex**: the apex 308-redirects to www, so that is the host visitors
      are on. Reset links are built from it, and NextAuth compares it against
      the real host when signing in.
- [x] `migrations/018_unique_username_email.sql` run (2026-10-02). Two
      sign-ups racing each other can no longer take the same username or
      address, in any case.
- [x] `NEXT_PUBLIC_CONTACT_EMAIL` set in Vercel (2026-10-02). `/privacy`
      shows it, with the data controller from `src/lib/siteUrl.ts`, as the
      address for data requests; the GDPR wants both on a public site.
- [x] Email verification decided: shipped, soft. A banner on the account page
      for an unconfirmed address, with a resend button. Nothing is ever
      blocked — not sign-in, not a feature. See Email below.
- [x] `migrations/011_drop_sourceless_game_keys.sql` run (2026-09-28). The
      sourceless unique keys are gone, so an RA game and a Steam app with the
      same number can both be pinned and both sit in one group. Code older
      than the Steam work can no longer pin against this database: its
      `ON CONFLICT (…, game_id)` has no constraint left to name.

## Email — read before touching anything that sends one

Password recovery goes out through Resend (`src/lib/email.ts`, REST API, no SDK).
How far it reaches depends only on the environment:

- **No `RESEND_API_KEY`** → `emailConfigured()` is false, `POST /api/auth/forgotPassword`
  returns `503 { error: 'email-not-configured' }`, and the UI tells the user plainly.
  **Do not "fix" this by pretending the mail was sent.**
- **Key only** → sends from Resend's shared address, which delivers **only to the
  Resend account owner**. That is the state until `cheevovault.com` is verified
  in Resend, which is DNS and dashboard work, not code.
- **Key + `EMAIL_FROM` on a verified domain** → reaches everyone. Configuration
  only; no code change.

Other things to keep true:

- Reset links are built from `NEXTAUTH_URL`.
- Tokens: random 32 bytes, only their SHA-256 stored, one hour, single use
  (`src/lib/passwordReset.ts`, table from `migrations/016_password_resets.sql`).
- `/api/auth/forgotPassword` answers the same whether or not the address has an
  account. Keep it that way: it is what stops the endpoint being used to find users.
- Never add a second mail provider or an SMTP fallback without asking.

### Email verification (soft, and it stays soft)

A link goes out on sign-up and can be resent from the account page. Following
it sets `users.email_verified_at` (`migrations/017_email_verification.sql`).

- **Nothing is ever gated on it.** Sign-in, RA, Steam, groups — all work with an
  unconfirmed address. The only effect is a banner
  (`email-verification-notice/EmailVerificationNotice.tsx`). Do not add a check
  that blocks a feature on `emailVerified` without asking: the point of the
  address is recovery, and locking someone out of an achievement tracker over a
  mail that landed in spam costs more than it saves.
- Tokens are **signed, not stored** (`src/lib/emailVerification.ts`): verifying
  is idempotent, so there is nothing to spend. They last a week, and carry the
  address, so a link dies when the account's email changes.
- `POST /api/auth/resendVerification` mails the address **on the account**,
  never one from the request body, and is rate limited like the reset flow.
- The session exposes `emailVerified`; the column is read in
  `src/lib/userRecord.ts`, so it follows the same fresh-from-the-row rule as
  everything else in Sessions.

## Sessions — read before touching auth

- The session is rebuilt from the `users` row on every read (`jwt` callback in
  `src/lib/authOptions.ts`, cached ~60 s per instance in `src/lib/userRecord.ts`).
  **Never copy data from `update()`'s payload into the token**: the browser
  controls it. To change a session field, save it in the DB, then call `update()`
  with no arguments.
- Changing the password (hash) ends every session, this one included. A deleted
  user's session ends too.
- The RA API key (`raid`) is server-only: `getServerSession(authOptions)` has it,
  the browser's session (`authHandlerOptions`) does not. Client code uses `raLinked`.
- Admin checks read the DB (`loadUser(id, { fresh: true })`), not the session.
  See Admin panel below for the rest.
- Sign-in, current-password checks, sign-up and reset requests are rate limited
  in the DB (`src/lib/attemptLimit.ts`). Password rules: `PASSWORD_MIN` and
  `BCRYPT_COST` in `src/utils/authValidation.ts`.
- Changing the email asks for the current password; it is the recovery address.
  It also clears `email_verified_at` and mails a link to the new address.
- Deleting the account (`DELETE /api/account`, from the account page) asks for
  the current password too, and refuses to remove the last admin. Everything
  the user owns cascades from the `users` row.

## Admin panel — read before touching `/api/admin/*`

Everything lives in `src/lib/adminAuth.ts`; every admin route starts with
`requireAdmin(req)`.

- **Two locks.** The admin flag is read fresh from the DB, and the panel must be
  **unlocked with the admin's own password** (`POST /api/admin/unlock`). The
  unlock is a signed, httpOnly cookie scoped to `/api/admin`, valid 15 minutes,
  bound to the admin and to their password hash (a password change ends it).
  Without it the endpoints answer `403 reauth-required` and the panel shows the
  password form, so a stolen or unattended session reads no one's data.
  Do not add an admin endpoint that skips `requireAdmin(req)`.
- **Everything is logged** in `admin_actions` (`migrations/020_admin_actions.sql`,
  run 2026-10-02): who, what, to whom, when, with names copied in. Kept a year.
  New admin actions must call `logAdminAction`. Readable from the panel.
- **Changing an email notifies the old address** (`src/lib/emailChangedNotice.ts`),
  whether the user or an admin did it. It is what stops a quiet takeover: change
  the address, then reset the password.
- Admins can create users (for odd cases; sign-up is open), edit, delete, and
  link/unlink RA (checked against RA with the user's key) and Steam (checked to
  exist through the Steam API). Neither proves ownership — users link Steam by
  name too — so the log records who linked what.
- The privacy policy (`/privacy`) says all of this; `/terms` says when an
  account may be suspended or deleted. Change the policy if the panel changes.

## RetroAchievements (RA) — read before touching its calls

- **The cache already lives in Postgres.** `withCache` (`src/lib/raCache.ts`)
  keeps memory as a first level and `steam_cache` as the second, under `ra:`
  keys, so a cold start or another instance does not ask RA again. Skipped in
  development, where memory is cleared on purpose. Bump a key's `_vN` when the
  shape of what it returns changes.
- **A 429 waits.** `fetchRA` honours `Retry-After` up to `MAX_RETRY_AFTER`
  (5 s) and retries; a longer ask is thrown. Other 4xx are never retried.
- **Whose key.** Never a shared app key (see the roadmap). On the user's own
  page the call uses their `raid`; `requireViewerApiKey` never falls back to
  another key. On someone else's page `dataOwner` (`src/lib/apiAuth.ts`) signs
  with the **viewer's** key when they have one, and otherwise with the **page
  owner's**, so a viewer with no RA account still sees it. That last case
  spends one user's key on other people's visits; it is an open question for RA,
  not something settled. `raid` stays server-only either way.
- The user search (`/api/users/search`) only reads our database; it never calls RA.

## PlayStation (PSN) — read before touching it

Read through `psn-api` (Sony's unofficial mobile API), all in `src/lib/psnClient.ts`.

- **One app account, not the user's.** Every call is made as the PSN account
  whose NPSSO the app holds; it can read any profile with public trophies.
  Users link by typing their online ID — nothing proves it is theirs, so
  `psnaccountid` is deliberately **not unique** (a squatter must not lock the
  owner out). `/privacy` and `/terms` say so.
- **The NPSSO dies 60 days after sign-in, and nothing extends it** (measured:
  refreshing returns the same 10-day refresh token; psn-api issue #171; Sony's
  sign-in has a captcha). It lives encrypted in `psn_credentials`
  (`migrations/026`, `src/lib/psnCredentials.ts`, `secretBox`), is renewed by
  pasting a new one in the admin panel, and `/api/cron/psnToken` mails the
  admins from 7 days before. `PSN_NPSSO` only seeds the first setup.
  **Do not** try to automate Sony's sign-in.
- **Games are keyed like RA and Steam**: source `'psn'`, and the trophy set's
  number as id (`NPWR20188_00` ↔ `2018800`, `psnNumericId`/`psnTitleId`).
- **A game with DLC counts by its base game** (the `default` trophy group):
  the main fields are the base game's, `full` has the whole set. That is what
  makes a platinum "completed".
- **Two lists, merged**: the trophy list (`getUserTitles`) and the played-games
  list (play time, last session, store art, PS4/PS5 only, its own privacy
  setting). `lastTrophyAt` is the trophy list's date and keys every trophy
  cache; `lastPlayed` is the last session when known.
- **Caches** live in `steam_cache` under `psn:` keys. When the shape of a
  cached value changes, bump its key's version (`psn:titles:vN`) in the same
  change — a dev server will otherwise serve the old shape.
- **PS3/Vita games** have no play data and no Store page: their cover,
  backdrop and release year come from IGDB (`src/lib/igdbClient.ts`, a Twitch
  app in `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`), matched by title and
  platform, cached half a year. Without the keys they keep the trophy icon.
- Sony returns errors as bodies, not throws: every call goes through
  `psnCall()` (`unwrap()` plus one retry after 2 s when Sony says "too many
  requests" — psn-api hides the HTTP status and `Retry-After`, so it goes by
  the message). `psnFailure()` maps them to 503 / 403 (private) / 429 (rate
  limited, with `Retry-After: 60`) / 502. The client reads a 429 as a plain
  failure with a retry button.

## Registration

Public and open: anyone can sign up with a username, a password and an **email,
which is required** — it is the only way to recover an account. Accounts created
before that rule have none, and the account page shows them a warning.
There is no invite code; the old `REGISTER_TOKEN` / `NEXT_PUBLIC_REGISTER_TOKEN`
pair is gone, and the public one leaked the secret into the browser bundle.
`REGISTRATION_OPEN=false` closes sign-ups; unset means open. Sign-ups and reset
requests are both limited per address in the database (`src/lib/attemptLimit.ts`).

## Git — commits
Claude can commit when asked. **Never add `Co-Authored-By: Claude` lines** — all commits must appear solely under the user's name so GitHub contributions are attributed correctly.

## Style
- Single quotes, no trailing semicolons
- Spanish UI text is intentional — do not change it

## Roadmap (pending)
- [x] Steam integration
- [x] Public user profiles
- [ ] Group hardcore achievement tracking
- [ ] Push notifications
- [x] Steam linked by name, like PSN (2026-10-09): custom URL name, profile
      link or SteamID64 (`src/lib/steamAccount.ts`), no OpenID, and no
      "already linked elsewhere" check (`migrations/028`), so one person can
      have several CheevoVault accounts. The profile has to be public.
- [ ] RA: wait for the API v2 with OAuth before changing how accounts are
      linked ([RAWeb releases](https://github.com/RetroAchievements/RAWeb/releases)).
      **RA's answer was clear: each user with their own key.** No shared app
      key and no looking names up with one — `requireViewerApiKey` never falls
      back to one, and its test says so. The RA modal explains why the key is
      asked for. **Open:** a viewer with no RA account is served with the page
      owner's key (see RetroAchievements above); ask RA whether that counts, and
      if not, ask the viewer to link their own. Revisit when OAuth lands.
- [ ] Later, optional: a "verified" badge per linked account — the app gives
      a code, the user puts it for a few minutes in their RA motto / Steam
      summary / PSN About me, the app reads it. Only if public profiles or
      group comparisons come to need proof of ownership.
- [ ] 13 optimization fixes (cache stampede, Cache-Control headers, duplicate fetches, TTLs, error boundaries, lazy images)
- [x] The ~51 `react-hooks/set-state-in-effect` warnings are gone (2026-10-09)
      and the rule is now an error. See State and effects above.
