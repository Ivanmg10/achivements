# Achievements Tracker

> A personal RetroAchievements companion — track your games, logros, and hardcore progress in one place.

---

## Features

### Dashboard
- **Recently played** as default view — expandable game cards with achievement grids
- **In progress** panel — games sorted by last played date
- **Want to play** and **Completed** lists
- **Stats & Activity** — heatmap, mastery list, console breakdown, almost-there tracker, console completion averages
- **Groups** — custom game collections with per-item progress tracking and background sync

### Progress bars
- Unified dual bar (blue = softcore, yellow = hardcore) across the whole app, same style as RetroAchievements
- Per-game softcore and hardcore percentages tracked separately where the API provides both

### Game info page
- Blurred title screen as section background
- Game hashes modal — REDUMP / NO-INTRO / TOSEC labels, one-click MD5 copy, patch links
- Direct link to the game's RetroAchievements page
- Achievement grid with tooltip, type badges (progression / win condition / missable), softcore/hardcore ring indicators

### Groups
- Create up to 4 named groups with emoji or image icon
- Per-game logros and points tracked, synced from recently played and fetched in background for unplayed entries
- Add games from your completed list; reorder via drag-and-drop
- Public / private visibility toggle

### Other
- 8 themes
- English / Spanish i18n
- Search across your library
- Streak counter

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
- [ ] Mobile / tablet responsive pass
- [ ] Push notifications for new achievements
