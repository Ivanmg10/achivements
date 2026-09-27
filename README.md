# Achievements Tracker

> Multi-user RetroAchievements companion — track games, logros, and hardcore progress with rich stats, custom groups, and full personalization.

---

## Features

### Authentication
- Username / password login and registration, open to anyone
- Email required on sign-up — the only way to recover an account later
- Password recovery by email through Resend — **works today only for the Resend account owner, until a domain is verified (see [Email](#email))**
- Five sign-ups and five reset requests per address per hour, counted in the database
- RetroAchievements account linking with a Web API key
- Steam account linking via OpenID
- PlayStation Network *(coming soon)*
- Admin panel for admin users: search, edit, promote and delete accounts

---

### Dashboard

**Games panel** (left column, switchable views)
- **Recently Played** — default view; expandable game cards with full achievement grids
- **Playing** — in-progress games sorted by last played date
- **Want to Play** — wishlist preview
- **Completed** — finished games preview

**Profile sidebar** (right column)
- RA stats: member since, hardcore / softcore / true points, hardcore ratio %, contributions and achievements created, global rank
- Steam profile *(coming soon)*

**Stats & Activity section** — scrollable card grid:

| Card | What it shows |
|---|---|
| Points Stats | Total hardcore + softcore points, global rank |
| Activity Heatmap | 7-day achievement calendar |
| Daily Achievements | Line chart — last 7 days |
| Groups | Quick access to created groups |
| Most Active Games | Top 3 games (last 30 days) |
| Rarest Recent Unlocks | Achievement rarity stats |
| Abandoned Games | Games idle for extended periods |
| Perfect Games | 100% completed games |
| Almost There | Games at 75–99% completion |
| Mastered & Awards | Mastery badges and special awards |
| Best Performance | Best week / month / year + yearly heatmap |
| Console Navigation | Click-through to console-filtered views |
| Pinned Achievements | Manually favorited achievements |

---

### Game Library Pages
- **All Games** — global view of all tracked games across every status
- **Want to Play**, **Playing**, **Completed** — dedicated category pages
- Console filtering on every category page
- Softcore / hardcore completion toggle on Completed view

---

### Game Info Page
- Blurred title screen as section background
- Achievement grid — rarity %, hardcore / softcore unlock counts, earned date, ring indicators (gold HC / blue SC)
- Achievement type badges: progression, win condition, missable
- Game subset selector for DLC / multi-version games
- Parent game navigation
- Game hashes modal — REDUMP / NO-INTRO / TOSEC labels, one-click MD5 copy, patch links
- Direct link to RetroAchievements page

---

### Groups
- Up to 4 named groups with emoji or image icon + optional description
- Public / private visibility toggle
- Per-game achievement count and points tracked, synced in background
- Add games from completed list; reorder via drag-and-drop
- Filter group games by console, completion % (not started / in progress / completed), release decade (80s–20s)
- Shareable public group URLs

---

### Modals & Dialogs
- **Achievement detail** — icon, points, earned date, rarity, favorite/pin toggle, missable warning
- **Day Achievements** — all achievements earned on a selected date
- **Game Hashes** — emulator ROM identifiers
- **Search** — query-based library search or direct Game ID entry, multi-select
- **Group create / edit** — title, description, icon, visibility, initial game selection
- **Edit profile** — username, email, avatar URL with preview
- **Change password**
- **Language selector**
- **Location / country picker** — with flag emoji
- **Theme picker**
- **RA login** — connect / disconnect RA account

---

### Progress Bars
- Unified dual bar (blue = softcore, yellow = hardcore) across the whole app
- Per-game softcore and hardcore percentages tracked separately

---

### Personalization
- 8 color themes
- 9 UI languages: English, Spanish, German, French, Italian, Japanese, Polish, Portuguese, Russian
- Country / region with flag display
- Persistent preferences stored per user

---

### Search
- Global game search across full library
- Filter results by status and console
- Direct Game ID lookup

---

### Streak Counter
- Tracks consecutive days with at least one achievement earned

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth.js |
| Database | PostgreSQL (via `pg` pool) |
| Styles | Tailwind CSS v4 |
| Animations | Framer Motion |
| Icons | Tabler Icons |
| Data | RetroAchievements API |

---

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required env vars:

```
NEXTAUTH_URL=           # also used to build password-reset links
NEXTAUTH_SECRET=
DATABASE_URL=
STEAM_API_KEY=          # Steam Web API key, for the Steam integration
```

Optional:

```
RESEND_API_KEY=         # see Email below — without it, password recovery stays off
EMAIL_FROM=             # e.g. CheevoVault <no-reply@yourdomain.com>
REGISTRATION_OPEN=false # closes sign-ups; registration is open when unset
```

Run every migration in `migrations/` in order before first boot:

```bash
for f in migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

> `011_drop_sourceless_game_keys.sql` is the exception: only run it once the
> Steam branch is deployed, since the old constraints are what the previous
> code relies on.

---

## Email

Password recovery sends one message through [Resend](https://resend.com), over
their REST API (no SDK). Everything is wired up: request form, hashed
single-use token, reset page.

**What works depends on what is set:**

| Env | What happens |
|---|---|
| Nothing | `POST /api/auth/forgotPassword` answers `503 { error: 'email-not-configured' }` and the UI says so. No message is sent, none is promised. |
| `RESEND_API_KEY` only | Sends from Resend's shared address. **Delivers only to the Resend account owner's own address** — enough to try the flow end to end, useless for other people. |
| `RESEND_API_KEY` + `EMAIL_FROM` on a verified domain | Delivers to everyone. This is the finished state. |

**To reach everyone:**

1. Verify a domain (or a subdomain, e.g. `mail.yourdomain.com`) in Resend and add
   the DNS records it asks for.
2. Set both variables and redeploy:

   ```
   RESEND_API_KEY=re_xxxxxxxx
   EMAIL_FROM=CheevoVault <no-reply@yourdomain.com>
   ```

3. Make sure `NEXTAUTH_URL` is the public URL — the reset link is built from it.

No code change is needed; the sender is read from the environment.

| Piece | Where |
|---|---|
| Sending | `src/lib/email.ts` |
| Tokens (hashed, one hour, single use) | `src/lib/passwordReset.ts` |
| Request / reset endpoints | `src/app/api/auth/forgotPassword`, `src/app/api/auth/resetPassword` |
| UI | `src/components/forgot-password-modal`, `src/components/reset-password-form`, `/resetPassword` |
| Table | `migrations/016_password_resets.sql` |

**Not done yet:** email verification. When a domain is in place, the plan is a
soft one — the account works straight away and an unverified address only earns
a banner, never a locked door.

---

## Before 1.0

- [ ] **Verify a domain in Resend and set `EMAIL_FROM`.** Password recovery
      currently only reaches the Resend account owner; everyone else would lose
      their account on a forgotten password.
- [ ] `NEXTAUTH_URL` pointing at the public URL in production.
- [ ] Decide on email verification (soft banner, or deliberately skipped).
- [ ] Run `migrations/011_drop_sourceless_game_keys.sql` once the Steam work is deployed.

---

## Roadmap

- [ ] Steam integration
- [ ] Public user profiles
- [ ] Group hardcore achievement tracking (requires DB migration)
- [ ] Push notifications for new achievements
