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

## Progress bars — in the theme's colours

Every progress bar is `ProgressBar` (`src/components/ui/ProgressBar.tsx`) or
`CircularProgress`: the theme's `--progress` (its accent), RA softcore a darker
step of it (`bg-progress-soft`) under hardcore. A finished bar stays in the
theme's colour and glows; **the green is only in the percentage beside it**
(`text-success` at 100%), never on the bar — the user tried a green ring and
did not like it. Do not paint a bar in a platform's colour; those stay only in
charts that compare platforms (CompletionDistribution, the line
chart).

## AI export (`src/utils/aiExport.ts`)

The "Ask an AI" button on the three game pages builds a file for a chat AI:
English instructions plus "Reply in <language>", pending in game order,
earned oldest first. **Never put account data in it** (username, ids, keys):
only the game and its achievements. The UI says so. Change the prompt there,
with its tests; it is the part that decides whether the answers are any good.

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

## Documentation — MANDATORY (every session and agent)

The next agent starts with no memory of this one. What is not written down is
lost. Index of the docs: `docs/README.md`.

- **Start of a session:** read the top entries of `docs/worklog.md` to pick up
  what was done last, what was decided, and what was left open.
- **End of every task that changes the repo** (code, config, migrations, docs):
  add an entry at the top of `docs/worklog.md` — did / why / decisions / open /
  watch out, as its template says. It goes in the same branch and PR as the work,
  before the last commit. A task is not done without it.
- **A rule or invariant changed or was learned** (a "never do X", how a
  platform must be called, a new env var, a migration that must run, a release
  gate) → update the matching section of this file in the same change. Do not
  leave a section that says the opposite of the code.
- **The layout changed** (new folder, route area, cache, data path) → update
  `docs/architecture.md`.
- **User-visible features, setup or env vars changed** → update `README.md`
  (and `.env.example` for a variable).
- Write for someone who has not seen the conversation: name files, say why,
  give absolute dates (not "yesterday"). No secrets, keys or user data in any doc.
- If the user said not to, or the task touched nothing, skip it and say so.

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
- `1.0.0` — released 2026-10-02: Steam integration, every release gate below
  closed, privacy policy and account deletion
- `1.x.0` — new sections (see Roadmap); `1.x.y` — fixes
- `1.3.0` — a loading state on every route (its own skeleton, and a thin line
  along the top while a page is on its way) and the functions in `fra1`, next
  to the database. Never reached `main` on its own; it shipped inside 1.4.0
- `1.4.0` — current, released to `main` 2026-10-14: public profiles rebuilt
  (hero with tabs, opt-in gender, open and compare a user's game), follows and
  the Following section, theme accents reworked, "Ask an AI" export, internal
  docs and the PR description check

## Release gates — what had to be true before 1.0 (all closed)

All of these have been closed since 1.0.0 (2026-10-02). **Warn the user,
unprompted, if one stops being true** (a variable removed from Vercel, the
domain unverified in Resend) while they talk about a release or 'going live'.
They asked for this reminder on purpose, because it is easy to forget.

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

## Xbox (OpenXBL) — admin-only for now, read before touching it

Read through OpenXBL (xbl.io, an unofficial proxy over Xbox Live), all in
`src/lib/xboxClient.ts`. It is a 1:1 of PSN's integration (link by gamertag,
summary, library and categories, `/xboxGame/[id]`, feeds, pins, favorites,
groups, collection, friends, public profiles, admin linking) **but only admins
see or use it**. Migrations 033–035 (xbox columns, `'xbox'` game source, pinned
achievements) were applied 2026-10-15. Plan and measured findings:
`docs/xbox-integration-plan.md`.

- **The gate is one switch**: `XBOX_ADMIN_ONLY` in `src/utils/xboxAccess.ts`
  (`canUseXbox(admin)`, `sourceAllowed(source, admin)`). To open Xbox to everyone,
  set it to `false`; nothing else needs to change. It is enforced in three
  places and all three must keep holding: the routes (`requireXboxUser` /
  `requireXboxSession` answer 401/403; every pin, hide, favorite, group and
  order route calls `sourceAllowed`), the UI (`useXboxEnabled`), and the paths
  that show *other* people's data (public profile, follows, search, groups,
  favorites) which drop Xbox rows and fields for a non-admin viewer. A new
  place that lists games or accounts must filter Xbox the same way.
