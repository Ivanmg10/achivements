# Releases, environments and migrations

Moved out of `CLAUDE.md` on 2026-11-07 (#124). `CLAUDE.md` → Versioning keeps the scheme and the
auto-bump; → Git keeps the branch flow. This file has the history, the release gates, the
environments and the migrations that must be applied.

## Milestones

- `0.8.x` — login/register polish + optimizations
- `0.9.x` — stats page reorganization, Steam, email, analytics
- `1.0.0` — released 2026-10-02: Steam integration, every release gate below
  closed, privacy policy and account deletion
- `1.x.0` — new sections (see `roadmap.md`); `1.x.y` — fixes
- `1.3.0` — a loading state on every route (its own skeleton, and a thin line
  along the top while a page is on its way) and the functions in `fra1`, next
  to the database. Never reached `main` on its own; it shipped inside 1.4.0
- `1.4.0` — released to `main` 2026-10-14: public profiles rebuilt
  (hero with tabs, opt-in gender, open and compare a user's game), follows and
  the Following section, theme accents reworked, "Ask an AI" export, internal
  docs and the PR description check
- `1.5.0` — Xbox through OpenXBL, 1:1 with PSN but **admin-only** (`platforms/xbox.md`), a preference
  per platform to choose which consoles show, preferences that follow the account (`migrations/033`–`036`),
  account preferences in tabs, the library layout remembered, total play time, and a stricter reading of
  private profiles and refused keys on every platform. Built on `develop` in October 2026, with `037`
  (order of pinned achievements); it reached `main` inside 1.7.0.
- `1.6.0` — the Following restyle, presence, the showcase and the **rankings, a beta** (Vault Points,
  `social.md`), with `038`–`040`. Built on `feat/social-rankings` (split out of `improvements_11` on
  2026-10-20); it reached `main` inside 1.7.0.
- `1.7.0` — released to `main` 2026-11-02: the component library and the two designs, a skeleton
  and an entrance for every page, the welcome after sign-up, sign-up and linking through Steam and
  RetroAchievements, public profile cards, streaks in the rankings, Xbox quota hardening, the v1.7
  audit fixes. Migrations `041`–`044` are in production (`043`, `044` applied 2026-11-02, just before
  the release)
- Since 1.7.0 every commit bumps the patch (`src/lib/version.ts`); the next minor is the owner's call.

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
      blocked — not sign-in, not a feature. See `accounts.md` → Email.
- [x] `migrations/011_drop_sourceless_game_keys.sql` run (2026-09-28). The
      sourceless unique keys are gone, so an RA game and a Steam app with the
      same number can both be pinned and both sit in one group. Code older
      than the Steam work can no longer pin against this database: its
      `ON CONFLICT (…, game_id)` has no constraint left to name.

## Migrations that must be applied first

`migrations/` holds `002`–`045`. **Every migration is applied twice**: to pre first, to production when
the work reaches `main` (see Environments). Any other database needs each one before the code that
reads it runs. What each breaks without it, as `CLAUDE.md` used to say section by section:

| Migration | What it is | Applied | Without it |
|---|---|---|---|
| `011_drop_sourceless_game_keys` | RA and Steam ids can share a number | 2026-09-28 | Code older than Steam can no longer pin (its `ON CONFLICT (…, game_id)` has no constraint) |
| `016_password_resets` | Password reset tokens | — | — |
| `017_email_verification` | `users.email_verified_at` | — | — |
| `018_unique_username_email` | Racing sign-ups cannot share a name or address | 2026-10-02 | — (a release gate) |
| `020_admin_actions` | The admin log | 2026-10-02 | — |
| `026` | `psn_credentials`, the NPSSO encrypted | — | — |
| `028` | Drops the "Steam already linked elsewhere" check | — | — |
| `033`–`035` | Xbox columns, `'xbox'` source, pinned achievements | 2026-10-15 | — |
| `036_user_preferences` | `users.preferences` | — | — |
| `037_pinned_achievements_position` | Order of pinned achievements | 2026-10-17 | Every pins read answers 500 |
| `038_user_presence` | `last_seen_at`, `show_presence` | 2026-10-19 | **Every signed-in request fails** (`userRecord` reads `show_presence`) |
| `039_showcase_achievements` | The showcase | 2026-10-20 | The showcase, the follows overview and Following answer 500 |
| `040_vault_points` | Vault Points | 2026-10-20 | The rankings, the header's level and the score refresh answer 500 (Following and profiles still load, without levels) |
| `041_steam_login` | `users.steam_login_id`, unique | pre 2026-10-21, prod 2026-10-22 | Steam sign-in and linking fail; nothing else reads the column |
| `042_steam_unlocks` | Every Steam unlock read | pre and prod 2026-10-22 | They only log; nothing fails |
| `043_ra_key_sealed` | RA keys sealed at rest | pre 2026-10-31, prod 2026-11-02 | Linking RA answers 500; reads still work |
| `044_admin_totp` | The admin's one-time codes | pre 2026-10-31, prod 2026-11-02 | The admin unlock answers 500 |
| `045_steam_playtime` | Hours per Steam game, to date games Steam does not (#113) | **not applied** (2026-11-07) | Each owned-list read logs the missing table; dates come from kept unlocks and Steam's two-week minutes only, so a game with no achievements played more than two weeks ago stays undated. Nothing fails |

`—`: not written down in `CLAUDE.md` (the worklog archive may say). All of `041`–`044` are in production since the 1.7.0
release (2026-11-02).

## Environments (set up 2026-10-10)
**Keep Next at 16.4.3 or later (2026-11-01).** Up to 16.4.2 about 13 % of Vercel builds failed with `next/font/google queries have exactly one entry`: Google sometimes answers with `/l/font?kit=…&skey=…` URLs for Sofia Sans, and Turbopack split the query on the `&`. It has nothing to do with the commit being built. If it comes back, read the log before retrying (`npx vercel inspect dpl_… --logs`).

`develop` is served at `dev.cheevovault.com` (Vercel Preview, branch `develop`). `main` and
`develop` are protected on GitHub (PR required, no force-push). A third ruleset,
`pr description` (2026-10-14), requires the `pr-description` check to pass **and the
branch to be up to date with its base** before merging, on both; since 2026-10-23 it also
requires `linked-issue` (`CLAUDE.md` → Git → Issues).

- **Pre has its own database (2026-10-20):** a Neon branch of production, `preview`, read through
  `PREVIEW_DATABASE_URL` (`databaseUrl()` in `src/lib/db.js`), set in Vercel for **all Preview
  branches** (scoped to `develop` alone, a feature branch's preview would fall back to production)
  and in `.env.local`. It exists because the Neon integration owns `DATABASE_URL` for
  every environment and Vercel refuses a branch-scoped second one. Production ignores it whatever
  is set (`VERCEL_ENV`). Consequences: **every migration is applied twice** (pre first, production
  when the work reaches `main`); the branch drifts from production (Neon's "Reset from parent"
  copies production again, losing what pre had); it is a copy of real data, so treat it like
  production. **Until the variable is set somewhere, that place still uses production**: check
  before running anything destructive.
- **Demo users** for the rankings and public profiles: `node scripts/demo-rankings.mjs seed
  --follower=<username>` (and `clear`). It writes only to `PREVIEW_DATABASE_URL` and refuses when
  that is missing or the same host as `DATABASE_URL`. Never point it at production: `/rankings` is
  public. 30 hand-written personas (`scripts/demo-personas.mjs`, 2026-10-20; the five names the
  user chose stay), each with a twin (another name and picture), so 60; their points are multiplied
  by `SCALE` (30) so real users with big libraries are not all on top: no sign-in, kept out of the score refresh, found by their password mark
  (`MARK`), never by name. Their Steam/PSN accounts are made up, so their profiles work by
  **seeding `steam_cache`** under those accounts (never expiring) with real games' definitions
  taken from what pre already has cached for real users; points come from the real formula. If
  pre loses those cached games (a reset from production, an unlink), games drop out of the seed
  (it warns). No RA (the dev server does not read RA's DB cache; a made-up RA name may be real).
  PSN trophy lists only in English and Spanish. Their current streaks are set in `STREAKS` (`demo-personas.mjs`):
  reseed to bring them up to today, since a streak ends two days after the seed.
- Preview needs `NEXTAUTH_URL=https://dev.cheevovault.com` scoped to branch `develop`.
