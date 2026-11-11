# Accounts: sign-up, sessions, email and the admin panel

Moved out of `CLAUDE.md` on 2026-11-07 (#124). `CLAUDE.md` → Auth keeps the invariants; this file has
them in full, with their reasons.

## Registration

Public and open: anyone can sign up with a username, a password and an **email,
which is required** — it is the only way to recover an account. Accounts created
before that rule have none, and the account page shows them a warning.
There is no invite code; the old `REGISTER_TOKEN` / `NEXT_PUBLIC_REGISTER_TOKEN`
pair is gone, and the public one leaked the secret into the browser bundle.
`REGISTRATION_OPEN=false` closes sign-ups; unset means open. Sign-ups and reset
requests are both limited per address in the database (`src/lib/attemptLimit.ts`).

### Sign up with RetroAchievements (2026-10-23)

"Create account with RetroAchievements" under the register form (`RegisterUserFormRa`): the RA
username and Web API key are checked first (`POST /api/auth/ra/check`, signed out, limited per
address as `ra-check`, refuses a key already in use), RA's name fills the username (unless one was
typed, `suggestUsername`) and its picture becomes the avatar; then `POST /api/users` with `ra`
asks RA again and creates the account already linked, as `/api/updateRaUser` would store it. The
welcome's RA step then shows "linked as" (the user's choice: shown, not skipped).

- **It is a sign-up, never a sign-in.** Measured 2026-10-23: a valid RA key reads *any* user's
  profile and RA has no "whose key is this" call (no `u` → 422), so a key proves owning an RA
  account, not which one, and people paste their key into other tools. **Do not add "sign in with
  RA" by key.** The account still gets an email and a password. Revisit when RA ships OAuth (see
  the roadmap): that is when it can become a "Continue with RetroAchievements" like Steam's.
- The RA username is as unproven as when linking from the account page; `raid` stays unique.

### Steam: sign up, sign in and link, all through Steam (2026-10-21)

"Continue with Steam" under both forms (`SteamSignInDivider`), and "Connect Steam" on the
Steam card (`UserSteamCardLink`, `/api/auth/steam?intent=link&next=…`). Steam's OpenID 2.0, all
in `src/lib/steamLogin.ts`; `migrations/041_steam_login.sql` (`users.steam_login_id`,
unique) was applied to pre (2026-10-21) and production (2026-10-22); any other database needs it first; nothing else
reads that column, so the rest of the app works without it.

- `/api/auth/steam` → Steam → `/api/auth/steam/callback`, which asks Steam to confirm
  its own signature (`check_authentication`) and checks the claimed id, `return_to`
  (built from `NEXTAUTH_URL`) and that those fields were signed. **Never trust the
  callback's query without that round trip**, and refuse a query with a repeated
  parameter before reading any of it: what is checked here and what Steam checks must
  be the same value.
- **A random `state`** rides on `return_to` (signed by Steam) and in an httpOnly cookie on
  the callback path; the callback does nothing unless they match. Without it, a callback link
  made with someone else's Steam account could link it to your account, and then sign them in
  as you. Keep it on both flows.
- The proven SteamID64 travels as a signed ticket (HMAC with `NEXTAUTH_SECRET`,
  10 minutes) in an httpOnly cookie on `Path=/api/auth`. The `steam` NextAuth
  provider reads it from the Cookie header, never from the request body; so does
  `POST /api/auth/steam/register`.
- **Steam gives no email**, so the sign-up still asks for one (required, as always)
  and for a username (suggested from the Steam name). The Steam name and
  `avatarfull` are copied in, `steamid`/`steamusername` are linked, and the password
  is random: the user signs in with Steam, and "forgot password" sets a real one.
  Same `REGISTRATION_OPEN` and `signup` rate limit as the normal sign-up.
