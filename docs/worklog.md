# Worklog

What each working session did, so the next one (a person or an agent) starts
with the context instead of rediscovering it. **Newest first.** `git log` says
*what* changed; this says *why*, what was tried and dropped, and what is still
open.

## How to write an entry

Add it at the top, before your last commit (so it ships in the same PR).
Keep it short — a few lines per heading; leave out a heading with nothing in it.

```md
## YYYY-MM-DD — <short title> (`<branch>`)

**Did** — what changed, at the level of features or files, not every line.
**Why** — the problem or the user's request.
**Decisions** — choices made and the reason; what was rejected and why.
**Open** — what is left, known bugs, follow-ups, things to check on the preview.
**Watch out** — anything surprising the next person would trip on.
```

Facts that must keep holding go in `CLAUDE.md`, not here; an entry can say
"added X to CLAUDE.md".

---

## 2026-10-20 — Achievement showcase, and "achievements to get" (`improvements_11`)

**Did** — Split what used to be "pinned achievements" in two (rules in CLAUDE.md → Achievement
showcase):
- **Showcase** ("Vitrina de logros"): `migrations/039_showcase_achievements.sql`, **applied to
  the shared Neon database 2026-10-20**; `/api/showcase`; `useShowcase` + `ShowcaseProvider`;
  a block on top of the Pinned section (5 slots, drag to reorder, × to remove, "+" opens
  `ShowcasePickerModal` with the year's unlocks from every platform); `ShowcaseToggleButton` in
  the RA and Steam/PSN/Xbox detail modals, only on earned achievements and only on your pages.
  The public profile, Following cards and the home's friend cards show it.
- **Achievements to get**: the old pinned achievements, renamed in all 9 languages
  ("Logros por conseguir"; the 📌 is now "pin as a goal"). Now private: `/api/favorites` GET
  ignores `?user=`; the public profile no longer shows them, so `MainPageFavorites` and its
  four per-platform rows were deleted (the unpin button stays, the Pinned tiles use it).
- Following card: the latest unlocks are now the large row ("Latest unlocks", or "nothing
  earned lately"), the showcase small at the foot.
- `RecentAchievement.Key` (Steam apiname, PSN trophy id, Xbox id) on the mapped unlocks.
- `/privacy`: the public profile shows the showcase, never the goals (9 languages, dated 20 Oct).
**Why** — The user wanted the "pins" on Following to be a showcase of earned achievements,
apart from the goals, and the recent unlocks to lead the card.
**Decisions** (the user's) — the showcase is managed in the Pinned section (they may move it
to Preferences later); added from a button on each earned achievement *and* a picker; the
public profile shows the showcase, not the goals; the goals are "Logros por conseguir".
Mine: a new table with one shape rather than a flag on `pinned_achievements` (different
meaning, no per-platform snapshot to decode); the button only in the detail modals (one place
per platform family) rather than on every row; the picker reads the year's unlocks already
loaded for the streak, so older achievements are added from their game page.
**Checked** — in the browser with the real account: added one from the picker, saw the tile
and the toast and the public profile section, then removed it (the showcase is empty again).
The Following card with mocked follows.
**Open** — "Earned" is trusted from the client (see `parseShowcaseEntry`). Steam/PSN/Xbox
unlocks added from the picker have no description (the feed does not carry it); from the
modal they do. A pinned goal that gets earned is not moved to the showcase automatically.

## 2026-10-20 — Presence everywhere another user shows (`improvements_11`)

**Did** — The green dot and "online / seen …" now follow every picture of another user, not
only the Following cards. Shared pieces: `presenceColumns()` (`src/lib/presence.ts`, the SQL
rule, now used by the follows overview, `/api/users/search` and `findPublicUser`),
`PresenceDot` and `PresenceLabel` (components). Placed in: Following hero faces, `UserSummary`
(search results, the home's friend cards), the public profile hero (dot + line under the name,
not on your own page), compare, someone's game page banner, the friends leaderboard and shared
games. `/privacy` and the switch now say *signed-in users* see it (9 languages).
**Why** — The user asked for the dot next to every online person's picture, and "last seen"
everywhere else.
**Decisions** — The dot speaks to screen readers (`announce`) only where no text beside it
says so. Your own picture never gets it. Recent users in the search (kept in the browser)
have no presence: they are not read from the server.
**Open** — Nothing refreshes it while a page stays open (only on load).

## 2026-10-19 — Online status and "last seen" (`improvements_11`)

**Did** — Presence on the Following cards. `migrations/038_user_presence.sql`
(`users.last_seen_at`, `users.show_presence` default true), **applied to the shared Neon
database 2026-10-19**. `usePresenceHeartbeat` (via `PresenceHeartbeat` in `MainProviders`)
posts `/api/presence` while the tab is visible; the route writes at most once a minute.
`/api/follows/overview` returns `online` (seen < 5 min) and `lastSeenAt` (rounded to 5 min),
both only for who shares it. The card shows a green dot and "Online", or "Seen 3 h ago" /
"over a month ago", in place of the bio (`presenceOf` in `src/utils/friends.ts`); the hero
says "n online now". A "Show when I am online" switch in Preferences → General
(`showPresence`, same path as `profilePublic`). `/privacy` explains it, in 9 languages,
dated 19 October 2026. Rules in CLAUDE.md → Presence.
**Why** — The user asked for it; analysis and proposal first, then their choices.
**Decisions** (the user's) — visible by default with an opt-out; not reciprocal; the status
replaces the bio. A heartbeat only while visible rather than writing from the session, so a
tab in the background does not count and no read path writes. Online is decided on the
server, so the client's clock does not matter.
**Checked** — in the browser: two beats on arrival (Strict Mode in dev), one row written;
the card states and the switch with mocked follows.
**Open** — what comes next is the user's call (CLAUDE.md roadmap): Steam "playing now" in
one call for everyone, an "online" filter, refreshing without reloading, the public profile.
**Watch out** — Any database without migration 038 breaks every signed-in request.

## 2026-10-19 — Following page restyled, room for rankings (`improvements_11`)

**Did** — `/following` was a plain list of names. Now (`FollowingPage`):
- `FollowingHero`: the title on a wash of the theme's accent, how many people you follow and
  a stack of their avatars (+N).
- `FollowingRankingsTeaser` beside it: "Rankings · Coming soon" with an empty podium. Not a
  link yet; when the rankings page exists, this card becomes its link.
- `FollowingToolbar`: search by name and a chip per platform (only those someone has, with
  counts; `aria-pressed` plus a check, not colour alone). Platforms are multi-select and add
  up: two chosen leave who has **both** (people link several accounts); "All" clears them.
  Filtering is `filterFollowing` in `src/utils/friends.ts`.
- Each person is a `FollowingCard` (design "A2", iterated with the user on a canvas of five
  variants): a banner with the **last game played** (`FollowingCardBanner`: blurred, a Steam
  header a little and an icon a lot; without one, the avatar colours via `UserProfileBanner`), who they are,
  a chip per linked account with the name it goes by (`FollowingCardPlatforms`; the overview
  now returns `accounts`, the names the public profile already shows, Xbox's only to an
  admin), and up to **5 pinned badges** whose tooltip says game, name and description
  (`FollowingCardBadges`, size `md`). At the foot, beside the groups, their last 5 unlocks in
  the same row at size `sm` (`recentAsBadge` puts an unlock in a pin's shape). Favourite games
  were dropped from the card on the user's choice.
- The page now reads `useFriendsData(true)` (the home Friends section's hook): the overview
  for everyone, and the platforms' games for the newest `DETAIL_LIMIT` (10) follows, from which
  `lastPlayedGame` (`src/utils/friends.ts`) picks the newest; RA has no play date, so its latest
  unlock stands in. `useFollowing` is gone. The overview now returns 5 pins with a
  `description` (a secret Xbox one not yet earned keeps it hidden); the home card shows 3.
- Fixed in `useFriendsData`: a page that wants it from its first render never loaded in dev
  (Strict Mode ran the effect twice; the guard skipped the second run). Tested under StrictMode.
New `T.following` keys in all 9 languages.
**Why** — The user found the page boring and wants it ready for a rankings system that will
have its own page.
**Decisions** — Last played costs platform calls (cached, the same as the home section), so
only the newest 10 follows get it and their latest unlocks; the rest show their avatar colours
and no unlocks. Storing it in the DB
when each user loads their own library was proposed, not done. The rankings themselves were
not started: only the place they open from.
**Open** — Online status / "last seen" (the line where the bio is now) is in the CLAUDE.md
roadmap: ask the user first. "1 grupos públicos" (no singular form). `GET /api/follows` has no
client left (POST/DELETE still used by `useFollow`); kept with its tests, can go.

## 2026-10-17 — Recently played skeleton fills its card (`fix/recent-skeleton`)

**Did** — The loading rows of "Recently played" (`RARecentlyPlayed`) sit in a
`home-fit-scroll` list and grow (`flex-1`) like the loaded rows, which share the card's
height (`ROW_STYLE` and the `.home-fit-scroll > *` rule in `globals.css`).
**Why** — The skeleton rows kept their natural height: an empty band under them, and
the list jumped when it loaded (seen by the user).
**Watch out** — The list waits for every linked platform. On 2026-10-17 `api.xbl.io`
did not answer from the dev machine (connection timeout after ~11 s, while the rest of
Cloudflare answered), so for an admin with Xbox linked the skeleton stayed ~12 s.
`xboxCall` has no timeout of its own and a failure is not cached, so every visit waits again.

---

## 2026-10-17 — Public comparison/how-to pages and a landing FAQ (`feat/seo-public-pages`)

**Did** — Four public pages: `/compare/exophase`, `/compare/psnprofiles`,
`/track/retroachievements-steam-playstation`, `/track/achievements-with-friends`
(`SEO_PAGES` in `src/translations/seoPages.ts`, `SeoPage`, `SeoPageRoute`), each
with a FAQ shown and sent as `FAQPage` JSON-LD. A five-question FAQ on the landing
(`T.landing.faq`, 9 languages) with its JSON-LD on the home page. The landing's
closing card and footer became `LandingClosing` and `PublicFooter`, shared with the
new pages; the footer links every public page (`PublicPageLinks`). Sitemap lists them
with their `updated` date; the proxy lets `/compare/` and `/track/` through.
**Why** — The user saw a post about a SaaS getting half its sign-ups from ChatGPT
recommending it off comparison posts. Before this, only 4 pages were public, so
neither Google nor an AI had anything to read about what the app does.
**Decisions** — Page prose in en/es only and outside `T`, since `T` is in every
page's bundle (CLAUDE.md, "Public pages"). Sitemap's `priority`/`changeFrequency`
left as they were: Google ignores them; what helps is more public pages.
Comparisons are honest about where the other site wins. The FAQ is an accordion
(`FaqListItem`, framer-motion height + fade, numbered, accent bar and a + that turns
into ×); the answer stays mounted while closed (height 0, `inert`) instead of using
`ExpandPanel`, which unmounts it, so every answer is in the HTML crawlers read.
**Open** — Claims about Exophase (platform list, leaderboards) and PSNProfiles
(guides, leaderboards) are from memory; their sites refuse automated reads, so the
user should confirm them. Google Search Console / Bing Webmaster Tools not set up
from here (dashboard work). Sign-ups are not tagged with their origin
(`utm_source=chatgpt.com`), so whether this works cannot be measured yet.
**Watch out** — Google shows FAQ rich results only for a few authority sites since
2023; the JSON-LD is still read (Bing, AIs), but do not expect FAQ snippets.

---

## 2026-10-17 — Checked in a real browser at 375 / 768 / 1440 px (`improvements_10`)

**Did** — Walked the main page (Ezio collection card, Activity, Pinned, Collection,
Following) in Playwright, signed in by the user, at phone, tablet and desktop widths;
no horizontal scroll at any. Fixed what showed: the month labels broke mid-word on a
phone (now hyphenated), the total play time split from its "h", best performance ran
the whole width between 1280 and 1535px (now beside play habits from `xl`), and the
weekday labels of the habits chart were cut at half width.
**Watch out** — Cards fade in on scroll (`ChartCard`'s `whileInView`): an element
screenshot of a section not scrolled through shows them blank. Reordering was not
tried in the browser, since it would save to the shared (production) database.

---

## 2026-10-17 — Collection made shorter; Following without an empty column (`improvements_10`)

**Did** — Collection: "Your numbers" (`CollectionNumbers`) is a strip across the page
under the last five completed — total play time beside its heading, then one tile
per platform side by side (4 columns from `2xl`, 2 below) — instead of a column ~700px
tall beside a collection grid of ~250px. The bars keep their counts; only the
repeated "completion distribution" heading is dropped (`CompletionDistribution`
`showTitle`). "Closest to perfect" moved to its own `CollectionClosest`, beside the
collection grid (same height); with nothing near 100% it renders nothing and the grid
takes the row (`xl:last:col-span-3`). Following: with nothing unlocked lately (and
done loading), the feed card stretches to the height of the column beside it
(`xl:self-stretch`, not sticky) with its "Nothing unlocked these days" centred,
instead of a short card over an empty column. (Hiding it was tried first; the user
wanted it shown.)

---

## 2026-10-17 — Pinned achievements and games can be reordered (`improvements_10`)

**Did** — In the Pinned section each tile has a grip (`MainPagePinnedSectionSortable`
+ `MainPagePinnedSectionSortableItem`, dnd-kit, pointer and keyboard). Achievements:
`migrations/037_pinned_achievements_position.sql` adds a nullable `position`;
`GET /api/favorites?source=all` returns the row `id` and orders by
`position NULLS FIRST, created_at DESC`; `PUT /api/favorites { order: [ids] }` saves
it (only the user's own rows); `usePinnedAchievements().reorder` is optimistic and
rolls back with a toast. Games reuse `PUT /api/pinnedGames`; the context's `reorder`
now also puts the old order back when the save fails.
**Decisions** — NULL position = never placed, shown first, newest first: a list nobody
reordered reads as before, and a pin made after a reorder appears on top.
**Watch out** — **Run migration 037 before this code runs against a database**: the
pins query orders by `position`, so without the column every pinned-achievements read
(main page, Pinned section, public profile) answers 500. Additive, safe to run first.
Applied to the shared database (production, which develop and local use) on
2026-10-17, with the user's go-ahead: 9 existing pins, all with no position yet.

---

## 2026-10-17 — Pinning no longer scrolls the page up (`improvements_10`)

**Did** — The four game tables (RA, Steam, PSN, Xbox) put pinned achievements first.
Pinning one moved its row to the top with the focused star in it; React then gave
the star its focus back, and `focus()` scrolled the page up to it. Each favourites
hook now also returns the pins as they loaded (`leading` / `leadingIds`), and the
tables order by that: a row pinned now stays where it is (still highlighted), and
leads the list the next time the page opens.

---

## 2026-10-17 — Pinning a PSN trophy answered 500 (`improvements_10`)

**Did** — `POST /api/favorites` for PSN listed `xbox_achievement_id` among its insert's
columns (8 columns, 7 values), so Postgres refused every PSN pin. Removed; a test now
checks, for each of the four sources, that the insert names as many columns as it
gives values (it fails on the old line).
**Why** — Slipped in with the Xbox data layer (`06be25b`); the route tests mock the
pool and only compared parameters. Never reached `develop` or `main`.

---

## 2026-10-17 — Stats & Activity: the Activity tab reworked (`improvements_10`)

**Did** — Three new cards, all read from the year of unlocks the streak already loads
(`useStreakData`: every platform, hidden consoles left out, no new call):
"This month vs last" (`MainPageMonthCompare`: achievements, games played, active
days, month-to-date against the same days of last month), "Play habits"
(`MainPageHabits`: bars by weekday and by hour of the day, the busiest day and three
hours in full accent and written out; a weekday × hour heatmap was tried first and
the user did not like it) and "Activity diary" (`MainPageJournal` +
`MainPageJournalDay`: the last 4 days with unlocks and their games). Logic in
`src/utils/activityInsights.ts`. Existing cards polished: "Most active" rows carry a
bar against the busiest game, "Abandoned" rows a progress bar (`GameListRow` got
`share` and `progress`). Order (2026-10-17, after seeing it): the month across the
top; habits (3/4) beside best performance (1/4), two cards of the same height; then
the four lists in one row (most active, diary, abandoned, rare) — 4 columns from
`2xl`, 2 by 2 below. The diary shows 3 days of at most 2 games, as tall as the
lists beside it. The pinned achievements left Activity (goals, not activity) for a
section of their own in the rail, "Pinned" (own page only; on a public profile they
stay in the showcase) — under Collection's numbers they went unseen. Best month opens
its days in `PeriodAchievementsModal` like the day and week do, instead of unfolding
and stretching the row. `GameListRow`'s icon is decorative (`alt=""`, grey behind it):
with the title as alt, a broken icon printed the name inside its 28px box.
The Pinned section was then redesigned (`MainPagePinnedSection`): the pinned
achievements are its lead — a heading with "n of total earned" and its bar, then
each as a tile (badge large with the platform in its corner, name, description, game,
earned/locked with an icon, points/grade/gamerscore, rarity); `pinnedView`
(`src/utils/pinnedView.ts`) puts the four platforms in one shape. Under them, the
pinned games as compact tiles (icon, platform, progress), resolved through
`useProfileLibrary`; the full cards with drag-to-reorder stay in Recently played's
pinned view. `MainPageFavorites` (the list) is still what the public profile's
showcase uses.
**Why** — The user asked to polish the section and add something; they picked these
three from four ideas (a per-platform split of unlocks was left out).
**Decisions** — Unlock dates are UTC on every platform; the habits, month and diary
count them in the browser's local time (`unlockTime`), or an evening in Madrid would
show two hours early. The month compares the 1st–17th with the 1st–17th, not half a
month against a whole one. Today/yesterday come from `Intl.RelativeTimeFormat`, weekday
and month names from `Intl.DateTimeFormat`, so only 9 strings were added per language.
**Open** — Not checked in a browser (every route needs a session).

---

## 2026-10-16 — RA missables marked in the badge grid; library backdrop band (`improvements_10`)

**Did** — `AchievementGrid` (the main page's opened RA card, the library's detail
panel, group cards) rings an unearned missable in red with a small warning triangle
in its corner, says "Missable" in its accessible name, and heads the grid with
"⚠ Missable left: N". `LibraryDetailBackdrop` is now `overflow-hidden`.
**Why** — The user wanted missables visible at a glance outside the game page.
The library panel showed a hard horizontal band across "Activity in this game": the
backdrop's art is `scale-110 blur-lg`, and what spilled past the bottom of its 30rem
box was outside the fade to `bg-card`, so the art's (dark) bottom edge showed cut off.
**Decisions** — Earned missables are left alone (nothing left to lose). The triangle
is there so the mark does not rely on colour alone.
**Open** — Not checked in a browser. The PSN work below was carried onto this branch
uncommitted from `feat/xbox-integration`; the branch name was chosen by the user.

---

## 2026-10-16 — PSN collections: one card in the recent feed (`feat/xbox-integration`)

**Did** — `withPlayData` gives a collection's last session only to the trophy set with
the newest trophy; the others keep their trophy date. Each game now carries its
`collection` (`PsnCollection` in `types/psn.ts`), and "Recently played" folds a
collection's games into one card (`psnFeed` in `utils/steamFeed.ts`,
`PsnCollectionItem`): its name, store icon, session, hours and summed trophies.
Opened, it looks like an opened game (`PsnCollectionExpanded`, trophies of every game
loaded at once by `usePsnCollectionTrophies`): ring, chart and rarest across the
collection, each game a fold of its trophies like BO2's DLC; the rarest link to
their own game (`PsnRarestTrophies` takes a `gameId` per trophy). Cache
`psn:titles:v10` → `v12`.
**Why** — Only Brotherhood was played, yet AC II showed in "Recently played" on
16 Oct with 76 h. Measured 2026-10-16: the played list has one entry, *The Ezio
Collection* (`CUSA04893_00`, 75 h 43 min, last session 16 Oct), and it maps to both
sets (`NPWR11436_00` Brotherhood, last trophy 6 Oct; `NPWR11435_00` AC II, last trophy
2 Apr 2025). The session was stamped on both.
**Decisions** — The user chose to fold only in the feed, with stats counting per
trophy set as before (each game keeps its platinum); a collection page with its games
as DLC-like sections was weighed and left out, since pins, groups, favorites and URLs
are all per set. The per-set session rule alone was not enough: opening AC II without
earning a trophy would still credit Brotherhood, and Sony gives nothing to tell them
apart. The hours stay on every game's own page (the total counts them once through
`playedAs`).
**Open** — The library lists (categories, explorer) still show each game apart, on
purpose: each completes on its own. Revelations is missing from the Ezio card: never
started, so Sony has no trophy list for it (the set lookup for `CUSA04893_00` returns
only AC II and Brotherhood). Not checked in a browser.
**Watch out** — Sony's `lastUpdatedDateTime` for AC II is 2026-09-20 though its last
trophy is from 2025: it moves without a trophy, so AC II still sorts at that date.

---

## 2026-10-16 — PSN icons: Sony's square store icon, not the PS4 trophy banner (`feat/xbox-integration`)

**Did** — PSN games now take their icon from the played-games list (`imageUrl`, else
`MASTER`) instead of the trophy set's (`withPlayData`, `psnClient.ts`); the cover is
only `PORTRAIT_BANNER`, and `GAMEHUB_COVER_ART` moved to the backdrop list. `GameIcon`
shows PSN icons with `object-contain`. A blurred copy filling the bands was tried and
dropped: the user preferred the plain bands. Cache key `psn:titles:v9` → `v10`.
**Why** — PS4 icons looked bad: measured 2026-10-16 on a real account, a PS4 trophy
set's `trophyTitleIconUrl` is a 320×176 banner (PS5's are 512×512), cropped to a
square ("SSASSIN CREED"). The played-games `imageUrl` is square (512/1024) on PS4 too.
On the game page the "cover" of a PS4 game was its 16:9 hub art cropped to 2:3.
**Decisions** — A collection (Ezio Collection → AC II, Brotherhood…) keeps each
game's trophy icon, letterboxed, rather than the same collection icon on every game.
PS3/Vita and games with a hidden played list also keep the (letterboxed) trophy icon.
**Watch out** — Pins and group items store `image_icon` at pin time; they show the
live library's icon when it is loaded, the stored one otherwise.

---

## 2026-10-16 — The "13 optimizations" (`feat/xbox-integration`)

**Did** — The roadmap's "13 optimization fixes" were never itemised, only named
(stampede, Cache-Control, duplicate fetches, TTLs, error boundaries, lazy images),
so each area was audited and what was real got fixed. Server stampede,
indexes and TTLs were already fine. Fixed: (1) `fetchWithRetry` shares one request
per URL in flight (the awards were asked for by 6 components); (2) `fetchShared`
does the same for the 12 PSN/Steam/Xbox hooks that use `fetch`; (3, 4) recharts
(~390 KB, in every page that had a chart) loads lazily behind the two plots;
(5) the account page's 9 modals and the admin panel load when first opened;
(6) the header's search and mobile menu, the group, pin and password-reset modals
too (`LazyWhenOpened`); (7) PSN and Xbox reads (6 routes) now send `Cache-Control`
like RA's and Steam's; (8) 7 context values are memoized; (9) hero images decode
async at low priority, admin avatars lazy; (10) `(auth)` got an error boundary
(`RouteError`, shared with `(main)`). Rules in `CLAUDE.md` ("Performance rules").
**Decisions** — Notifications stay a to-do the user wants to expand before it is
built (written in the roadmap). No change to the database.
**Open** — Not measured in a browser (no Lighthouse run): the evidence is that the
recharts chunk is now only in the `react-loadable-manifest`s, not eagerly loaded.
A first opening of a lazy modal costs one small download; if that is felt, preload
it on hover of its button.
**Watch out** — Tests of anything that opens a lazy modal wait for it (`findBy…`).

---

## 2026-10-16 — Platform failures audited, play time, feeds, preferences on the account (`feat/xbox-integration`)

**Did** — (1) Audited how each platform reports "unknown / private / key refused /
busy" and wrote the table in `CLAUDE.md` ("How each platform fails"). Fixed what
was wrong: RA's refused key was a retried 503 (now `403 ra-key-invalid` + a notice),
a Steam profile made private after linking showed as empty (now `403 private`),
Xbox private libraries are detected (measured: `titles: []` and no
`achievementSummary`). (2) Total play time on the Xbox cards and across Steam/PSN/Xbox
in the collection numbers. (3) The consoles unticked in preferences now also leave
the feeds, the streak, the heatmap and the charts (`useConsoleVisibility`).
(4) Preferences follow the account: `migrations/036_user_preferences.sql`,
`/api/preferences`, `usePreferencesSync`, a fixed list of keys. Privacy text updated.
**Why** — The user asked for all of the above, and not to open Xbox to everyone yet
(OpenXBL's free plan, 150 calls an hour, would not hold it; recorded in `CLAUDE.md`).
**Decisions** — Xbox stays admin-only until the user decides to pay for a plan.
Preferences stay in the browser too (instant, works signed out) and mirror to the
account; the account wins on sign-in.
**Open** — `migrations/036` was run on the shared database on 2026-10-16, with the
user's OK (`develop` shares the production database). Without the column
`/api/preferences` answers 500 and every preference change toasts an error.
**Watch out** — A new feed of unlocks must filter through `useConsoleVisibility`.

---

## 2026-10-16 — Library layout remembered; tooltips that fit; concealed tiles (`feat/xbox-integration`)

**Did** — (1) The library's Shelves / List / Cards choice is now saved in the
browser (`library-layout` in `useLibraryPrefs`, one choice for every category) and
the list opens on it; it used to go back to shelves on every visit and category.
A search typed on the shelves still moves to the list, but only while it is
there and without overwriting the saved choice. (2) Achievement/trophy
tooltips ran off the right edge on the last badges: `tooltipStyle` (new util)
flips them left/up when they would not fit, in the four grids (RA, Steam, PSN,
Xbox). (3) Secret achievements/trophies showed as an empty dark square that
looked like a broken image; `ConcealedBadge` puts a question mark in it (Xbox
and PSN grids). The three blanks in Guitar Hero III were its three secret
achievements — all 59 icons exist on Xbox's CDN.
**Decisions** — Saved in the browser like the other library prefs, not in the DB.
**Watch out** — The saved layout is read after hydration, so the first paint is
the default for a moment.

---

## 2026-10-16 — Xbox gaps against PSN: public profile, play time, backdrop, privacy (`feat/xbox-integration`)

**Did** — An audit of PSN-only code found and closed: (1) `useProfileLibrary`
ignored Xbox, so public profiles and friend comparisons had no Xbox games;
(2) play time: one `POST player/stats` inside the library load, shown in every
card/header/detail/group row like PSN's and in the AI export; (3) a wide
backdrop for the game page from IGDB (via `/api/xbox/details`, which also got
the route test it was missing); (4) `/privacy` now covers Xbox (9 languages);
(5) gamertag on the admin user card and in the admin search.
**Decisions** — Backdrop only on the game page: enriching the whole library from
IGDB would be ~135 searches on a cold load. The marketing texts (landing, site
title, description) still list three platforms until Xbox opens to everyone.
Retro 360 games report minutes under `modernTitleId` (measured: 5 of 9 had a value).
**Open** — Private profile / unknown gamertag responses are still unmeasured.
Library cache key is now `xbox:titles:v5`.
**Watch out** — The stats call is one more OpenXBL call per library refresh.

---

## 2026-10-16 — Account preferences in tabs (`feat/xbox-integration`)

**Did** — The preferences card was one long column (it grew with every platform
and stretched the identity card beside it, leaving big empty gaps). It is now
tabs, reusing `MainPageProfileTabs`: General (theme, language, gender, public
profile, hidden games) and one per platform (favourite game + that platform's
choices + its consoles). New `UserPreferencesGeneral` and
`UserPreferencesPlatform`; the PSN/Xbox/RA preference blocks lost their own
headings (the tab names them) and the console list is always open inside its tab.
Last tab remembered in the browser. Translations: `prefsGeneral`,
`prefsTabsLabel`; the unused `*Section` headings were removed.
**Why** — The user asked to redesign that part of the account page.
**Open** — Not looked at in a browser. The identity card can still leave gaps
when it is taller than the preferences (it stretches to the row).

---

## 2026-10-16 — Choose which consoles show, per platform (`feat/xbox-integration`)

**Did** — A "Consoles" preference under RA, PSN and Xbox in the account page:
a tick per console in the user's library (with its game count). New
`consoleFilter.ts`, `useHiddenConsoles`, `UserConsolesPreference`,
`UserRaPreferences`; the three data contexts filter by it and expose `consoles`;
PSN/Xbox expose `fullLibrary` too. Strings in all 9 languages. Rules in
`CLAUDE.md` ("Consoles to show").
**Why** — The user asked for a checkbox per console, per platform, to choose
what shows.
**Decisions** — Browser storage like the other PSN/Xbox preferences (no migration
on the shared DB); it does not follow the account across devices. Stored as the
unticked names. Filter in the contexts so every list, the collection and the
stats agree. Steam skipped (no consoles). Feeds and streak left unfiltered.
**Open** — If it should follow the account or show on public profiles, it needs a
column. The home "recent achievements" still include unticked consoles.
**Watch out** — Look games up by id in `fullLibrary`, never `library`.

---

## 2026-10-16 — Xbox 360 backward-compatible games had no achievements (`feat/xbox-integration`)

**Did** — 9 of the 12 Xbox 360 games in the library (Modern Warfare 3, Black
Ops II, Skate 3, Tekken 6…) showed "This game has no achievements": they list
Xbox One/Series among their devices, so `is360` was false and the modern
endpoint (which answers them with an empty list) was used. `is360` now comes
from `mediaItemType` (`Xbox360Game`/`XboxArcadeGame`); devices only decide when
the type is missing. Cache keys bumped to `xbox:titles:v4` and
`xbox:achievements:v5` (the empty lists were cached up to 30 days).
Checked on real data: both 360 lists agree on ids, scores and icons, and the
icon URLs load for locked and unlocked ones.
**Watch out** — A 360 game costs 2 calls, so feed scans that touch many of them
spend more of the 150 calls an hour.

---

## 2026-10-15 — Xbox 360 covers, icons and partial lists (`feat/xbox-integration`)

**Did** — Fixed Xbox 360 games (seen in the browser: Guitar Hero II): the cover
and the achievement icons did not load, and only 14 of 50 achievements showed.
Covers: Xbox's plain image hosts fail over https, so `https()` in
`xboxMappers.ts` now swaps them for the `-ssl` hosts. Icons: built from
`titleId`/`imageId` in hex. List: OpenXBL's 360 endpoint returns only unlocked
achievements; the locked ones come from the other 360 endpoint, the title's
whole list (`achievements/player/{xuid}/title/{titleId}`, found in
`https://api.xbl.io/docs/json`), joined with `merge360Achievements`. A 360 game
costs 2 calls. `XboxPartialListNote` stays as a net if a list still comes up
short (all 9 languages). Cache keys bumped to `xbox:titles:v3` and
`xbox:achievements:v4`.
**Open** — Check on a real 360 game that the ring and the grid show all 50.
**Watch out** — Bump the cache version whenever a mapper's output changes: the
achievements are cached for 30 days.

## 2026-10-15 — Xbox integration 1:1 with PSN, admin-only (`feat/xbox-integration`)

**Did** — Replaced the explorer-only scope with the full PSN-equivalent Xbox
integration: link by gamertag, summary, library and categories, `/xboxGame/[id]`,
recent/year feeds, pins, favorites, groups, collection and stats, friends,
public profiles, admin linking. `'xbox'` is now a `GameSource`; migrations
033–035 (applied to the shared DB 2026-10-15, with the user's OK). Tests for the
new hooks, utils, routes and components; whole suite, `tsc`, lint and build pass.
**Why** — The user asked for "1:1 with PSN, but only available and visible to admins".
**Decisions** — One switch (`XBOX_ADMIN_ONLY`) plus server 403s, hidden UI and
filtering of other users' Xbox data. Progress by gamerscore (`totalKnown` flag)
because modern games report no achievement total. Achievements are cached by
`lastPlayed`, feed scans are capped, to live within 150 calls/hour.
**Open** — Never checked in a real browser (needs an admin login). Private
profile / unknown gamertag responses and play time (`MinutesPlayed`) are
unverified. Cold year feed can spend up to ~40 calls. Rotate the API key: it was
pasted in the chat. Several edited existing components have no new xbox cases yet.
**Watch out** — A new place that lists games or accounts must filter Xbox for
non-admins (see CLAUDE.md). Repo files are CRLF.

## 2026-10-15 — Xbox via OpenXBL, admin-only explorer (`feat/xbox-integration`)

**Did** — Analysed OpenXBL (xbl.io) against the PSN integration
(`docs/xbox-integration-plan.md`), ran the Phase 0 spike with a real key, and
built an **admin-only Xbox explorer**: gamertag → profile, library with
progress and gamerscore, and each game's achievements (rarity, unlock dates).
`src/lib/xboxClient.ts`, `src/utils/xboxMappers.ts`, `src/types/xbox.ts`,
`/api/admin/xbox` and `/api/admin/xbox/achievements`, two hooks, and
`admin-xbox/AdminXbox.tsx` + `AdminXboxGame.tsx` in the admin panel. New admin
action `xbox-lookup`. Added the Xbox section to `CLAUDE.md`, a row in
`docs/architecture.md`, `OPENXBL_API_KEY` in README and `.env.example`.
**Why** — The user wants Xbox next to RA, Steam and PSN, and asked to try it
admin-only first, with few calls, before opening it to users.
**Decisions** — No migration and no user linking: nothing is stored, so the
shared production database is untouched. Progress goes by gamerscore because
modern games report `totalAchievements: 0`. Xbox 360 stays in the library list
and uses its own achievements endpoint. `Xbox` is not added to `GameSource` yet:
that would touch ~50 files and belongs to the user-facing phase.
**Open** — What a private profile and an unknown gamertag return (needs
someone else's account); play time (`MinutesPlayed`) is proven but not wired;
the user-facing phases (link by gamertag, library pages, pins/groups/feed) are
not started and need the user's go-ahead; whether the free plan's 150 calls an
hour is enough once users link. Ask first whether to rotate the API key: it was
pasted in the chat once.
**Watch out** — OpenXBL answers errors with HTTP 200 and the code in the body,
and refuses `Accept-Language: *` (Node's fetch default). The base URL is
`https://api.xbl.io/v2/`. The first spike found the SDK's field names wrong for
the profile (it is a `settings[]` list), so trust `docs/xbox-integration-plan.md`
section 6 over the SDK.

## 2026-10-14 — Release v1.4.0 (`chore/release-v1.4.0`)

**Did** — Bumped to 1.4.0 and opened the `develop` → `main` PR. Updated the
milestones in `CLAUDE.md`.
**Why** — `main` was still on 1.2.12; `develop` had 1.3.0 plus public
profiles, follows and the Following section, which are new sections, so a
minor bump per the versioning scheme.
**Decisions** — 1.4.0 rather than shipping as 1.3.x (the user's call).
Checked before opening: `main` has nothing `develop` lacks; migrations 031 and
032 are applied (read-only query on the shared DB); no new required env var.
**Open** — Merge the release PR with a **merge commit**, then check
www.cheevovault.com.

## 2026-10-14 — README and internal docs (`docs/readme-and-agent-docs`)

**Did** — Rewrote `README.md` (it still described Next 14, Steam over OpenID,
PSN "coming soon", 8 themes and the pre-1.0 gates). Added `docs/README.md`
(index), `docs/architecture.md` (map of the code and data flow) and this
worklog. Moved the old Steam plan to `docs/archive/` with a note on what no
longer holds. Added the "Documentation — MANDATORY" section to `CLAUDE.md`.
**Why** — The user wanted the docs brought up to date, and every future agent
to leave a written record of what it did.
**Decisions** — Rules stay in `CLAUDE.md` (it is loaded into every agent's
context); the README is for people landing on the repo and points there
instead of copying the Email/Sessions sections, which had gone stale twice.
The worklog is one file, newest first, so reading the top is enough.
Then, on the same branch: a rule in `CLAUDE.md` → Pull requests that a PR is
never opened without its full description and that it is updated whenever more
commits change what it says, plus `.github/pull_request_template.md` so PRs
opened on the web start from the same template. And
`.github/workflows/pr-description.yml`, the first GitHub Action in the repo: it
fails a PR whose description is missing a section or leaves one blank.
**Watch out** — For the check to block merging it must be added as a required
status check, named `pr-description`, in a ruleset on `develop` and `main` (GitHub settings,
not code). The user created it as `pr description`, **with "require branches to be
up to date" on, by choice**: every PR now has to merge its base in before it can
merge, and `version.ts`/`package.json` will conflict when the base moved (keep the
higher version). Written down in `CLAUDE.md` → Environments. The body reaches
the script through `env`, never `${{ }}` inside `run:`, so a PR description
cannot inject shell.
**Open** — Nothing from this session.