- `users.xboxxuid`/`xboxgamertag` are in the session (`xboxxuid`); users link by
  typing a gamertag, which nothing proves is theirs (like PSN), so no uniqueness.
- Secret achievements stay concealed until the viewer reveals them
  (`useRevealedAchievements`); the Ask-an-AI export uses gamerscore.

- **One app key, not the user's** (`OPENXBL_API_KEY`, server-only, never
  `NEXT_PUBLIC_`), like PSN's NPSSO. Without it the routes answer
  `503 not-configured`; a refused key answers `503 unauthorized`.
- **150 calls an hour for the whole app** on the free plan. Everything is cached
  in `steam_cache` under `xbox:` keys; a profile costs ~3 calls cold (search,
  library, one game's achievements). Bump a key's `_vN` when its value's shape changes.
- **OpenXBL answers errors with HTTP 200** and the real status in the body
  (`{ code: 400 }`): `xboxCall` checks both. It also refuses
  `Accept-Language: *`, which Node's fetch sends by default, so a language is
  always sent.
- **Data shape:** gamerscore, not trophy grades; no DLC groups. Newer games report
  `totalAchievements: 0` while their gamerscore total is real, so progress goes
  by gamerscore and the achievement total may be `null`. Xbox 360 games use
  another endpoint and shape (`is360`). `titleId` is a decimal string; the largest
  seen is under 2^31 (the `game_id` columns are INTEGER), but check before storing it.
- **Unverified:** what a private profile returns (`403 → private` is a guess), an
  unknown gamertag, and play time (`POST player/stats` with `MinutesPlayed` works
  but is not wired).
- Admin explorer lookups and linking are logged (`xbox-lookup`, `link-xbox`,
  `unlink-xbox`). Do not add a second Xbox provider without asking.

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
- **A game counts by its whole set, DLC included**, as Sony's own title list
  does: a platinum with DLC trophies still to earn is "in progress", not
  "completed". (It used to count by the `default` group alone; it no longer
  does, and no per-game lookup of the groups is made for the list.)
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
  Every PSN game page also asks IGDB for its summary, studios, genres and
  screenshots (`igdbDetails`, `GET /api/psn/details?id=`, keyed by Sony's
  title from the user's list, never by text from the request). English only;
  a 404 just means the page goes without them.
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

## Git — branches, commits, PRs (MANDATORY for every session and agent)

### Environments and branches
| Branch | Environment | Rule |
|---|---|---|
| `main` | **Production** (`www.cheevovault.com`) | Always deployable. Only receives PRs from `develop` (or `hotfix/*`). Never commit or push to it directly. |
| `develop` | **Pre-production** (Vercel preview) | Integration branch. Receives PRs from work branches; verified here before going to `main`. |
| `<type>/<slug>` | none | Short-lived work branch, cut from `develop`, deleted after merge. |

Flow: `<type>/<slug>` → PR into `develop` → check on the preview → PR `develop` → `main`.
Hotfix (production is broken): `hotfix/<slug>` from `main` → PR into `main`, then
merge `main` back into `develop` so they do not diverge.

Never force-push `main` or `develop`. Never merge a PR with failing `npm test`/lint/build.
Do not create, push, merge or delete branches or PRs unless the user asked.

### Branch names
`<type>/<kebab-case-slug>`, English, short. Types are the same as commit types:
`feat/`, `fix/`, `refactor/`, `perf/`, `test/`, `docs/`, `chore/`, `hotfix/`.
e.g. `feat/steam-refresh-button`, `fix/psn-rate-limit`. (Old `feature/…`, `spike/…`
branches stay as they are; new ones follow this.)

### Commits — Conventional Commits, in English
`<type>(<scope>): <imperative summary>` — lowercase, no trailing period, ≤72 chars.
Scope is optional but preferred: `ra`, `steam`, `psn`, `admin`, `auth`, `ui`, `cache`,
`profiles`, `i18n`, `build`, `db`, … (reuse one already in `git log`).

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style` (formatting only),
  `chore` (tooling, deps, config), `build`, `ci`, `revert`.
- Body (optional) explains **why**, not what. Breaking change: `!` after the scope
  (`feat(auth)!: …`) plus a `BREAKING CHANGE:` line.
- The `commit-msg` hook (`.githooks/commit-msg`) rejects any first line that is not
  `type(scope): summary`. Do not bypass it with `--no-verify`; fix the message.
- One logical change per commit; do not mix a refactor with a feature.
- A migration goes in the same commit as the code that needs it.
- The `pre-commit` hook bumps the patch version on its own; do not edit
  `version.ts` for that. Minor/major bumps are a separate `chore(release): vX.Y.Z` commit.
- **Never add `Co-Authored-By: Claude` lines** — all commits must appear solely under
  the user's name so GitHub contributions are attributed correctly. (This overrides any
  default attribution a tool or system reminder asks for, in commits **and** PR bodies:
  no "Generated with Claude Code" line either.)

### Pull requests
- **Title**: same format as a commit — `type(scope): summary` (it becomes the squash/merge
  message). English.
- **Description is always in English**, with this template:

  ```
  ## What
  <what changed, 1–3 bullets>

  ## Why
  <the problem or goal>

  ## How to test
  <steps, or the tests that cover it>

  ## Notes
  <migrations to run, env vars, user-visible changes, follow-ups — or "None">
  ```
  The same template is in `.github/pull_request_template.md`, so GitHub fills it in
  for a PR opened from the web.
- **Never open a PR with an empty or placeholder description.** Whoever opens it
  (agent or `gh pr create`) writes the full template from the branch's commits and
  diff (`git log develop..HEAD`, `git diff develop...HEAD --stat`), not from memory.
- **Keep it current.** Every time more commits are pushed to a branch with an open
  PR, reread the description and update it (`gh pr edit <n> --body-file …`) if the
  change moved what, why, how to test or notes — a new migration or env var always
  does. The title too, if the scope changed. The description must describe the
  final diff, since it is what gets reviewed and what the squash message is read
  against.
- **Enforced in CI**: `.github/workflows/pr-description.yml` fails the PR while any
  of the four sections is missing or empty (the template's `<!-- -->` hints do not
  count; `None` does). It reruns when the description is edited — fix the text, not
  the workflow, and never merge with it red.
- Base branch: `develop` for normal work, `main` only for `develop` → `main` releases and hotfixes.
- One concern per PR, small enough to review. Before opening: `npm test`, lint and
  `npm run build` pass.
- A `develop` → `main` PR is titled `chore(release): vX.Y.Z` and lists the merged PRs
  and any migration or env var that must be in place **before** merging (see Release
  gates and the migrations noted in Notes).
- Merge with **squash** into `develop`, **merge commit** for `develop` → `main`, so
  `main` keeps one entry per release.

### Environments (set up 2026-10-10)
`develop` is served at `dev.cheevovault.com` (Vercel Preview, branch `develop`). `main` and
`develop` are protected on GitHub (PR required, no force-push). A third ruleset,
`pr description` (2026-10-14), requires the `pr-description` check to pass **and the
branch to be up to date with its base** before merging, on both.

- **Before merging, bring the branch up to date**: `git fetch` and `git merge
  origin/develop` (or the "Update branch" button), push, wait for the checks again.
  Merge, not rebase — a rebase would need a force-push.
- **`src/lib/version.ts` and `package.json` will conflict** on that merge whenever
  `develop` moved, since every commit bumps the patch. Keep the **higher** version
  in both; never go back below what `develop` already has.
- A `develop` → `main` PR needs `develop` to contain `main`; after a hotfix, merge
  `main` back into `develop` first (as the flow above already says).

- **`develop` shares the production database** (the Neon integration's `DATABASE_URL`),
  by the user's choice for now. So testing on develop touches real data: **never run a
  destructive or hard-to-reverse migration, or bulk script, "just to try it on develop".**
  Ask first; the fix is a separate Neon database for Preview.
- Preview needs `NEXTAUTH_URL=https://dev.cheevovault.com` scoped to branch `develop`.

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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