- **Users link Steam only through Steam** (decided 2026-10-21; the typed link and
  `/api/steam/link` are gone). A link sets `steamid`, `steamusername` and `steam_login_id`,
  so it also signs in with Steam; one Steam account to one user (another user's proven link
  answers `#steam-taken`). The outcome comes back as `#steam-linked|taken|failed` on the page
  it started from (`/`, `/user` or `/welcome`, `linkReturn`), toasted by `useSteamLink`.
- `steam_login_id` is **separate from `steamid`**: links typed before 2026-10-21 (three, all
  the user's test accounts) keep `steamid` with no `steam_login_id` and were left as they are,
  by the user's choice; `steamid` stays not unique for them. **Unlinking clears both** (changed
  2026-10-30, audit SEC-01): a sign-in nobody can remove outlives a password change. Someone who
  signed up through Steam gets back in with "forgot password". Link and unlink mail the account's
  address (`sendSteamLinkNotice`). Linking asks for no password, by the user's choice (2026-10-31,
  the most comfortable flow, here and in the welcome): the mail and the unlink are what answer a
  link nobody asked for. Admins still link by typing (logged).

## Sessions

- The session is rebuilt from the `users` row on every read (`jwt` callback in
  `src/lib/authOptions.ts`, cached ~60 s per instance in `src/lib/userRecord.ts`).
  **Never copy data from `update()`'s payload into the token**: the browser
  controls it. To change a session field, save it in the DB, then call `update()`
  with no arguments.
- Changing the password (hash) ends every session, this one included. A deleted
  user's session ends too.
- The RA API key (`raid`) is server-only: `getServerSession(authOptions)` has it,
  the browser's session (`authHandlerOptions`) does not. Client code uses `raLinked`.
- **Do not hand the session to a second `SessionProvider`** (2026-10-31): next-auth keeps module-level state, so a nested
  one leaves the root's reading `unauthenticated`, and the root layout must not read the session (see `i18n.md`). A page whose
  shape depends on the session holds its skeleton while `status === 'loading' && !session`, as the home and `/user` do.
  `getServerSession(authOptions)` carries `raid`: never pass that object to a client component.
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

## Email

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

## Admin panel

Everything lives in `src/lib/adminAuth.ts`; every admin route starts with
`requireAdmin(req)`.

- **Two locks.** The admin flag is read fresh from the DB, and the panel must be
  **unlocked with the admin's own password and a one-time code** (`POST /api/admin/unlock`,
  `src/lib/adminTotp.ts`, `migrations/044_admin_totp.sql`, applied to pre 2026-10-31; any other database
  needs it first, or the unlock answers 500).
  An admin with no authenticator enrols on their next unlock, after the password. Recovery codes are
  shown once and stored hashed. Lost both: `DELETE FROM admin_totp WHERE user_id = <id>`. The
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
  exist through the Steam API). Neither proves ownership (users now link Steam
  through Steam, which does), so the log records who linked what.
- **One link and unlink SQL for both sides** (#125, 2026-11-11): `src/lib/platformLinks.ts` writes each
  platform's link (`saveRaLink` seals the key, `saveLink` for a typed one) and its unlink (`unlinkPlatform`:
  the columns, `clearUserCache`, Steam's `forgetUnlocks`, `forgetUser`), for `api/updateRaUser`, `api/psn/link`,
  `api/xbox/link`, the four unlink routes and `api/admin/users/accounts`. The routes keep their own auth
  (`requireSession`, `requireXboxUser`, `requireAdmin`), checks, answers, mails (`sendSteamLinkNotice` only on
  the user's Steam unlink) and `logAdminAction`. Only Steam's OpenID callback writes `steam_login_id`.
  `platformLinks.test.ts` pins the SQL text; `app/api/platformLinks.contract.test.ts` checks every route,
  user and admin. The panel's platform rows are `utils/adminPlatforms.ts`.
- The privacy policy (`/privacy`) says all of this; `/terms` says when an
  account may be suspended or deleted. Change the policy if the panel changes.
