# CLAUDE.md — Achievements Tracker

## Project
Multi-user RetroAchievements companion. Public tracker with groups,
stats, and personalization. Next.js 14 App Router + PostgreSQL + Tailwind v4.

## Stack
- Framework: Next.js 14 (App Router)
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

**Current milestone targets:**
- `0.8.x` — current: login/register polish + optimizations
- `0.9.0` — stats page reorganization
- `1.0.0` — Steam integration

## Release gates — things that must be true before 1.0

**Warn the user, unprompted, whenever they talk about cutting 1.0, tagging a
release, or 'going live' while any of these is still open.** They asked for
this reminder on purpose, because it is easy to forget.

- [ ] **`cheevovault.com` verified in Resend, with `EMAIL_FROM` set on it.**
      The domain was bought on 2026-09-28; owning it is not the same as Resend
      being allowed to send from it. Until it is verified, password recovery
      only reaches the Resend account owner, so every other user is one
      forgotten password away from losing their account. This is the blocker:
      a public site with no working recovery is not 1.0.
- [ ] `NEXTAUTH_URL` set to `https://www.cheevovault.com` in Vercel. **www, not
      the apex**: the apex 308-redirects to www, so that is the host visitors
      are on. Reset links are built from it, NextAuth compares it against the
      real host when signing in, and Steam's return_to has to come back to the
      same host the session cookie belongs to.
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
  exist through the Steam API). Linking Steam here skips the OpenID proof of
  ownership — the admin vouches for it, and the log records it.
- The privacy policy (`/privacy`) says all of this; `/terms` says when an
  account may be suspended or deleted. Change the policy if the panel changes.

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
- [ ] Steam integration
- [ ] Public user profiles
- [ ] Group hardcore achievement tracking
- [ ] Push notifications
- [ ] 13 optimization fixes (cache stampede, Cache-Control headers, duplicate fetches, TTLs, error boundaries, lazy images)
