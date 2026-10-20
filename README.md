# CheevoVault

> One place for your achievements from **RetroAchievements**, **Steam** and
> **PlayStation** — library, stats, groups, public profiles and themes.

Live at [www.cheevovault.com](https://www.cheevovault.com) · pre-production at
[dev.cheevovault.com](https://dev.cheevovault.com) · version in
[`src/lib/version.ts`](src/lib/version.ts).

---

## What it does

- **Accounts** — open sign-up (username, password, required email), password
  recovery and a soft email verification by mail, account deletion. Admin panel
  behind a second password check, with every action logged.
- **Three platforms, linked by the user**
  - *RetroAchievements* — with the user's own Web API key (never a shared one).
  - *Steam* — by custom URL name, profile link or SteamID64; the profile must be public.
  - *PlayStation* — by online ID, read through one app PSN account; PS3/Vita art from IGDB.
- **Library** — recently played, playing, want to play, completed, all games;
  filters by console/platform, hidden games, pinned games.
- **Game pages** for each platform — achievement/trophy grid with rarity,
  progress, hashes (RA), subsets, and an "Ask an AI" export of the game's
  achievements (no account data in it).
- **Stats & activity** — heatmaps, streaks, best periods, rarest unlocks,
  perfect/almost-there/abandoned games, completion distribution.
- **Groups** — named collections of games, public or private, shareable.
- **Social** — public profiles (opt-in), follow users, a following feed and
  user search, compare a game with someone else's progress. An achievement
  showcase (five earned achievements you choose) is what others see; your
  achievements to get stay yours. The Following page shows each person's last
  game, accounts, latest unlocks and showcase, and whether
  they are online or when they were last seen (each user can stop sharing it).
- **Public pages** — honest comparisons (vs Exophase, vs PSNProfiles) and
  how-tos at `/compare/*` and `/track/*`, plus a FAQ on the landing, for
  visitors and for what search engines and chat AIs read.
- **Personalization** — 25 themes (`THEMES` in `src/types/types.ts`), 9 UI
  languages (en, es, de, fr, it, ja, pl, pt, ru), country with flag.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack; auth gate in `src/proxy.ts`) |
| UI | React 19, Tailwind CSS v4, Framer Motion, Tabler Icons, Recharts |
| Auth | NextAuth.js v4 (credentials, JWT rebuilt from the DB) |
| Database | PostgreSQL on Neon, via a `pg` pool (`src/lib/db.js`) |
| Data | RetroAchievements API, Steam Web API, `psn-api`, IGDB |
| Email | Resend (REST, no SDK) |
| Hosting | Vercel, functions in `fra1`, two daily crons (`vercel.json`) |
| Tests | Jest + Testing Library |

## Getting started

```bash
npm install              # also runs `prepare`, which enables .githooks
cp .env.example .env.local
npm run dev
```

**Every variable is explained in [`.env.example`](.env.example).** The minimum
to boot is `NEXTAUTH_URL`, `NEXTAUTH_SECRET` and `DATABASE_URL`; each
integration switches itself off (and says so in the UI) when its keys are
missing:

| Without | What stops working |
|---|---|
| `STEAM_API_KEY` | Steam linking and data |
| `PSN_NPSSO` | PSN linking answers `not-configured` |
| `OPENXBL_API_KEY` | Xbox (admin-only for now) answers `not-configured` |
| `TWITCH_CLIENT_ID` / `_SECRET` | PS3/Vita games keep their trophy icon, no IGDB details |
| `RESEND_API_KEY` (+ `EMAIL_FROM`) | Password recovery and verification mail — see `CLAUDE.md` → Email |
| `CRON_SECRET` | The cron routes refuse to run |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `/privacy` has no contact address (required before going public) |
| `NEXT_PUBLIC_GA_ID` | No analytics and no cookie banner (that is fine) |

### Database

Run every file in [`migrations/`](migrations) in order on a fresh database:

```bash
for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

> `develop` and production share one database. Never run a destructive
> migration "just to try it" on develop.

### Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm test` | Jest |
| `npm run lint` | ESLint (`react-hooks/set-state-in-effect` is an error) |
| `npm run build` | Production build |

## Project layout

```
src/
  app/            routes (App Router) and API handlers (app/api/**/route.ts)
  components/     one folder per component, kebab-case/PascalCase.tsx
  context/        React contexts (library data per platform, theme, language…)
  hooks/          every custom hook (useXxx.ts)
  lib/            server code: auth, DB, RA/Steam/PSN/IGDB clients, caches, email
  utils/          pure transforms and helpers
  translations/   one file per language
  types/          shared types and constants
migrations/       numbered SQL migrations
docs/             internal docs — start at docs/README.md
```

A longer map with the data flow is in [`docs/architecture.md`](docs/architecture.md).

## Contributing

Short version — the full rules are in [`CLAUDE.md`](CLAUDE.md) → Git:

- Branch `<type>/<slug>` from `develop`, PR into `develop`, then `develop` → `main`.
- Conventional Commits in English (`feat(steam): …`), enforced by `.githooks/commit-msg`.
- The `pre-commit` hook bumps the patch version; minor/major is a manual `chore(release)`.
- `npm test`, `npm run lint` and `npm run build` pass before a PR.
- New user-facing strings go in every file under `src/translations/`.
- **Write down what you did** in [`docs/worklog.md`](docs/worklog.md), and
  update `CLAUDE.md` when a rule or invariant changes.

## Documentation

| File | For |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Rules and invariants: auth, email, admin, each platform, git. Read before touching any of them. |
| [`docs/README.md`](docs/README.md) | Index of internal docs |
| [`docs/architecture.md`](docs/architecture.md) | How the code is laid out and how data flows |
| [`docs/worklog.md`](docs/worklog.md) | What each session did, why, and what it left open |
| [`/privacy`](src/app/privacy), [`/terms`](src/app/terms) | Public policy; change them when data handling changes |
