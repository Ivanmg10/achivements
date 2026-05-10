# Achievements Tracker

> Multi-user RetroAchievements companion — track games, logros, and hardcore progress with rich stats, custom groups, and full personalization.

---

## Features

### Authentication
- Email / password login and registration
- Optional invitation code on sign-up
- RetroAchievements account linking via OAuth
- Steam account linking *(coming soon)*
- Admin panel for admin users

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
NEXTAUTH_URL=
NEXTAUTH_SECRET=
DATABASE_URL=
RA_API_KEY=        # your RetroAchievements API key
```

Run migrations in order before first boot:

```bash
psql $DATABASE_URL -f migrations/001_initial.sql
psql $DATABASE_URL -f migrations/002_groups.sql
psql $DATABASE_URL -f migrations/003_groups_ach_count.sql
psql $DATABASE_URL -f migrations/004_groups_ach_count.sql
psql $DATABASE_URL -f migrations/005_groups_pts.sql
```

---

## Roadmap

- [ ] Steam integration
- [ ] Public user profiles
- [ ] Group hardcore achievement tracking (requires DB migration)
- [ ] Push notifications for new achievements
