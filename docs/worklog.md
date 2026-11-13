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

Merges never conflict on this file: `.gitattributes` gives it git's `union` driver,
which keeps both branches' entries. It can drop the `---` between two entries
or put them in either order; that is cosmetic, fix it if you see it.

Facts that must keep holding go in `CLAUDE.md` (a rule every task obeys) or the
area doc it links to, not here; an entry can say "added X to docs/social.md".

**Archive at each release:** once a release reaches `main`, move the entries older
than it to `archive/worklog-<from>-to-<to>.md` (the first cut is
`archive/worklog-2026-09-to-11.md`, everything before v1.7.0).

---

## 2026-11-12 — The new landing: the title screen with "Fondo" (`feat/136-landing`, #136)

**Did** — Canvas page 4 ("LandH1b", "LandPagina" with "Fondo", "LandMovil"), cut from `origin/develop` (with #129–#135, #134, #114/#115 in). One commit per point:
- *Shared art wall* (`refactor(ui)`): the covers' pool moved out of `AuthCollagePanel` into `utils/artWall.ts` (`ART_WALL_RA`, `ART_WALL_STEAM`, `WALL_TILTS`,
  `dealBothPlatforms`, tested); one drawing of a cover, `cover-tile/CoverTile` (frame, tilt, lazy, low priority, hides when dead), used by the sign-in's wall too.
- *The title* (`feat(ui)`): `BrandMark size="title" logoAfter`: the name as big as the screen allows (`clamp(4.5rem, min(13vw, 24svh), 16rem)`), the logo after it,
  under it on a phone, a `<wbr>` between "Cheevo" and "Vault" so a narrow screen breaks there while the text stays one word. Specimen in `/design`.
- *The landing* (`feat(landing)`): `LandingTitle` (the platforms with `Facts`, the `h1`, the tagline, the intro and the library's `Button`s, "Qué es CheevoVault",
  a nav to the rankings, how points work and the FAQ) over `LandingBackdrop` (22 RA boxes laid as the sign-in's wall, blurred, tinted with the accent,
  `.title-drift` there and back in 48 s, `.scanlines`, a fade in `bg-main`); then `LandingLibrary` (`Tabs` that filter six example games; `LandingSampleGame`:
  `GameCardBackdrop`, a 56 px cover, `LibraryPlatformBadge`, `ProgressBar`, `Facts`; a cover grid on a phone), `LandingGroups` / `LandingGroup` (shelf art header,
  `ProgressBar`, a strip with `useScrollFade` below `lg`), `LandingStreak` (the live streak in big in its tier beside `/racha`'s own `StreakChart`, picking works),
  `LandingPoints` (`VaultLevelBadge`, `VaultPlatformSplit`, `Facts`, the link to `/rankings/how`), `LandingFaq` (open `dl`, two columns) and `LandingClosing`
  rewritten (two `CoverReel` rows going opposite ways, no card). One stop button (`ToggleButton`, `data-motion="still"` on the page) holds the drift and the
  band; reduced motion holds them and hides the button. Example data in `landing-page/landingSamples.ts`, every example under `T.landing.example`. New strings
  in nine languages: `whatIs`, `howPoints`, `pointsTitle`, `pointsText`, `example`, `stopMotion`; `platformsLead` is gone. Deleted: `LandingHero`, `LandingBento`,
  `LandingFeature` and their tests, and the hero's place on the guard's radius list.
- *FAQ list* (`refactor(ui)`): with the landing on its own open FAQ, `FaqList` lost `split`, `lead` and `numbered` (every caller left passed `numbered={false}`),
  and `FaqListItem` its `index`. `/compare`, `/track` and `/rankings/how` render as before.
- *After the owner tried it (2026-11-13)*: the example groups' band is split between their games' covers with the album card's own piece, now `groups/group-cover-strip/GroupCoverStrip` (a cover too small for its slice is drawn at twice its size at most over a blurred copy, so RA's 96 px boxes stay sharp; the real album card gets it too); the Spider-Man group became "Juegos noviembre" (`T.landing.sampleGroupNovember`) with MediEvil and a Dragon Ball Z box from RA (114756, 103756: RA icons from the wall's pool, identified by eye), Marvel's Spider-Man (Steam 1817070) and, for Skate 3 (no picture on an allowed host: Xbox 360/PS3 only, RA has no PS3), its sequel skate. (Steam 3354750, `library_hero`, 429 KB, lazy); Pokémon is Ruby, Gold, Platinum and Colosseum (RA 104260, 105481, 104787, 068145); Fallout 4 (Steam 377160, 84 achievements) replaces Spider-Man in the library rows, Black Ops II now counts its real 35; "Qué es CheevoVault" sits in the middle with a bobbing arrow (`.hint-bounce`, still under reduced motion and the stop button; the legal line hides on `short:`); each section enters as it is reached (`ui/EnterOnView`, `useEnterOnView`: `.enter-rise`, hidden only after the script has seen it below the screen; checked with JS off, reduced motion and the stop button in Chromium and Firefox).
- *The owner's third round (2026-11-13)*: each section says what the feature does in three short points led by the mark (`T.landing.libraryPoints`, `organisePoints`, `progressPoints`, `pointsPoints`, nine languages; Vault Points now name the level and the rankings, from `docs/social.md` and the guide); the FAQ rewritten in plainer words, its third question now "What do I need to connect each platform?" (RA: username and own Web API key from Settings → Keys; Steam: sign in through Steam with Game details public; PlayStation: online ID with trophies visible to anyone, from `T.psn.connectHint` / `steam.privateProfileHint`), still the one list behind the `FAQPage` JSON-LD; the backdrop has 100 covers (40 different RA boxes, repeats are free) in place of 22; `Button size="xl"` (new, smaller on a phone and on `short:`) for the title's two ways in; the way down's arrow beside its text. RA covers in the example groups stay square icons: no box art, title or in-game picture of those games is in the repo, and RA's API needs a key (not used) and its site an anti-bot check (not bypassed); the missing ones are listed in the report.
- *The owner's fourth round (2026-11-13), after an analysis of the page*: the example streak's dates move so the one going on ends today (`streaksEndingOn`, the UTC day so server and browser agree; "ongoing" had ended on 2 Nov); "Free. No paid plan." under the title's two buttons (`T.landing.free`, hidden on `short:`); a sixth question, "Who can see my profile?" (the grid of two columns had a hole; it is in the `FAQPage` JSON-LD too, being the same list); the closing band fades into the page above and below (a mask, it had hard edges); the library's example is the same list with its tabs on a phone (the owner: "as in the app itself"; the three-to-a-row cover grid of "LandMovil" is gone); the groups' paragraph is gone (`organiseText` deleted: its three points said the same) and the rankings point is one line; a language button first in the top bar (`landing-language/LandingLanguage`: the language shown by its own name, opens `LanguageModal` lazily) for a visitor whose browser guessed wrong; the stop button moved down beside the legal line, smaller. **The owner would drop the stop button; it stays** because art that moves by itself for more than 5 s needs a way to stop it (WCAG 2.2.2): told to the owner, their call if the motion goes instead. Still open from the analysis, for the canvas first: a section that shows achievements (none on the page today), a rankings example in the Vault Points card, a way in while scrolling, better art for the two groups with RA's square boxes (needs the owner's covers). Seen and not touched: on a first visit the cookie card covers the title screen's intro (both sit bottom left). A wrong finding to not repeat: the "grey" first screen was the test browser's stored theme (`app-theme` in `localStorage`), a new visitor gets `dark`; check `localStorage` or use a fresh context before judging colour.
- *Round five (2026-11-13)*: the owner found the title's way-in block ugly with the "Free. No paid plan." line under the buttons: the line and `T.landing.free` are gone, and the block goes to the canvas (page 4, round 5: `LandEntrada`, with `LandLogros`, `LandPuntos` and `LandBarra` for the achievements section, the rankings in Vault Points and the bar on scroll, which the owner asked to see drawn first). The example groups now use IGDB boxes (`images.igdb.com`, already an allowed host, the project's source of covers): MediEvil, Dragon Ball Z: Budokai 3 (the owner's capture read "Dragon Ball Z: Budo…"), the real Skate 3 in place of its sequel, and the four Pokémon boxes, so no group shows RA's 96 px squares blurred in a tall slice. The image ids were looked up once with the local Twitch app; the page asks IGDB nothing.
- *Round five built (2026-11-13), the owner's picks on the canvas*: "Logro a logro" (`landing-achievements/LandingAchievements`, after the groups; canvas `LandLogros` B): a small game page of Call of Duty: Black Ops II on Steam (`LandingSampleGameHead`: its art, cover, title, platform, bar) with the game page's filters as `Tabs` (they work), "Ask an AI" (a link to sign-up: the export needs an account) and six real achievements (`LandingSampleAchievement`: Steam's icon, name and text in each language, from its schema in the nine, `T.landing.sampleAchievements`; Portuguese is English because Steam has none; Steam's global rarity as `RarityBadge`; earned ones dated relative to today). Vault Points gained the rankings slice (`landing-rank-slice/LandingRankSlice`, canvas `LandPuntos` B): a `SegmentedControl` for the period and four rows, the player's tinted "You", the others nameless (a grey bar, "another person" to a screen reader). The title's ways in are lower and longer (`Button size="xl"`: 52 px tall, one minimum width; the owner found the 64 px ones chunky), the tagline is in the display italic with no tracking (the wide-tracked lower case did not match the name), and the backdrop's foot fades out (a mask) so scrolling shows no edge. Not built: the bar on scroll (`LandBarra`), no answer yet. Both new sections first overflowed a 390 px phone (a grid track sized to its content): `grid-cols-1` and `min-w-0`, as the library.
- *The top bar (2026-11-13, the owner)*: `landing-top-bar/LandingTopBar`, out of the title screen and into the page so it can stick: the language, the links at the app bar's own size (`MainHeader`'s NavLink: 15 px semibold, secondary until hovered) and "Entrar" / "Crear cuenta" as `Button size="sm"`; clear over the title screen, on the app bar's frosted `bg-header` once the page moves (`hooks/useScrolledPast`, `useSyncExternalStore`, false on the server); a 0 px tall sticky wrapper so it lies over the title instead of pushing it; `short:` scrolls away as the app bar does; below `md` only the language and the two ways in (the links are in the footer). The title screen keeps its two big buttons; `#que-es` and `#faq` land under the bar (`scroll-mt-20`). `LandingNav` (public pages) is unchanged.
- *The library example, interactive (2026-11-13, the owner: "lo mismo que se ve en la main page")*: its rows are the home feed's `FeedGameCard` (`LandingSampleGame`), across the page (the section head is a `row` now, as the groups'). The three Steam examples open one at a time on what the home shows (`LandingSampleExpanded`: `GameExpandedLayout` with `SteamExpandedStats`, the unlocks chart, `RarestEarned` and the `BadgeGrid`), from every achievement of Fallout 4, Black Ops II and Inazuma Eleven read once from Steam's public schema and global percentages (`landing-page/sample-library/`: one data module, names per language, both loaded only when a game opens through `hooks/useLandingSampleAchievements`). Earned are the most common N at the owner's counts, dated from today; Black Ops II's agree with "Achievement by achievement". Two library props for it: `FeedGameCard`'s `expand` and `RarestRow.href` are optional (an example opens nothing / links nowhere). **Open:** Assassin's Creed Brotherhood (PSN) and the two RA games stay closed: their lists need the owner's RA Web API key (RA keys are per user, none on this machine) and the PS4 game's trophy set id (or the owner's PSN online ID to find it with the app's NPSSO). "How Vault Points work" left the top bar (`T.landing.howPoints` deleted; the points section keeps its own link).
- *Half and half, and the PlayStation example (2026-11-13, the owner)*: the library and the groups are back to half text, half example (`lg:grid-cols-2`, the
  head without `row`); the three groups stand one under another (the sideways strip and `useScrollFade` gone, the band `sm:h-40`). Opening an example hides
  the others until it closes, as the home feed does. In a half the opened game did not fit: `GameExpandedLayout` now lays out by its **card's** width
  (`@container`: three columns from `@3xl`, the ring across the top with the chart and the side panel under it from `@md`, stacked below), and so do the facts
  beside the ring (`GameExpandedStatList`, PSN's counts), since the home's column (two thirds at `lg`, about 620 px at 1024) had the same squeeze; its `fr`
  tracks are `minmax(0, …)`. Assassin's Creed Brotherhood (PS4) opens on its 51 trophies (`LandingSamplePsnExpanded`, the home's PSN pieces with no links),
  read once (with the owner's leave) from PSN with the app's account, which has the game (`NPWR11436_00`): names in nine languages, PSN rarity, icons on
  `image.api.playstation.com`; earned dated from 210 to 25 days ago, most common first, the platinum last. `useLandingSampleAchievements` became
  `useLandingSample(id, load)` for both. **Found:** Sony answers `pt-PT` in English for this game and `pt-BR` in Portuguese; the sample uses `pt-BR`, the app
  (`psnLanguage`) still asks `pt-PT`, so a Portuguese reader sees English trophy names: worth a fallback, not done. **Open:** the two RA examples stay closed;
  there is no RA key on this machine (keys are per user, in the database) and the owner has not given one.
- *Zigzag, the RA examples, the opened game held (2026-11-13, the owner)*: on a wide screen the sections alternate: the groups and the streak put their
  text on the right (`LandingSectionHead end`, which replaced the unused `row`; on a phone the text still comes first). Pokémon Gold (RA 576) and Super Mario
  Sunshine (RA 6049) open on their achievements (`LandingSampleRaExpanded`: the ring with points, the chart, the rarest earned where the home shows the pinned
  ones, which need an account, the badge grid in hardcore), read once from RA with a key the owner pasted for it, **not stored anywhere** (passed in the
  environment of one command); RA names them in English only. Their counts follow RA's real totals (72 and 148 achievements, not 49 and 70): 25 and 19
  earned, the same share, dated 60 to 6 and 90 to 20 days ago so the chart has them. `useLandingSample` now returns what its loader returns (`data`).
  Opening an example swaps the views as the home does (the list leaves, the game comes in): the home feed's motion moved to `utils/feedViewMotion`. The
  owner found the opened card too tall (about 600 px to 1,100 at 1440): picked among four ways (full width when open, 40/60, a capped grid), **the panel
  keeps the closed list's height on a wide screen (36.5rem) and the opened game scrolls inside**, as the home's column does, with the scrollbar's room kept
  and a fade where it is cut (`useScrollFade({ axis: 'y' })`, new). On a phone it still grows (a box that scrolls inside a page that scrolls is worse there).
- *Round six (2026-11-13, the owner)*: the library lost its platform tabs and its "Example" label (`LandingPage.test` now counts four labelled
  examples) for a seventh game, God of War Ragnarök on PS5 (`NPWR22392_00`, 48 trophies with its DLC group, read once from PSN; the global rarity comes
  from a public trophy hunter's list, as the app's account has no PS5 game; PS5 icons live on `psnobj.prod.dl.playstation.net`); `samplePsnTrophies` is now
  keyed by trophy set; the card's fixed height is seven rows (42.625rem). "Logro a logro" shows four achievements ("Ten thousand" and "Futurist" gone, in the
  nine languages; that change landed in the library's commit by mistake). Achievements now come before the groups, and the groups are **a try**: a band
  that slides across the page as the closing's covers do (`landing-group-reel/LandingGroupReel`, `.cover-reel-row`, 110 s a half, paused under the pointer
  and by the stop button, still and scrollable by hand under reduced motion, each group once for a screen reader), with two more groups (Resident Evil,
  Soulslike, Steam art; example figures). Revert that commit if the owner does not like it. The zigzag follows the new order: library left, achievements
  right, the band, streak left, points right. **Open:** "Mira cómo avanzas" needs a rework (the owner: a big "56 days" with nothing saying what it is);
  canvas first, as `docs/design-process.md` asks.
- *The band, more and slower; the streak on the canvas (2026-11-13, the owner)*: four more groups (Final Fantasy, Metroidvania, Roguelike, Yakuza; Steam
  art, every cover checked to exist), nine in all, so a half is wider than 2560 px with no repeat; 180 s a half (about 19 px/s, half the speed). "Mira cómo
  avanzas" drawn on the canvas (`LandRacha`, page 4, round 6: Hoy, A the streak explained, B your week, C your year); see `docs/designs.md`.
- *The streak, option A, and a backlog group (2026-11-13, the owner)*: "Mira cómo avanzas" rebuilt as the canvas's A: the text says what a streak is
  (`T.landing.progressText` / `progressPoints` rewritten in nine languages); the example names it ("Your streak" and `T.streak.pageSub` over the figure),
  the figure in its tier's colour, "From … to today", "Your best streak yet" when it is, and its days in `/racha`'s own `StreakCalendar` (today picked;
  picking a day says its count), the counts fixed per day (`streakDayCounts`). The best-streaks list left this section. Half and half only from `xl`: the
  calendar's thirteen weeks (about 504 px) do not fit half of a 1024 px page. **Then** the owner found it a one-to-one copy of their own `/racha`: the
  section now has its own `landing-streak-calendar/LandingStreakCalendar` (only the weeks the streak spans, each day's achievement count in its square in
  the streak's tier colour, the days outside it empty squares, nothing made up; one tab stop and the arrows; `T.landing.streakLegend` in nine languages),
  half and half again from `lg`. **Then, smaller** (the owner: too big, extras out, empty room on the right): one card, the figure (3rem) with its
  dates and the picked day on the left, the calendar beside it with its weeks sharing the width; no "best yet" tag, no repeated explanation. A tenth group in the band, "Pendientes" (`T.landing.sampleGroupBacklog`:
  Backlog, Pendentes, À jouer, Noch zu spielen, Da giocare, Отложенные, Do ogrania, 積みゲー): Baldur's Gate 3, Cyberpunk 2077, RDR2, The Witcher 3.
**Where the drawing gave way to a rule** — No capitals: the platforms line, the name and the tagline are in their own case (drawn in capitals; the guard refuses
`uppercase`), the wide tracking kept. The name is `BrandMark`'s mixed case, the same signature as the bar and the sign-in; on a 390 px phone it fits one line (the
drawing broke "CHEEVO / VAULT", wider in capitals). "Iniciar sesión" is `T.landing.signIn` ("Entrar" in Spanish). No © year (the line is `T.landing.footer`). The nav's
"Preguntas" is `T.publicPages.faqTitle`.
**Decisions** — Example games and groups use covers the art wall's pool has: the owner's PS4 games show their Steam art, "Pokémon Sapphire" became Pokémon Gold,
the groups "Octubre" / "Noviembre" became "Assassin's Creed" / "Spider-Man" (month names would not translate); the figures are the owner's, and all of it says
"Ejemplo". On a phone the closing keeps its two rows of covers and both buttons (LandMovil still had the older blurred art and one button). The streak list's
caption ("the one you are on, in colour…") was left out: the list shows it. The backdrop uses RA's small boxes only (blurred, a Steam cover would only weigh more);
the closing band repeats eight covers per row, so a half is wider than 2560 px with 16 downloads in all.
**How it was seen** — `next dev` on port 3136 with a throwaway secret and no database, signed out in fresh Playwright contexts (touch on up to 1280 px): 390 × 844,
375 × 812, 1280 × 800, 800 × 450, 760 × 360, 1920 × 1080, 2560 × 1440 in Chromium, 1920 and 1280 in Firefox. No horizontal scroll at any size (one found and fixed:
the `sr-only` comma of `Facts` inside a sideways strip escaped it; the group card is `relative` now). The drift and the band move, stop with the button and stay
still under reduced motion, in both browsers.
**Open / watch out** — For the owner: 2560 px (the backdrop's covers are big and sparse, the drawing scaled up; the name is 256 px) and the Thor at 760 × 360 (the
footer line sits under the fold). The closing band's covers are lazy: a full-page screenshot taken without scrolling shows empty frames. The landing no longer uses
`LandingNav`, which stays in `landing-page/landing-nav/` for `PublicShell` and `SeoPage`. The example dates are 2026's: from 2027 they show the year.

---

## 2026-11-12 — Recently played off-centre and the handhelds (`fix/115-handhelds`, #114 + #115)

**Did** — Stacked on `feat/134-phone` (PR #161, not merged). One commit per point:
- *#114, the cause* (`fix(ui)`): the feed's rows carry `flex: 1 1 0` (`ROW_STYLE` in `RecentlyPlayedFeed`) and grow to the
  height of the profile column beside them (the home's grid stretches its row). Their content was centred by two CSS rules
  only, `.home-fit … > * > *` (≥ 1024 px wide **and ≥ 1000 px tall**, Overview open) and `.profile-recent … > * > *` (someone's
  profile). Anywhere else (a window under 1000 px tall: a 1080 screen with the browser's bars, the Steam Deck's 800) a profile
  column taller than the list stretched the rows and the content stuck to their top, with blank space under it. Why it came
  and went: it depends on the window's height crossing 1000 px and on the profile's height (which platform tab, the motto, the
  "now playing" card arriving, the recent achievements). Reproduced at 1920 × 950 with a taller profile: 0 px over the content,
  53 px under it in every row. Fixed in the shell: `FeedGameCard` is `justify-center` (open, the panel takes the spare room, so
  nothing changes), and the two CSS rules are gone. Not the scrollbar, fonts, fractional widths or breakpoints (all measured).
  The contract test checks the class on every platform's row.
- *The streak's day panel* (`fix(streak)`): stacked under the calendar (the card under 48rem: a phone, the Thor, and the
  Steam Deck, where `/racha` has two columns), `flex-1` gave the panel a basis of 0 that beat its `h-[24.25rem]`: it was 0 px
  tall and the picked day hung out of the card. `@3xl:flex-1` only. A bug from #131 at every stacked width, 390 included.
- *Touch areas* (`feat(ui)`): `tap-target` in `globals.css` (an unseen `::after` to 44 × 44 px under `any-pointer: coarse`) on
  `Button`, `IconButton`, `ToggleButton`, `Tabs`, `SegmentedControl`, the pin, the password eye, the category search's clear
  (now placed by its own box), the home's profile actions, the profile's Follow / Copy link, the footer, legal and public links,
  the sign-in's text links, the rankings' "how" link. The `short` variant (≤ 500 px tall) is defined here.
- *The bar and the home held sideways* (`feat(home)`): the header's links showed from `md` and ran 47 px past the edge at
  800 px: from `lg` now, the menu below it (checked at 1024 / 1100 / 1280 in es, de, ru: no overflow, the search shrinks to
  ~170 px at 1024). On `short` the app's bar and `LandingNav` scroll away (`short:relative`), the stats strip sticks at
  `top-0`, and below `lg` the home's profile folds to one line (#134's fold: `max-lg:short:flex` / `max-lg:short:hidden`,
  skeleton too), so on the Thor your games come right under the bar instead of after ~650 px of profile.
- *Phones unchanged* (`fix(ui)`): the visible touch sizes (sm tabs 44 px, the stats strip's tabs, the bar's icon spacing, the
  sign-in's link spacing) apply from `sm`; a phone keeps #134's sizes and only gets the unseen area.
**How it was seen** — No account and no database: a throwaway `/hh-lab` page (deleted, `proxy.ts` restored) drew the real home,
library, streak page and someone's profile with every `/api` call answered by Playwright from sample data, touch emulation on.
1280 × 800, 800 × 450, 760 × 360, 1080 × 1240, 390 and 2560, slanted dark and round light: no horizontal scroll anywhere
(the landing, sign-in, rankings, a comparison and /privacy too, signed out). Screenshots were handed to the coordinator.
**Decisions** — Touch areas are invisible rather than bigger controls, so the desktop and the look do not change; only where a
scrolling strip would clip the area does the control grow, from `sm`. `any-pointer` (not `pointer`): the Deck in desktop mode
has a trackpad as its main pointer and a touch screen too. The fold on `short` keeps #134's rule that it never shows on
someone else's page. Title links in the feed stay 21 px tall: the 64 px icon beside them goes to the same page.
**Open / watch out** — Not seen on the real devices. To try there: on the Thor (landscape) the home starts with the fold line and
your games, the bar scrolls away, the stats strip sticks at the top, the menu opens; pins, tabs and the bar's icons take a tap
at their edge; on the Deck the header shows its links with no overflow, the feed's rows are centred, `/racha` shows the day under
the calendar. The year map's 10–16 px days and the
streak calendar's 37–40 px days are under 44 px (a grid of days; their keyboard path is there); the tooltips that open on hover
(badges on Following, the cover's details) are information, not actions. The 1080 × 1240 secondary screen gets the tablet
layout (profile stacked first, not folded: it is not short). The owner's checkout and other worktrees were not touched.

---

## 2026-11-12 — The phone pass (`feat/134-phone`, #134)

**Did** — Board "MejMovil" (canvas page 2), cut from `origin/develop` with #129–#135 in. One commit per point:
- *Strips that scroll say so* (`feat(ui)`): `useScrollFade` (`src/hooks/`) and `ui/scrollFade.ts`: the edge a sideways strip is cut at
  fades out (a CSS mask, start, end or both), nothing while it fits. Built into `Tabs` (profile tabs, the stats rail as a strip on a phone,
  the library's platform tabs, every tab row), used by a group's status filters (now one line that scrolls, no more "Sin empezar 0" alone on
  a line), a game's achievement filters and the streak's year, which opens scrolled to today (`fromEnd`). Specimen "Scroll fade" in `/design`.
- *The version and the footer* (`fix(ui)`): `VersionBadge` (fixed bottom-right, over the content) is gone; the version is in `MainFooter`'s
  name line and at the end of `PublicFooter`. The footer's rows wrap (GitHub ran off the right edge). This change was written by another
  Claude session that worked in this worktree for a minute (20:18, stopped by the coordinator); kept as it was, it is the issue's point.
- *Phone fixes* (`fix(ui)`): `Tabs size="lg"` (the home's "Jugados recientemente / Juegos fijados") is 15 px on one line on a phone (Spanish 298 px, Russian 312 of the 319 px a 375 px screen leaves, in Barlow) and
  scrolls with the fade if a language does not fit (`text-xl`, free to wrap, from `sm`); its skeleton line is 30 px there (was 72 px for two
  lines). `FeedGameCard` puts the platform tag on its own line under the title on a phone (the title gets the width); `GameRowSkeleton` has
  that line too (phone only). The account's level row wraps, so the points take their own line (V4-03).
- *Figures by three* (`feat(ui)`): `FIGURES_BY_THREE` (home's activity row: three to a row on a phone, side by side from `sm`) and
  `FIGURES_BY_THREE_TO_LG` (a profile's six; `KPIS_ROW` is it) hide the mark in front of each row's first figure (`data-figure-mark`).
  `pointsStats.avgPerDay` is short in the nine languages ("Media 30 d", "Avg 30 d"; the line under it says "/day").
- *The profile folded* (`feat(home)`): `main-page-profile-fold/MainPageProfileFold` on your own home, phone only (`sm:hidden`): picture,
  name, level (`VaultLevelBadge compact`, its room while the points load or fill) and streak (the year's, `useStreakData`, the same the home
  reads; a grey tag until the whole year is in), and "Ver perfil" / "Ocultar perfil" (`mainPage.showProfile`, `hideProfile`, nine languages,
  `aria-expanded` + `aria-controls`). The side column is `max-sm:hidden` while folded, in both layouts (classic and cover). The home's
  skeleton draws the line (`MainPageProfileFoldSkeleton`) and hides the column below `sm`.
**Already done before** — the podium's level once on a phone (#118, `VaultLevelBadge compact="phone"`; the podium passes it); the library
list's platform as its logo on a phone (#129); the home's activity row is five figures since #128 (not six), so on a phone it is 3 + 2.
**Decisions** — Fold below `sm` only: between 640 and 1023 px the column still stacks first, as before (the issue says phone). The fold is
never on someone else's page (it shows your own account). The column's `min-height` with profile tabs only exists at `lg` and taller than
1000 px (`globals.css`), so folding never touches it, and `homeFit` does not remember a folded (0 px) height. The fold opens by state, not
stored: every visit starts folded. The year map starts at today rather than adding a second control. The footer keeps its "·" between links
(the guard allows it there: links, not facts). The short average label applies on every screen (one name per thing).
**Open / watch out** — Not seen signed in (no real account may be used). Look on a phone at 390 and 375 px: the fold line with a long name
(it truncates; the button keeps its width), the home's two view tabs in each language (German and Russian are the longest; they scroll with
the fade if they do not fit), a group with the four status filters, the streak's year opening on today, the account's points under the
level. Firefox for the mask. The cookie notice was not touched (the owner's call). Seen while measuring, not fixed here (texts, not phone):
`pinnedGames.title` is still English ("Pinned games") in German, Portuguese and Russian, and Russian `cards.recentlyPlayed` is "Недавно играл"
(a masculine verb, against the gender-neutral rule). Checked signed out at 375 px with `next dev`: the landing's footer ends with the version and
nothing fixed is left over the page.

## 2026-11-12 — The theme picker: a base, then an option under it, every theme kept (`feat/135-theme-picker`, #135)

**Did** — Boards "TemMain", "TemBasicos", "TemNombrados" and the `MiniTema` piece (canvas page 3), then the owner's table after seeing it, stacked on `feat/133-auth-public-pages` (not merged).
- `src/utils/themePicker.ts`: all 22 themes as a base (Dark, Tinted, Light, Special) and an option under it, the owner's table (`docs/design-system.md` → The theme picker):
  Dark: violet, red, green, blue, white; Tinted: violet, red, green, blue, Crimson, Midnight; Light: violet, red, green, blue, black, Sakura, Arctic;
  Special: Black Ops II, Snake Eater, Steam Retro, Venom. `pairOf`, `optionsOf`, `pickBase` (keeps the same option when the new base has it, else its first).
  Its test: every id from exactly one pair, every pair a theme, the table as given. `THEME_GROUPS` (types.ts) and its tests are gone. Ids, `users.theme`, the favicon and the theme values are untouched.
- `ui/ThemeScreen` (the MiniTema): the top bar with the logo (`LOGO_PATHS`) and a slanted level, the display-italic title, two game rows with their covers and bars, the filters
  and the slanted primary button, all under `data-theme` so it is drawn in that theme's tokens; it scales with its width (`@container`, sizes in em over `3.125cqw`).
  `on` adds a tick and "On". Specimen in `/design` (Foundations); `uiGuard.test.ts` refuses a `data-theme={…}` outside it. `ThemePreview`, `ThemeModalGroups`, `ThemeModalOption` deleted.
- The covers: `src/utils/themeGames.ts` gives each tribute its own games as Steam covers (`steamAssetUrl`, the art wall's CDN, no proxy): Black Ops II 202970 and Black Ops 42700,
  Snake Eater 2131650 (MGS3 Master Collection) and 2417610 (MGS Δ), Venom 2651280 (Marvel's Spider-Man 2) and 1817070 (Spider-Man Remastered), Steam Retro 70 (Half-Life) and 400 (Portal);
  every other theme shows two RA covers of the wall. Tested.
- `theme-modal/theme-modal-picker/ThemeModalPicker`: two `ChoiceCards`, the bases (4) and the options of the base on (up to 7, "Accent", or "Theme" under Special), each option the
  `ThemeScreen` of the theme it lands on; the base and option of the theme on are checked when it opens. Used by `ThemeModal` (`size="2xl"`; same rules: stays open, spreads from the card,
  `backdrop="dim"`, the status line, the inline save error) and by the welcome's style step, which now shows the groups' names (it hid every legend, right for its one-choice steps).
- `ChoiceCards`: `columns={7}`, seven in a row once the group itself is 64rem wide (`@container` on the fieldset), four below, three on a phone.
- Texts (nine languages): `userTheme.base`, `accent`, `base_*` (with `base_special`), `accent_*`, `on`; the five `group_*` keys are gone; the option row under Special reuses `userTheme.theme`.
**Decisions** — Each option is a small screen (the issue), so a card always shows what clicking it gives. The accent words follow the theme names already in each language
("Morado" in Spanish, as in "Oscuro · Morado"): one name per thing; the moved palettes keep their theme names. The picked card is caught with `onChangeCapture` in the picker,
so `ChoiceCards`' `onChange` keeps its one argument. Arrow keys in a group pick and save as they move (native radios).
**Tried and dropped the same day** — The 8 named themes as a third row, then as a "Special themes" column beside the basics in a 100rem `Modal size="3xl"`: a misunderstanding of the owner's
"Especiales", which is a fourth base. The `3xl` size, the column split and `ChoiceCards`' `disabled` (for Tinted × white, which is no longer a choice) were removed.
**Open** — Not seen signed in (the dialog needs a session). Looked at with a throwaway page (removed, `proxy.ts` restored): at 1920 × 1080 the dialog is 1240 × 549 px with no scroll, the
options' row 167 px tall on every base (it never moves); the welcome-width (760 px) picker has four per row; on a phone, 2 + 2 bases and three options per row (the sheet scrolls, and changing base changes its height there).
**Watch out** — A new theme must join `themePicker.ts` (a base and an option) or its test fails; `CLAUDE.md` and `docs/design-system.md` → The theme picker say so.

---

## 2026-11-12 — Sign-in, sign-up and the public pages (`feat/133-auth-public-pages`, #133)

**Did** — Boards "MejAcceso" and "MejPublicas" (canvas page 2), stacked on `feat/132-account-dialogs` (not merged). One commit per point:
- *The signature* (`feat(ui)`): `ui/BrandMark` (the logo and the name in the display italic). The logo is drawn from the favicon's own shapes
  (`LOGO_PATHS` / `LOGO_VIEWBOX` exported by `utils/themeIcon.ts`, which builds its SVG from them: same shapes, never a copy) in the accent, facets at the
  favicon's 1 / 0.65 / 0.4. `LandingNav` (the bar of every public page) uses it, and its "Sign in" is the library's secondary `Button` instead of a hand-made pill.
  Specimen in `/design`; `uiGuard.test.ts` refuses a second copy of the logo's path. The landing in code did **not** have the logo + italic name yet (only the canvas did),
  so this piece is the first: the landing's own rework should use it.
- *Sign-in and register* (`feat(auth)`): `AuthBrand` is `BrandMark lg`, the tagline and the platforms on one line (`Facts`, the mark between them, their logos kept);
  `AuthFormCard` is a plain card (no blur, no big shadow) and `AuthDesktopFormPanel` lost its glow; `AuthTitle` is the one title of the family (display italic, no rule
  under it; login, register, reset and the Steam finish step); `SteamSignInButton` is `buttonClass('secondary', 'lg')` with `SteamLogo` in `text-steam` (an `<a>` on purpose:
  `Button href` is a `Link` and this is a redirecting route handler) and the RA button is a `Button secondary`. On a phone `AuthPhoneFrame` puts a band of covers
  (`CoverBand`, extracted from the landing's first screen, which uses it now) above the name instead of the wall at 30 % behind the card.
- *Reset with a spent link* (`fix(auth)`): `/resetPassword` renders `AuthPage` with `form` (art wall and card); with no token or an `invalid-token` answer the form gives way to the notice and
  "Ask for a new link" (`passwordReset.askAgain`, nine languages), which opens `ForgotPasswordModal`. The token is now read on the server (a `token` prop), so the form has no `useSearchParams`/`Suspense`.
- *Back to where you were going* (`feat(auth)`): the proxy sends `/authPage?next=<path and query>`; the sign-in says `loginForm.needsAccount` ("That page does not exist or needs an account", nine languages) and pushes to it after signing in.
  `utils/safeNext.ts` is the only gate (own-site path; `//evil.com`, `https://evil.com`, `/evil.com`, `javascript:`, control characters, the sign-in/reset/API paths and anything over 512 characters go home), used by the proxy and the server page; tested with those inputs.
- *Comparisons and /track* (`feat(seo)`): `SeoPageClosing` (a rule, a line, a button; the landing keeps `LandingClosing`), `FaqList numbered={false}` on the SEO pages.
  `/track/achievements-with-friends` now says the showcase is public (up to five earned achievements, to signed-in users), achievements to get are private and nobody else sees who follows whom; `updated` 2026-11-12.
- *Legal pages* (`feat(legal)`): `LegalDocument` sits in `PublicShell` (bar and footer); "What we store" is four `parts` with an h3 each (Account, Profile and activity, Platforms, Security) in nine languages, text unchanged.
- *To try, its own commit* (`feat(auth): try bigger covers…`): from 2560 px the sign-in wall has 128 px covers, `gap-28` and the page's ground (`AuthCollagePanel wall`); windows keep their size. Revert that commit alone to drop it.
**Already done before** — the em dashes in the legal texts (CP-09's sweep: `copy.test.ts` finds none outside Russian; Russian keeps its punctuation dash with spaces); the primary button's corners staying inside the fields' column (`--button-inset`, #127);
`/track`'s two sentences were already mostly right after #118 (they said "only you see who follows you"); no Xbox on any of these pages (a test keeps it).
**Decisions** — `next` is carried by the credentials sign-in only: Steam's sign-in leaves the site and returns to `/authPage?steam=…`, so it still lands on the home page (carrying it would need a signed cookie; said in `docs/accounts.md`). The line above the form
is an `info` `Notice` (it is not an error) and shows on sign-in only. The 2560 px screen is the named breakpoint `uhd` (`--breakpoint-uhd` in `globals.css`): an arbitrary `min-[2560px]:` sorts before `xl:` and loses to it (measured: the covers stayed at 96 px).
**Open** — the landing's own pieces (the italic title, the cover band as a moving strip) belong to its issue; `LandingClosing` and the landing's numbered FAQ are untouched. The `steam-button` / `steam-slate` tokens are no longer used by the sign-in (still listed in the catalogue).
**Watch out** — Not seen signed in or in Firefox. Look at: the sign-in at 390 px (the band is 128 px tall and sparse: four columns of big tiles), 2560 px (covers clipped at the wall's right edge by the 40 px fade), the reset page with a real spent token (needs the mail), `/privacy` at 390 px, the title sizes in a long language (the reset title wraps in Spanish at `lg`).
In dev, Turbopack sometimes served a stale server render of a client component (a hydration mismatch that was not one): restart `next dev` before believing it.

---

## 2026-11-12 — The account page and the dialogs (`feat/132-account-dialogs`, #132)

**Did** — Boards "MejCuenta" and "MejDialogos" (canvas page 2), stacked on `feat/131-streak-calendar` (not merged). One commit per point:
- *Reds* (`feat(account)`): `UserPlatformCard`'s head is two lines now: logo and name, then "Connected" with a small ringed
  "Disconnect" with an unlink icon beside it (`aria-label` is the long "Disconnect Steam"), the same height connected or not so the figures line up in a
  row; the full-width red button is gone. The red is in the confirmation, `user-page/platform-unlink-dialog/PlatformUnlinkDialog`
  (`Modal tone="danger"`, title "Disconnect {name}?", a line, a quiet Cancel and the danger button; it stays up and blocked while the
  unlink runs and the card closes it with its toast). "Sign out" is `secondary`; "Delete account" stays where it is, in red.
  New texts `userData.disconnect`, `disconnectTitle`, `disconnectText` (nine languages, impersonal, no gender).
- *Texts* (`fix(account)`): Steam's "logros" and Xbox's "Logros" are one label, `userStats.achievements` (nine languages); the Hidden
  games row's value is the count ("Hidden games / 2", `toLocaleString(lang)`), `userPage.hiddenCount` is gone.
- *Cancel is quiet* (`feat(ui)`): beside a disabled Save a ringed Cancel was what stood out, so every dialog footer's Cancel is a
  `quiet` Button (the footer was already normal-size buttons on the right since #121; only the primary leans). `uiGuard.test.ts`
  refuses a `secondary` in a footer fragment; the catalogue's danger modal is the specimen; `CLAUDE.md` and `docs/design-system.md` say so.
- *Admin unlock* (`feat(admin)`): one title. `AdminPanelModal`'s head is "Unlock the admin panel" with the lock while the door is
  shut and "Admin panel" with the shield once open; `AdminUnlock` lost its tile and its own h3 (a left-aligned line, the fields and a
  normal-size "Unlock" at the right). The recovery codes step keeps its own line "Save your recovery codes" and a normal button.
- *Language list* (`feat(ui)`): names only; `LANGUAGES` lost its `flag` field. *Hidden games* (`feat(ui)`): each row has a small
  quiet "Show" button (`userPage.showAgain`, named "Show {game}"); `userPage.showGame` is gone.
- *Layout sample* (`feat(ui)`): `LayoutModalPreviewSampleProfile` reads `useAuthSession` and `useVaultMe`: the person's name, an
  `Avatar`, `VaultLevelBadge compact`, their Vault Points and the real `ProgressBar` with "N to level M" (a skeleton for the badge
  and `loading` on the points while they load). The welcome's style step shows the same card. The streak figure stays a fixed 12.
- *After the owner saw it at 2560 px* (same day): "Disconnect" went from quiet to `secondary` small with an icon (still no red; the
  head row keeps one height). Account dialogs were too narrow at the default `sm` (27.5rem): `md` for change password, edit profile,
  gender, avatar, RA connect, delete account, disconnect, the admin unlock door and the admin create / edit forms; `lg` for hidden games
  and the favourite-game picker; language, location, theme (`xl`), layout (`2xl`) and the open admin panel (`xl`) already had their own.
  `Modal`'s default is unchanged. The admin dialog no longer flashes "Admin panel" before "Unlock the admin panel": until the panel
  reports its mode the head is a title skeleton over an empty icon tile and the body is `AdminUnlockSkeleton` (the unlock step's boxes,
  `md`), so only the words arrive.
**Already done before** — "Theme: —" / "Language: —" for a screen reader (the `ProfileField` test says so); the Venom switch knob
(`bg-bg-main` when on); "Maestrías" (`userStats.masteries`); Xbox "Cuenta Silver" (`xbox.tier` is "Account", the value "Silver"; #128);
the one head for every dialog with the ✕ (#121: every dialog is a `Modal`, only the search has its own way out); the delete-account
dialog is `tone="danger"` with its hint; normal-size right-aligned footers; "ID 3" untouched on purpose.
**Decisions** — The audit said "Disconnect already confirms": it did not (the button unlinked at once), so the confirmation is new
(only the flow's order changed; no route, no stored data). The language flags go entirely rather than grey: a flag is a country, and
Windows draws it as two letters. The unlock dialog's "Unlock" is a normal button, not a full-width slab. Cancel is `quiet` in all
dialogs, not only the two named on the board, so none can outshine a disabled primary.
**Watch out** — Not seen in a browser (it needs a session). Look at: the platform cards' new second head line at 1280 px (four
cards) and 390 px; the Disconnect dialog on each platform; the unlock dialog switching its head when it reports `locked` (it opens as
"Admin panel" for a moment while the panel asks the server); the layout sample's profile column at its narrowest (the level word);
the welcome's style step now reads `/api/rankings/me` (database only) for that card. The country on the account page and the
profile still use emoji flags (Windows shows letters); the board only named the language list.

---

## 2026-11-12 — The streak page: the calendar back, best streaks by tier (`feat/131-streak-calendar`, #131)

**Did** — Boards "MejRacha" and "MejRacha5" (canvas page 2), stacked on `feat/130-profiles-rankings-groups` (not merged):
- *The calendar is back* in "The streak, day by day" (`streak-calendar/StreakCalendar`, `streak-calendar-day/StreakCalendarDay`),
  from the one `d56b7fee` removed (2026-10-24), wider: columns of at most 56 px (`CALENDAR_COLUMNS`, they shrink to fit a phone),
  the week from Monday, each day shaded in the accent by its count against the streak's busiest day (as the year below it),
  the month named on the streak's first day and on each 1st, a "Less … More" legend (`T.cards.heatLess/heatMore`), `.enter-cards`
  on the grid. The picked day is ringed (`ring-2` with an offset) and bolder, `aria-pressed`; today has `aria-current="date"`;
  each day's `aria-label` is its full date and count. Keyboard: one tab stop (roving `tabIndex`), the arrows move a day or a week,
  Home / End to the ends, focus follows. Beside it when the card is at least 48rem wide (`@container`, `@3xl:`), stacked
  otherwise: the picked day (`StreakDayRow`, now a panel: the day in big, the count, "today", the games, a game finished that
  day) and its achievements listed (`streak-day-achievements/StreakDayAchievements`: `ListRow` per unlock, badge ringed when
  hardcore, opening the game; past six, "and 3 more" opens `DayAchievementsModal`; `T.streak.dayMore`, nine languages). Its
  skeleton is `streak-calendar-skeleton/StreakCalendarSkeleton` (weekday row, 56 days, the legend, the panel), drawn by
  `StreakPageSkeleton`. Deleted: `StreakDayStrip`, `stripCap`, `T.streak.stripHint` (the sentence that explained the bars) and
  the strip's place in the guard's lean allow-list.
- *Best streaks* (`StreakChart`): grey (`streakTier(0)`) until one is picked; the picked one takes its own tier (bar and place).
  `CLAUDE.md` and `docs/design-system.md` say so; the "streaks in the accent" line was already gone since #124.
- *The last achievement's tile* ("ÚLTIMO LOGRO · 1 · día" read as "the last achievement: 1 day"): first tried as "Último logro /
  hace **1** día" (Intl's relative time cut around the number); the owner found it broke the pattern of the other three tiles,
  so it reads like them: "Desde el último logro" (en "Since your last achievement", nine languages) / **1** / "día" (`plural`),
  and "Hoy / sigue viva" on the day itself. No new helper left behind.
- *Turned on its side* after the owner saw a 65-day streak at 2560 px (10 rows, ~650 px tall, empty room on the right): weeks
  are columns and weekdays rows (initials on the left, the month over the week it starts in), always seven rows; columns
  `minmax(1.75rem, 3.5rem)` in a `w-fit` grid, so the calendar is as wide as its weeks, shrinks to 28 px days, then scrolls
  inside itself (the picked week kept in view, never the page); the day panel takes the rest (`@3xl:min-w-72`). Left/right
  move a week, up/down a day. The skeleton draws the same grid at ten weeks.
- *A fixed window of weeks* after the owner found the days too big: 13 weeks of 40 px days from 640 px wide, 7 of 32 px below
  (`useMediaQuery`), the number in `text-xs`. No sideways scroll: `streak-calendar-nav/StreakCalendarNav` over the grid ("8 Sept –
  11 Nov", `IconButton`s labelled `T.streak.prevWeeks/nextWeeks`, nine languages, off at the streak's ends) pages a long streak;
  the window opens on the streak's last week (keyed by streak, so picking another starts there), and the keyboard leaving it moves
  it. A short streak still shows the whole window, the days before it dimmed `aria-hidden` spans; the skeleton is the same window.
  New `addDays` in `utils/dates.ts`.
- *Cards fill their row* (the owner's rule, 2026-11-12, now in `CLAUDE.md` and `docs/design-system.md`): the best streaks show
  as many rows as the card holds (`useFitCount`, new in `src/hooks/`, measures the list's box; at least six alone, about seven
  beside the 2560 px calendar, more where the calendar card stacks its panel and grows); the bar of the streak being shown is in
  its tier, the rest grey (`selectedStreak={shownStreak}`, the owner, 2026-11-12). The day panel lists five achievements (four
  with a finished game) and "See more" (`T.streak.dayMore`) in its head opens the day; the games on one truncated line with
  the whole list in `title`. The hand-made "·" left for `Facts`: the calendar card's aside, the panel's "today", the hero's
  kicker and the best streaks' head (`T.streak.bestSub` split into `bestCount` and `bestAvg`, nine languages). The bottom row
  ("Tu año", "Cuándo juegas") was left as it is: about the same height at 2560 px by the numbers (not measured); at
  1280–1535 px the year's days hit their 10 px minimum and its card may end ~50 px of blank under the grid: look there.
- *The day panel never sets the height* (a day with a finished game made the card and the row jump): its content is
  `absolute inset-0` in a box that takes the calendar's height beside it and a fixed 388 px stacked (`h-[24.25rem]`: its head
  and five rows), and the achievements are as many whole rows as fit under the head and the finished game (`useFitCount`). One
  finished game drawn at most; more of them, and the rest of the achievements, are in "See more" (the modal lists them all).
  The skeleton's calendar card now has the real padding (`sm:p-[1.375rem]`), head line (25.5 px) and the panel's box; the
  legend is `h-4` in both.
**Already done before** — what the issue says #127 brings: "Cuándo juegas" is `DataBar` upright (only its stale comment said
"slanted"; fixed) and the labels are in sentence case (`kickerClass`). The year and hidden consoles are untouched: the calendar
draws `selectedStreak.achievements`, which come from `useActivityHeatmapYear` (filtered by `useConsoleVisibility`, its
`isLoading` covering every platform and the libraries), so the streak still lands whole.
**Decisions** — The days are shaded in the accent, not the canvas's white: the board was drawn on the Dark theme, and the year
heatmap under it (same data) is in the accent. Nothing is coloured on the best streaks at first (the page starts with
`picked` null and shows the live or best streak day by day): "grey until picked", as the owner put it (changed later the same day: the shown one is coloured). A long streak grows the
calendar down (eight weeks are about 560 px tall); no inner scroll.
**Watch out** — Not seen in a browser (it needs a session): check at 2560 px (calendar and panel side by side), at 1280–1535 px
(the two cards side by side, so the calendar card is narrow and stacks), 390 px (days about 43 px), both designs, Firefox,
and a light theme (the number turns `text-bg-main` on tints over 0.6). The skeleton holds eight weeks; a shorter streak's
card lands a little shorter.

---

## 2026-11-12 — Following, rankings, the guide and groups, part 2 of #130 (`feat/130-profiles-rankings-groups`)

**Did** — Boards "MejSiguiendo", "MejRankings" and "MejGrupos" (canvas page 2), after part 1 on the same branch (stacked on
`feat/129-library-game-allgames`, not merged). One commit per area:
- *Following* (`feat(following)`): the Followers tab's hero counts and names **your followers** ("Followers", their online count;
  `FollowingHero` takes a `label`), not the people you follow. New library piece `ui/GhostIcon` (112 px, `text-accent/10`, `right-6 top-6`,
  hidden on a phone) for the people on Following's hero, the cup on its rankings card and the cup on the guide: whole inside the card,
  never cut. The last game says "Last played · 6 months ago" (`relativeTime(…, lang, 'long')`: new third argument, the short style stays
  elsewhere; "6 m" could be minutes); sentence case was already there since #127. A card with nothing to show says one sentence for
  every case, "No recent achievements to show" (`following.noRecentUnlocks`, nine languages): it fits "none earned" and "not read"
  (only the newest `DETAIL_LIMIT` follows are read) without claiming either. "0 public groups" is not drawn: the footer line and its
  rule appear only when there are some.
- *Rankings* (`feat(rankings)`): "Your level" shows the number in the ring and only the tier (`VaultLevelBadge tierOnly`, which was
  already there) and "Global #19" beside it. `VaultWeeksChart` is titled (`rankings.weeksTitle` = "Points per week", visible `Kicker`) and
  has the Monday's day under each bar, with the month where it changes (`formatDay` with `{ day }` / `{ month }`). A shared place is
  marked: the route sets `RankRow.tied` (listed people holding the same rank, per view), `RankingsPageRank` draws "3=" with a "tied" for
  a screen reader (`rankings.tied`) on the podium, table and list. A streak of 0 is `font-medium` grey (it was grey already; now
  also light). The guide: no "01" numbers on parts (`RankingsGuideBlock` keeps `index` only for the heading id) nor on its FAQ
  (`FaqList numbered`, default true: the landing and the SEO pages keep theirs), the rules a `list-disc` list, no "Beta" tag in its title
  and no `betaNote` box (key removed in nine languages): the question stays. `LandingNav` / `PublicShell` take `wide`, which the signed-out
  `/rankings` passes: the bar is as wide as the content.
- *Groups* (`feat(groups)`): `DropSlot` is a dashed border only (the diagonal stripes are gone; both "Nuevo grupo" and "Añadir
  juegos" stay). New `group-facts/GroupFacts`: one line "4 games / 4 in progress / 141/176 achievements / 12 d ago" with the platform
  logos beside the games (`Facts`, never a hand-made "·"), on the album card and the shelf row; the completed count left the card
  (the percentage and the ring say it). Inside a group the three coloured counts under the banner are gone (`GroupDetailHero` lost its
  `states` prop): the toolbar's tabs already carry the same numbers and filter by them.
**Already done before** — Xbox on `/rankings/how` (#118, V3-15: its test stays); "Último jugado" in sentence case (#127); the podium's
steps at one angle and the two title styles of a Following card (brought by #127); "0 d" grey (the colour was there, the weight is new).
**Left out on purpose** — the mobile bug of the podium's places 2 and 3 saying the level twice (on the canvas list, not in the issue):
`VaultLevelBadge compact="phone"` is built to say it once, so it needs a look on a phone first. `GroupCard` (public profile's groups) keeps
its own foot: it was not on the board. The empty "Jugados recientemente" and "Sin grupos públicos" keep their room.
**Decisions** — Ties come from the server, not from the loaded page, so a tie across the "show more" boundary or between the podium and
the table is still marked. The "no recent" sentence is neutral on purpose: a card beyond `DETAIL_LIMIT` has no data, and "nothing earned"
would be false for an active player. The week labels are day numbers plus a month at the change, never "5/10" (a numeric date is refused).
**Watch out** — Not seen in a browser (it needs a session): check at 2560 and 390 px, both designs, Firefox. Likely spots: the ghost icon
behind the teaser's "See all", the weeks chart's labels at 12 bars in the 340 px column, the album card's height (the foot is a line of
text at the old tag's 22 px height, `leading-[1.375rem]`, so the skeleton's 268 px should still hold; a very long line wraps), the signed-out
bar at 390 px. `RankRow.tied` is optional in the type; the route always sets it. A test that pins "12 d ago" must use `days ago` in English
(`Intl` short style keeps "days").

---

## 2026-11-12 — Public profile, its signed-out card and the one date format, part 1 of #130 (`feat/130-profiles-rankings-groups`)

**Did** — Boards "MejPerfil", "MejPerfil9" and the teaser points of "MejPublicas" (canvas page 2), stacked on `feat/129-library-game-allgames`
(not merged yet). One commit per point:
- *One date format, everywhere* (`b30601bc` + `feat(ui): the one date format on the dates still drawn…`): "23 oct", the year only when it
  is not this one (`dateFormat`), as the default of `formatDate` / `formatDay` / `DateText`. Swept the site: the best day / week / month on
  the activity tab showed raw keys ("2024-01-10", "2024-01"; now the one format, the month "January 2024"), the streak hero spelled its
  months out, RA's achievement modal and the unlock tooltip (`formatUnlock`) wrote date + time by hand: new `formatDateTime`. The guard
  also refuses a day, month or year given to `toLocaleString` / `Intl.DateTimeFormat` outside `utils/dates.ts` (admin exempt; the
  two-day range of `MainPageMonthCompare` allowed). `CLAUDE.md` (Shared helpers) and `docs/design-system.md` say so.
- *Profile:* the side "recent achievements" leave the platform card on someone's page (RA's and the shell's; Steam is not asked for
  them there, `useSteamRecentAchievements(null)`); "Steam level 30" (`steam.level` in nine languages); "Last 5 completed games" without the
  medal numbers, covers in a row from the left, "Hardcore" / "Platinum" (`LatestPerfect.platinum`, PSN) / "100%" (`cards.perfectWord`) in
  words and the counts in words, skeleton to match; one `SectionHead` per section (recently played, latest achievements, by platform,
  completed games, showcase, preferences, public groups), no cup; "at 100%" green only above 0; the six figures as one row of bare
  `Figure`s with the mark (new `muted` tone for a 0, the streak in its tier colour), in a grid (3 × 2 on phones, 6 from lg) shared with
  `PublicUserKpisSkeleton`, which the route skeleton draws too.
- *Signed-out card (`ProfileTeaser`):* "See the rankings" is the library's secondary `Button`; the points in the display italic;
  `VaultPlatformSplit legend` names each platform under the bar (no new data, Xbox is never in `profileTeaser`'s split); the two tiles
  `rounded-tile` (V5-17).
**Already done before** — "Create an account" opens sign-up on the card and the signed-out rankings (#118, `REGISTER_HREF`); the
Vault level in the hero (`VaultLevelBadge`); what B brings (#127). "Jugados recientemente" empty and "Sin grupos públicos" keep their room.
**Left out on purpose** — dates that are not "the date of something" keep their options through `formatDate` / `formatDay`: chart axes and
month labels, a day with its weekday (the journal, the streak rows, day / week / period modal titles, the heatmap tooltip), relative times
("6 months ago"), the legal pages' "Last updated" (a sentence in `T`). The admin panel is exempt.
**Open — the rest of #130** (to build on top of this branch): *Following* (the Followers tab's head counting the other tab; the ghost icons
whole in their card, one size and opacity, aligned with the title, Rankings' cup too; "Último jugado · hace 6 meses" in sentence case;
"0 grupos públicos" only when there are some; one sentence for a card with no recent achievements). *Rankings and "Cómo funcionan"*
(Xbox on `/rankings/how` was done in #118): the level once (ring + "Veterano" + "Global #19"), "Points per week" with the week under each
bar, a tie marked ("3="), "0 d" streaks in grey, no "01" numbers nor coloured stripes on the guide, "Beta" said once (the question; the
tag on /rankings stays), the signed-out top bar as wide as the content. *Groups*: dashed border only on the add cards, one footer line
"4 juegos · 4 en curso · 141/176 logros · hace 12 d" with the logos, no coloured counts above the tabs inside a group.
**Watch out** — Not seen in a browser (a profile needs a session): check at 2560 and 390 px, both designs, Firefox: the figures' row
(on a phone the fourth figure starts row 2 with the mark in front of it), the route skeleton's hero height (`min-h-[551px]
sm:min-h-[322px]`, estimated from the old boxes, not measured), the shelf's tiles, the teaser's legend. A test that pins a date of the
current year must fix the clock (`jest.useFakeTimers({ now })`) or use a past year.

---

## 2026-11-11 — Library, game pages and `/allGames` from the canvas (`feat/129-library-game-allgames`, #129)

**Did** — Page 2 of the antislop canvas v2, boards "MejBiblioteca", "MejBibliotecaVistas", "MejJuego", "MejJuego8", "MejTodos" and
"MejTodosRework", one commit per block (cut from `origin/develop` at `5066eaac`):
- *One date format, a library piece:* `ui/DateText` (a `<time>`, "22 oct 2026") and `DATE_FORMAT` as `formatDate`'s default (day
  numeric, was `2-digit`); the guard refuses `formatDate(…, lang, {})` (numeric "13/10/2026"); specimen in `/design`. Used by the
  library's "latest unlocked", the cards' "Finished · / Last played ·" line, the chart's period window and the game table. #130 extends it.
- *RA game that does not exist:* `getGameProgression` answered 503 when RA sent a 200 with no game in it (the cache validator threw
  `RA_VALIDATION_FAILED`, which `raUnavailable` turned into a 503 the client retried); it is a 404 `not-found` now, so the page shows
  "Game not found" like the other platforms. #118 had only fixed RA's own 404/422.
- *Game table:* the pin is the last cell on all four (`pinInTitle` removed from the shell, the row, the desktop table and RA's adapter);
  the "Earned" column shows the date in the one format (RA's mode, Hardcore/Softcore, under it in its colour) instead of a ✓, and the
  date line under the name is gone, so rows are two lines. A dateless earned one keeps the ✓; each says "Earned" to a screen reader.
- *Game header:* RA has hide beside pin, like the other three. Store screenshots have no "Screenshot 1/2" caption (`GameHeroShot` has
  `alt` always and `caption` only when it says more than a number; RA's "Title screen" / "In game" stay). The subset thumbnails get
  `aria-current` on the one shown.
- *Library detail:* "To beat the game 30 / 30" is "Story achievements: 30 of 30", and "Game beaten" (es "Te has pasado el juego") once
  all are earned (`libraryDetail.storyOf`, `storyDone`); the chart's title keeps one line and the Weekly/Monthly switch wraps under it
  when the panel is narrow; "Beaten HC" is "Beaten in hardcore" (`statusGameItem.beatenHardcore`, `gameStatus.beatenHC`). The game
  page's status chip (`gameStatus.*`) was English in seven languages: translated.
- *Views:* the folded sections' previews name the console (PS4, "Xbox Series · PC") or nothing (Steam), never the section's platform;
  inside the Steam section the full card drops its "Steam" chip (`inSection`); icon-only segmented options (the card size) say their
  name on hover (`title`); a shelf's wide art that would be stretched past twice its size (`sharpEnough`, shared with the home's
  `heroArtFits`) gives way to the blurred icon; the opened game shows its whole badge grid on all four (the 60 cap was the same rule
  everywhere, only Xbox's 93 crossed it); on phones a list row's platform tag is the logo (the name stays for a screen reader).
- *One toolbar:* the page is `library-page/LibraryPage` (the route only passes its status), every view puts `LibraryToolbar` under
  the title: search, filters, then order, size, "by platform / all together" and the views. The count under the title shows only
  when the platform tabs and the "All" quick filter do not say it. Steam/PSN/Xbox-only accounts get the title in the cards view too
  (it had none); with no account at all the page says to connect one instead of being blank. `StatusPageSkeleton` follows.
- *`/allGames`:* the library page with `category="all"`: "All games" in the header's Library menu (desktop and phone), every status
  of every platform (Xbox only for admins, through the same hook), the statuses as its quick filters, shelves "continue" then one per
  status, cards always together, a game opening as its own status. Deleted: `AllGamesSection`, `AllGamesSkeleton`, `NoMainHeader`
  and their tests (`useAllGamesGlobal` stays: the home uses it).
- *To try, its own commit (`feat(ui): try a 1760 px column…`):* the four game pages, the friend's game view and the game skeleton
  in a column of at most 1760 px (`GAME_COLUMN`), centred; the backdrop stays full width.
**Already done before, not touched** — "60" beside the heatmap reads "60 achievements" (#128, `MainPageHeatmap` is shared); the
half-slanted toolbar and the uppercase labels in the detail and the table head (#127); the subset thumbnails already had their name as
a native tooltip (`title`) and `alt`; the RA phone card keeps its own date line with the time.
**Decisions** — "Story achievements" over "Logros de la historia: 30 de 30" as a sentence, to fit the figure tiles. The badge grid
cap: no cap in the opened game on any platform (the owner saw a cut only on Xbox; the group cards keep theirs). Steam has no console,
so its previews show no line under the title. On "all" the cards view has no "by platform" switch (a game's status is what the page
sorts by); the platform tabs serve the shelves and the list.
**Open** — Not seen in a browser (needs a signed-in account): check at 2560 and 390 px, both designs, Firefox: the toolbar in the
three views, `/allGames` (shelves, list with the status filters, cards), the game table's earned column and last-cell pin, RA's hide,
the shelf art fallback (Pokémon Colosseum) and the 1760 px column (revert `feat(ui): try a 1760 px column…` if it does not convince;
the revert will touch `src/lib/version.ts`, keep the higher version). Not done: MejBiblioteca 8 (the RA tag on phones) is in this
branch as the logo, but #134 owns the phone pass.
**Watch out** — `LibraryEntry.status` is required; a test fixture building entries by hand may need it. `QuickFilter` now includes
the statuses: `countQuick` returns every key. `formatDate`'s default changed from "03 Oct 2026" to "Oct 3, 2026" (tests pinning the
old one were updated).

---

## 2026-11-11 — Owner calls after the antislop round (`feat/153-owner-calls`, #153)

**Did** — Five decisions the owner took after reviewing #122, #125 and #128, one commit each:
- *Rank names* (`rankings.tiers` in the nine languages; ids and thresholds untouched): Padawan, Aspirante, Cazatrofeos,
  Especialista, Eco oscuro, Élite, Maestría, Leyenda. Padawan is the same in all nine; Eco oscuro takes the game's name
  (Dark Eco); the rest are gender-neutral (epicene words, compounds or abstract nouns). The guide reads `T.rankings.tiers`,
  so it follows; `copy.test.ts` still refuses the old gendered nouns and now pins the Spanish list, Padawan everywhere and
  no two tiers alike. `docs/i18n.md` updated. Cooper and Dark Soul were proposed first and rejected by the owner.
- *RA's phone card:* "HC: 12,345" (`T.achievement.hardcoreShort`, `toLocaleString(lang)`) through the hardcore column's
  `card`, and "by Author" under the data line through a new optional `cardNote` slot on `AchievementTable` / its card
  (the desktop row has none; no other platform passes it).
- *Rarity order:* `sortEntries` puts an unknown rarity last in both directions (it was first when descending).
- *Link cache:* linking RA (user route and admin) clears the user's cache; Steam, PSN and Xbox links (admin; the user
  routes never did) no longer do. Unlinks still clear it. `platformLinks.contract.test.ts` and `docs/accounts.md` follow.
- *Admin Steam unlink mails the account* (`sendSteamLinkNotice`, after the answer, address read back by `unlinkPlatform`).
**Watch out** — `/privacy` and `/terms` do not describe the link notices, so they were not changed. The Eco oscuro names in
German, French, Italian, Polish, Portuguese and Russian were not checked against official localisations: confirm them.

---

## 2026-11-11 — The streak lands whole (`fix/streak-lands-whole`, from `feat/128-home-improvements`)

**Did** — The owner saw the streak show one number on opening the home and another a few seconds later (local, 2026-11-11).
Four places drew a streak before it was whole:
- *The header (every load):* `useStreakSummary` returned `summary?.active?.days ?? 0`, so `StreakBadge` drew "0 d" until
  `/api/me/streak` answered (seconds: the server reads a year of every platform), then the real number. `streak` is now `null`
  until the first answer; the badge draws `StreakTag loading` (new prop: the tag's room in skeleton grey, nothing to read, in the
  catalogue) and the search modal leaves the figure out meanwhile. A failed read is still 0, with `error`.
- *The cover's streak card:* `if (isLoading && !activeStreak)` painted the first platform's streak as soon as it made one,
  then grew as the others landed. Now the skeleton while `isLoading`.
- *Unticked PSN/Xbox consoles:* `useConsoleVisibility` needs that platform's library to know which games are on the console,
  and the year's `isLoading` did not wait for it, so the home counted the hidden console's days until the library landed. It
  now returns `isLoading` and `useActivityHeatmapYear` (the hook) adds it. No new request: the library was already asked for.
- *Before anything is asked:* `ActivityHeatmapYearContext`'s `isLoading` only covered `!wanted` for RA accounts, so a
  Steam/PSN/Xbox-only account had a first render with `isLoading` false and no unlocks (a 0). `!wanted` now counts for all.
**Checked, not the cause** — Steam's year is one answer (`loadSteamYear`, one cache, one route); the two-step load is Steam's
library, not its year. While the session loads the home holds its skeleton (`MainPage`), and the provider reads the same session.
**Header and home** — counted from the same loaders, caches and rules (`lib/meStreak.ts` vs the year in the browser), so whole they
agree. They disagreed while one was partial: the header's 0 beside the home's skeleton, the cover's first platform, the hidden
console's days. What can still differ: reads at different times across a server cache refresh (RA 15 min, Steam 30); the header reads
once and again only when accounts, language, unticked consoles or hidden games change, the home's year when first opened in the tab.
**Tests** — `useStreakData.landsWhole.test.tsx` (real provider and filter; RA, Steam, PSN's year, then the PSN library land in that
order; every streak drawn must be the final one; fails on the old code with a 3 before the 2, and a 0 first for a Steam-only account),
plus `useStreakSummary`, `MainHeader`, `StreakTag`, `useConsoleVisibility`, `useActivityHeatmapYear` and the cover's card.
**Open** — Not seen in a browser (needs a signed-in account). Steam's year still paints from `lastAnswers` when coming back to the home
in the same tab and is read again behind it (#101's rule); a newer answer can move the number then.

---

## 2026-11-11 — The home's improvements from the canvas (`feat/128-home-improvements`, #128)

**Did** — Page 2 of the antislop canvas v2, boards "MejHome", "MejPortada" and "MejPlataformas", one commit per block (cut from
`refactor/125-platform-shells-6`):
- *RetroRatio (V1-01):* RA's card says "RetroRatio 2,85" (`decimal(n, lang, 2)`, `utils/raRatio.ts` `retroRatio`); the key is
  `profileStats.retroRatio` (was `hardcoreRatio`, "Ratio hardcore 285 %"). The avatar's ring no longer reads that number as a percentage
  (≥ 80 → gold, so nearly everyone): `raPlayRing` is the hardcore colour when hardcore points beat softcore, the softcore colour when not,
  neutral with none. RA's global rank moved from the activity row to the card's line ("Member since 2023 / Global rank #16,535", `Facts`).
- *One activity row (V1 "Esta semana" + MejPlataformas 1):* `MainPagePeriodStats` counts every platform's unlocks in both layouts, whichever
  profile tab is open: today, this week, the last 30 days (`pointsStats.last30Days`, was the calendar month), the average and the streak
  (left out on the cover, which has its own card: `streak={null}`). The unit under each figure follows plural rules (`plurals.achievementsWord`,
  nine languages: no more "1 logros" / "1 trofeos"). The four adapters (`MainPagePointsStats`, `MainPageSteamStats`, `-Psn-`, `-Xbox-`) and
  their contract suite are gone; `MainPagePeriodStats.test.tsx` replaces them.
- *Texts:* the heatmap's total says "2133 achievements"; RA's rich presence is its own line under the game, two lines at most
  (`MainPageProfileNowPlaying` `note`), the kicker just "Playing now"; `plurals.todaySome` says the noun ("Hoy llevas 2 logros."); Xbox's
  `xbox.tier` reads "Account" ("Cuenta Silver"); Steam's "Offline" is not shown on your own card (someone else's still says it).
- *The week's chart:* recharts draws the dots in a z-index layer outside the clip that wipes the line in, so they stood alone for 1.5 s.
  `AchievementsLinePlot` draws in 0.6 s, linear, and each dot fades in as the line reaches it (`drawTiming.ts`).
- *The cover:* one line of facts under the title (`Facts`: console / "33 of 51 trophies" / when), the chip and the "33 / 51" beside the bar gone,
  the kicker without the time; the level card says the level once (the ring) with `VaultLevelBadge tierOnly` beside it; "+672 VP" in the text
  colour; a day initial under each of the week's bars (`formatDay(…, { weekday: 'narrow' })`), its skeleton taller by that row.
- *The 99 % ring (V1, MejPortada 1):* the header's level is a grey slot of the badge's size while the points are read, the progress only for a
  screen reader. Why it never resolved: a platform that cannot move (busy PSN or Steam budget, a read that throws and stays `reading` with
  total 0) keeps `complete` false, so `fillProgress` capped at 99 and the page asked 30 passes for nothing, and a failed POST left "calculating"
  on screen. `useVaultFill` now stops (`stopped`) after a failed request, after the passes run out, or when a pass reads no more games than the
  last; `VaultFillProvider` then reports `active: false`, so the header shows the level it has.
**Already done, not touched** — "/" opens an empty search (#118); the heatmap's months in the site's language, one casing (#122, `formatDay`
with `lang`); the streak in its tier colour on every tab (#125 family 3; now one row anyway); "what B brings" (#127: one `Tabs`, sentence-case
card titles and kickers, level / streak / user one family in the header).
**Decisions** — The row counts everything, so the platforms' own totals (Steam level, PSN level and platinum, Xbox gamerscore and achievements,
Steam's two weeks of play) leave the home's row; all but Steam's two weeks and RA's rank were already on the profile cards; the rank went to
RA's card, the two weeks are dropped (ask the owner if they want them on Steam's card). The ring rule is the default the owner was offered (the
canvas draws nothing for it): **owner to confirm**. Not touched (owner): cards inside cards, the cover's order, the heatmap's entrance, the
coloured "finished" figure.
**Open** — Not looked at in a browser: the home is chosen on the server from the session, so it cannot be shown without a signed-in account (and
the session is rebuilt from the database); a signed-out dev server only shows the landing. Check on the preview at 2560 and 390 px, both designs,
Firefox: the cover's facts line and the week's initials, the dots arriving with the line, the header's grey slot, RA's card line with the rank.
The server still records a thrown platform as `reading` with total 0 (`refreshScoreNow`); the client stops now, but the next visit tries again:
making it `error` would toast a failure each pass, left as is. `T.rankings.fillShort` is still used by the account page and the rankings.
**Watch out** — `MainPagePeriodStats` takes `streak: number | null`; the `PointsStats` and per-platform rows no longer exist. The guard's
"no label in capitals" rule matches the word "uppercase" in a comment.

---

## 2026-11-10 — One shell for the game page achievement table, and the pattern for the other families (`refactor/125-platform-shells`, #125)

**Did** — The first family of #125 (antislop D1-01, X1, §3.3), one commit per step, and the pattern written down:
- *The eye:* `reveal-secret-button/RevealSecretButton` (labels passed in) replaces `PsnRevealTrophyButton` and `XboxRevealAchievementButton`
  in the table and in both badge grids.
- *The shell:* `achievement-table/AchievementTable.tsx` (toolbar, notice, scopes, empty and "nothing" states, fold, detail window),
  `-row`, `-card`, `-desktop` (head + rows), `-detail` (the shared `AchievementDetailModal`, lazy, or the platform's own), `tableColumns.tsx`
  (rarity and earned for everyone), `sortable-header/SortableHeader.tsx` (moved from `game-info-table/`). State in `hooks/useAchievementTable.ts`
  (filter, DLC scope, search, order, fold, pins leading, deep link with its reset, scroll and 2.5 s light); pure rules in `utils/achievementTable.ts`
  (`sortEntries`, `earnedRing`, `anchorOf`); the adapter's contract in `types/achievementTable.ts`.
- *The adapters,* at their old paths so the pages did not change: `GameInfoTable` (RA, 92 lines), `SteamGameInfoTable` (61),
  `PsnGameInfoTable` (85), `XboxGameInfoTable` (68). Deleted: the three platforms' row and card, RA's `game-info-achivement/` (row and
  card), `SteamSortableHeader`, the two reveal buttons, and their tests.
- *One shape:* the rows are `CompareAchievement` (`utils/gameCompare.ts`), with a new optional `secret`; each platform has a per-item
  mapper (`raCompareItem(players)`, `steamCompareItem`, `psnCompareItem`, `xboxCompareItem`) and the `*CompareList` functions map with them.
  `badgeClass(ring)` (`ui/dataTable.ts`) takes the ring colour (`earnedRing(row)`: grade, hardcore/softcore, accent).
- *Tests:* `AchievementTable.contract.test.tsx`, 73 tests, `describe.each` over the four adapters built from one neutral spec (order,
  filters and counts, words for earned/locked, the columns' order and `aria-sort`, search, fold, phone cards, detail window, pins and
  leading, secrets, reveal, deep links, the notice line); each adapter's test keeps only its own (PSN DLC tabs and grade, Xbox gamerscore,
  Steam's English guide name, secret picture and "Online?", RA's columns, modes, star and order menu); `utils/achievementTable.test.ts`;
  `RevealSecretButton.test.tsx`. Checked by breaking the deep link's unfold by hand: 3 contract tests failed.
- *Docs:* `docs/platform-shells.md` (where a shell lives, an adapter's props, the contract suite, what stays per platform, the steps),
  linked from `CLAUDE.md` (index and "Look before writing") and `docs/README.md`; `docs/architecture.md` → Components.
**Why** — #125: the table was written three times (four with RA's), 2,079 lines with RA (1,556 without, the audit's 1,554), and the copies
had drifted. Now 1,163 lines for the four: 857 shared, 306 in adapters.
**Decisions** — *Generic over the platform's item:* the shell reads `CompareAchievement` and hands the adapter's slots a `TableEntry<T>`
(`{ item, row, order }`), so an adapter reads its own fields typed and the shell never switches on a platform for something an adapter can
say. `InsightAchievement` was not used: it lacks grade, gamerscore, anchor and hardcore. *Data before flags:* the ring and RA's "Hardcore ·
date" line come from `grade` / `hardcore`; the only flags are `keepSecretIcon` (Steam) and `pinInTitle` (RA's star beside the name, kept
where it was). The favourites and reveal hooks were not merged (that is family 6, HK-02/HK-18): the adapters map them to `pins` / `reveal`.
**Visible changes (drifted copies, fixed)** — *RA's order ran backwards:* its comparators were already descending and the default direction
reversed them again, so the first click on Points, Players or Earned showed the fewest or the oldest (locked first) under a "descending"
head; now most and newest first, locked last, as on the other three. *RA's star* is the shared pin button: its name says what it pins
("Add to achievements to get: X", it said only "Add…"), and on the phone card it has a focus ring and sits on the right. *RA's phone card*
is the shared card: 48 px badge ringed hardcore or softcore (only hardcore was, in the warning colour), "10 pts", the unlock date or "Not
earned yet", "x% have it" and the type tag on one line; the author line and the hardcore count are no longer on the phone card (both are in
the detail window). A filter that leaves nothing on RA shows the line without an empty table head. RA's locked rows say "Not earned yet" to
a screen reader. *Xbox's phone card ring* is the accent (it was green while its row's was the accent). *The eye* uses the library's
`focus-ring` (was a PSN-blue or green ring) and `rounded-icon` (a circle in the round design as before, a soft square in the slanted one: the
guard refuses a hand-set round button). *Steam* rows carry their anchor as `id` like PSN's and Xbox's, and a malformed `#ach-%…` fragment no
longer throws (it crashed the page). Rows and cards mark their anchor with `data-anchor` (was `data-trophy` / `data-achievement` / `data-ach`).
**Open — this family** — *Rarity, descending:* the copies' comment said an unknown rarity sorts last "whichever way", but the code (and
Steam's test) put it first when reversed; kept as the code did, ask the owner. Not looked at in a browser: RA's table and phone card (2560
and 390 px, both designs, Firefox), and the eye's corner in the slanted design. If the owner wants the author or hardcore count back on
RA's phone card, it is a `card` chip on its column. `useAchievementTable` is tested through the contract suite, not with `renderHook`.
**The nine families of #125, in the issue's order (all done; what is left is under "Open — what is left of #125")** (one PR each, or smaller; read `docs/platform-shells.md` first; sizes are
the audit's of 2026-11-06, re-measure: #120 already swept focus rings, platform hex, retries and kickers in these files):
1. DONE The game page table (D1-01), above.
2. DONE (2026-11-10, `refactor/125-platform-shells-2`; below, "Done — families 2, 4 and 9") **Group game cards** (B-01): `groups/sortable-item/SortableItem.tsx` (RA, 195), `steam-sortable-item/SteamSortableItem.tsx` (181),
   `psn-sortable-item/PsnSortableItem.tsx` (165), `xbox-sortable-item/XboxSortableItem.tsx` (166). *Keep:* where each reads its data (its
   context), RA's softcore/hardcore bar, the achievements grid in the panel. *Drifted:* RA's panel slides open (`inert` + grid rows), the
   others mount with `{open && …}`: pick RA's and say so; the "▼" rotated by inline style → `IconChevronDown`; completion ring colours.
   *Traps:* dnd-kit's sortable wrapper and grip must stay the drag handle; Steam's panel uses `steam-game-item/steam-game-item-achievements/`
   (D1-08: it belongs to groups); RA's panel reads `useGameProgression`.
3. DONE (2026-11-10, `refactor/125-platform-shells-3`; below, "Done — family 3") **Home rows and profile pieces** (A-02, A-03, A-06, A-07; ~1,760 lines, split it): stat-pill rows `main-page-charts/MainPagePointsStats.tsx`
   (RA) and `main-page-{steam,psn,xbox}-stats/`; pinned rows `main-page-pinned-games/{pinned,steam-pinned,psn-pinned,xbox-pinned}-game-row/`;
   nav cards `main-page-charts/main-page-{steam,psn,xbox}-nav/` (+ `MainPageBrowse`'s ternary, `SECTIONS` copied in `MainPageConsoleNav`);
   profile `main-page-profile/main-page-profile-{psn,st,xbox}/` (wrappers, `Linked`, `Game`, trophies/achievements, stats). *Keep:* each
   platform's own pills (Steam level + two weeks, PSN level + platinum, Xbox gamerscore + total, RA global rank), RA's soft/hard bar.
   *Drifted:* the streak pill is tier-coloured on RA only (`streakInk(streakTier(n))`); the rule says tier everywhere, so the other three
   change colour (visible: say it). *Traps:* the profile wrappers' `!isLinked` branch is dead (`MainPlatformContext` only picks a linked
   platform): delete it with `T.profileSt.signIn` and its guard exceptions; the home keeps its own keyframes and its profile column's
   min-height (`homeFit`); sections land whole (skeleton until everything is in, `docs/performance.md`); pinned rows are dnd-kit sortables.
4. DONE (see "Done — families 2, 4 and 9") **Status cards** (D2-01, D1-04): `statusGameList/StatusGameItem.tsx` (RA, 206), `steam/steam-status-game-item/` (148),
   `psn/psn-status-game-item/` (129), `xbox/xbox-status-game-item/` (129). *Keep:* chips (RA's console colours from `constants/index.ts`,
   still on the guard's `tag` pending list), progress lines (`PsnTrophyCounts`, `XboxGamerscore`), the completion date (`docs/library.md`:
   `completedAt`, Steam's last unlock, RA's award; never `lastPlayed`), the `*LibraryDetail` panel, hide and pin. *Traps:* Steam builds
   `/steamGame/${id}` by hand where the others call `gameHref` (on someone's profile it leaves the subject: a behaviour change, ask);
   `isComplete` is recomputed inline; the "▼" glyph; the Completed lists order by completion date (#99); `useExclusiveOpen`.
5. DONE (2026-11-10, `refactor/125-platform-shells-4`; below, "Done — family 5", with what was left out: D1-15, D1-16) **Badge grids, feed rows, category cards and sections, expanded layout** (D1-02…06, with D1-09, D1-15, D1-16, D1-20; ~2,000 lines, do it
   as four PRs in this order): grids `psn-trophy-grid/PsnTrophyGrid` (207), `xbox-achievement-grid/` (168), `steam-achievement-grid/` (167),
   RA `achievement-grid/AchievementGrid` (243); feed rows `PsnGameItem`, `XboxGameItem`, `SteamGameItem`, `RaGameItem`, `PsnCollectionItem`;
   sections `{psn,xbox,steam}-category-section/` + `SteamStatusGameList`; expanded `{psn,xbox,steam}-recently-played-expanded/`,
   `PsnCollectionExpanded`, `RARecentlyPlayedExpanded`. *Reuse:* the per-item `*CompareItem` mappers, `TableEntry`, `earnedRing`,
   `RevealSecretButton` (already in both grids). *Keep:* grade rings, PSN's groups inside the grid (`trophiesByGroup`, `PsnTrophyGridGroup`),
   collections fold only in the feed (`docs/platforms/psn.md`), `XboxPartialListNote`, RA's soft bar. *Traps:* `achievementAnchor` lives in
   `SteamAchievementGrid` and three utils import it (move it first, D1-08); `PsnTrophyGrid`'s `GRADE_RING` copies `TROPHY_GRADE_RING`; no Xbox
   read may be added per card (150 calls an hour for the app).
6. DONE (2026-11-11, `refactor/125-platform-shells-5`; below, "Done — families 6 and 7") **Favourite hooks and the PSN/Xbox providers** (HK-02, HK-04, with HK-18): `hooks/usePsnFavoriteTrophies` (96), `useXboxFavoriteAchievements`
   (96), `useSteamFavoriteAchievements` (117), `useRaFavoriteIds` (86); `context/PsnGamesDataContext`, `XboxGamesDataContext`;
   `useRevealedTrophies` / `useRevealedAchievements`. *Keep:* RA's providers (retry loop, `useRetryingRead`) and Steam's two-step library stay
   as they are (only the PSN/Xbox twins merge); each source's id column (`psn_trophy_id`, `xbox_achievement_id`, `steam_apiname`,
   `achievement_id`) and RA's POST body; the reveal hooks' stored keys (synced preferences). *Drifted:* Steam resets its stars on another game
   (`useWhenChanged`), the others show the old game's until the answer; RA has no `canPin`/`error` and does not wait for `authenticated`.
   *Then:* the table adapters' `pins` / `reveal` lines become one call each. Providers load on their first reader and memoize their value
   (`docs/performance.md`, HK-03).
7. DONE (2026-11-11, same branch; below, with D1-15 and D1-10) **Game page routes' states** (AP-03): `app/(main)/psnGame/[id]/page.tsx`, `steamGame/[appId]/page.tsx`, `xboxGame/[id]/page.tsx` (304 lines),
   the retry in `gameInfo/[gameId]/page.tsx`; with D1-15 (`user-game-page/*` bodies, the width trio ×12). *Keep:* each platform's failure words
   (`docs/platforms/README.md`: private vs refused vs busy), Xbox for admins only. *Traps:* the pages hold their skeleton while the session is
   read (#118: a full load of an Xbox page was a 404 before); a game 404 answers HTTP 200 (streaming, `notFound()` on the client); the empty
   case is handled by the page before the table (the table's own empty state only fires for RA).
8. DONE (2026-11-11, `refactor/125-platform-shells-6`; below, "Done — family 8") **Link and unlink** (AP-02, B-06, E-10): routes `api/updateRaUser`, `api/psn/link`, `api/xbox/link`, the four unlink routes ↔
   `api/admin/users/accounts/route.ts` → `lib/platformLinks.ts`; account `user-psn-card-form` / `user-xbox-card-form` (one form), the identity
   block in `UserPlatforms`, `UserSteamCard`, `UserPsnCard`, `UserXboxCard`, RA's card inline in `UserPlatforms` and copied in
   `ConnectAccounts`; admin `AdminLinkedAccounts` (the 36-line block ×4) and `AdminUserCard`. *Keep:* user and admin routes keep their own
   auth, validation, logging (`logAdminAction`) and answers; users link Steam only through Steam (admins type); RA keys sealed (`readRaKey`,
   `raid_hash`); PSN/Xbox ids not unique on purpose; link mails; `onPlatformLinked`. *Traps:* the housekeeping differed (the audit found the admin PSN/Xbox
   link clearing the cache and the user one not; #118 fixed only the admin unlink): check again, the owner picks; Steam unlink clears `steam_login_id` and forgets `steam_unlocks`. No migration.
9. DONE (see "Done — families 2, 4 and 9") **Renames** (D1-08), alone because it touches many imports: `steam/steam-pin-achievement-button/SteamPinAchievementButton` →
   `pin-achievement-button/PinAchievementButton` (the table shell, the grids, `AchievementDetailModal`), `achievementAnchor` → `utils/steamTitles.ts`
   `steamAchievementAnchor`, `RARecentlyPlayed` → `RecentlyPlayedFeed`, `steam-game-item-achievements/` out of `steam-game-item/`, the
   show/hide-achievements keys RA reads from `T.steam` into a neutral namespace (nine languages). `SteamSortableHeader` is already gone.

**Done — families 2, 4 and 9** (`refactor/125-platform-shells-2`, one commit each, 2026-11-10; the shells follow `docs/platform-shells.md`):
- *Family 2, group cards:* `groups/group-game-card/GroupGameCard` (dnd-kit sortable, grip, remove, the sliding panel; its view model is
  `GroupGameCardView` in `types/gameCard.ts`) and the four adapters at their old paths (`SortableItem` 79 lines, `SteamSortableItem` 74,
  `PsnSortableItem` 68, `XboxSortableItem` 75; RA's panel, which reads `useGameProgression`, is `sortable-item-achievements/`). 707 lines
  → 464, plus the shared pieces below. Contract: `GroupGameCard.contract.test.tsx` (4 platforms × 8, finished-mark × 3); each adapter's test
  keeps only its own (live vs stored numbers, Xbox's unknown total and play time, RA's two modes and points).
- *Family 4, status cards:* `status-game-card/StatusGameCard` (open state through `useExclusiveOpen`, hide, pin, `LibraryDetailRow`,
  `StatusGameCardView`) and the four adapters (`StatusGameItem` 73, `SteamStatusGameItem` 68, `PsnStatusGameItem` 55, `XboxStatusGameItem`
  57; RA's awards, lines and detail are `statusGameList/status-game-item-{awards,lines,detail}/`). 612 lines → 449 plus the shared pieces.
  Contract: `StatusGameCard.contract.test.tsx` (links, progress, hide/pin as the right source, detail row per list, exclusive open,
  finished mark, play time, finished-vs-last-played date). Checked by breaking `inert` and the exclusive-open key by hand: both suites fail.
- *Shared by both (`game-card-*/`, 166 lines):* cover (`COVER_IMAGE`, ring by `CoverRing`), title, mark (the ★ chip), progress (text + bar +
  %, green only in the text and the %), line, playtime, dates (`validCompletionDate` → "Finished" in Completed else "Last played"),
  platform tag, expand button; `ra-console-tag/RaConsoleTag` (a `Tag` now, so the two `tag` entries for these files left
  `uiGuard.pending.json`).
- *Family 9, renames:* `SteamPinAchievementButton` → `pin-achievement-button/PinAchievementButton`; `achievementAnchor` →
  `utils/steamTitles.ts` `steamAchievementAnchor` (`gameCompare`, `gameInsights` and `pinnedView` no longer import a component);
  `RARecentlyPlayed` → `recently-played-feed/RecentlyPlayedFeed` (its `ra-recently-played-expanded/` moved in with it, name kept: family 5);
  `steam-game-item-achievements/` up to `steam/`; `T.steam.showAchievements` / `hideAchievements` → `T.cards.*` in all nine languages
  (Xbox keeps its own).
- *Visible changes (drifted copies, fixed):* **(a)** the focus ring on the grip, the title and the expand button is the accent (`focus-ring`) on
  all eight cards; Steam, PSN and Xbox used their platform colour. **(b)** Steam, PSN and Xbox group cards slide their panel open like RA's
  (`inert` + grid rows) instead of popping in; it is built the first time it opens and kept, so closing slides. **(c)** The "▼" glyph is an
  `IconChevronDown` (16 px, was a 12 px glyph) on all eight cards. **(d)** The Xbox group card's empty detail line was a plain space, so
  it collapsed and the card was shorter than the others; it keeps its room now. **(e)** PSN and Xbox status cards read the finish date through
  `validCompletionDate` like Steam's: an unparseable one falls back to "Last played" instead of "Finished · —". **(f)** RA's group title link
  takes `min-w-0` like the others. Everything else (ring colours, chips, texts, order of lines) is as before.
- *Left as it was, on purpose:* RA's group card has no done ring or chip (the status card has the hardcore ring; the group never had either);
  `GameCardProgress` is one more "bar + %" next to D2-04's 22 copies: moving it (with `LibraryEntryProgress`) into `ui/` and replacing the
  copies in `main-page/*`, `RaGameItem`, `PsnCollectionItem`… is still open, as is giving the pinned rows and the feed rows (`RaGameItem`,
  `SteamGameItem`, `XboxGameItem`) the same expand button and cover (families 3 and 5; they still draw "▼" by hand).
- *Not looked at in a browser:* the group page and the category lists at 390 and 2560 px, both designs, Firefox; the chevron and the slide
  on Steam, PSN and Xbox group cards in particular.

**Done — family 3, the home's pieces** (`refactor/125-platform-shells-3`, one commit per sub-family, 2026-11-10; shells follow `docs/platform-shells.md`):
- *Stat pills (A-02):* `main-page-period-stats/MainPagePeriodStats` (today / week / month / average / streak, the period maths, the three
  lazy modals, the skeleton; `measure` points or unlocks, `unit`, `before` / `after` for the platform's own pills, which keep their room
  while they load) and four adapters (`MainPagePointsStats` 49 lines, Steam 50, PSN 48, Xbox 47). 411 → 313. Contract:
  `MainPagePeriodStats.contract.test.tsx` (4 platforms × 5, own-pills × 3).
- *Nav cards (A-06):* `main-page-browse/main-page-platform-nav/MainPagePlatformNav` + `main-page-platform-nav-section/`, the three adapters
  (21 lines each) and `browseSections.ts` (`BROWSE_SECTIONS`, the lists' emoji and slug, shared with the RA console nav). The nav cards and
  `MainPageConsoleNav` moved from `main-page-charts/` into `main-page-browse/`, their only user; `MainPageBrowse` picks by a map, not a ternary.
  270 → 187. Contract: `MainPagePlatformNav.contract.test.tsx` (3 × 4).
- *Pinned rows (A-03, A-05):* `main-page-pinned-games/pinned-game-card/PinnedGameCard` (the sortable wrapper, handle, cover, title, bar, unpin,
  opening; the view model is `PinnedGameCardView` in `types/gameCard.ts`; `placeholder` keeps the sortable slot while loading, on error or for a
  pin whose game is gone) and four adapters; `pinned-game-missing/` is the PSN / Xbox "unlinked" row. `GameCardCover` got `compact`
  (`COVER_ROW_IMAGE`, 56 px). 517 → 376. Contract: `PinnedGameCard.contract.test.tsx` (4 × 5, gone × 2). Checked by breaking the open
  panel by hand: 4 tests failed.
- *Profile column (A-07):* `main-page-profile-linked/MainPageProfileLinked` (skeleton, error card, refresh on the own page only, order of
  card / game / recent), `main-page-profile-library-game/` (the PSN and Xbox last-game card), `main-page-profile-recent/MainPageProfileRecentList`
  (one mapping per platform, RA included). 625 → 619 only: the shells took the glue, but the platform's own headers, stats and hooks are the
  bulk and stay. Contracts: `MainPageProfileLinked.contract.test.tsx` (3 × 5) and `MainPageProfileRecentList.contract.test.tsx` (4 × 3, 3 × 1);
  the adapters' tests keep only their own (level, status, country, grade, gamerscore, featured game).
- *Visible changes (drifted copies, fixed):* **(a)** the streak pill is tier-coloured (`streakInk(streakTier(n))`) on Steam, PSN and Xbox, as
  RA's was; they were `text-accent`. **(b)** RA's pinned row opened from a `div role="button"` with a button inside it (no Space, a "▼" with no
  label); it is a real expand button now, like the others. **(c)** On every pinned row the whole header opens the achievements (a button
  stretched over it, as the group and status cards do); Steam, PSN and Xbox opened only from the chevron. The grip, title, cover link and
  unpin sit above it. **(d)** The chevron is the shared 16 px `GameCardExpandButton` (was a 14 px one, or a "▼" glyph on RA). **(e)** The focus
  ring on the pinned rows' grip, title and chevron is the accent (`focus-ring`); Steam, PSN and Xbox used their platform colour. **(f)** The
  pinned cover is the shared `GameCardCover`: it takes the hover ring of the other cards, and RA's is out of the tab order and hidden from a
  screen reader like the others (it duplicated the title link). RA's console icon has no alt (the name follows it). **(g)** The Steam nav
  icons go through `GameIcon` (Steam's own fallbacks) like PSN's and Xbox's, and the nav counts hold a placeholder while loading instead of
  a "—". **(h)** The aria-busy skeleton of the stat pills is on RA's row too.
- *Left as it was, on purpose:* the stats figures of the profile (`MainPageProfile*Stats`, 4 files of one grid of `Figure`s each: the figures are
  each platform's own); `MainPageProfileStGame` and `MainPageProfileRaGame` (Steam's running game and RA's hardcore bar differ from the
  library games); `MainPageProfileRa` (it has no loading / failure of its own: its page does); A-04 (static modal imports) is already done in
  the stats shell; `MainPageCharts`' per-platform ternaries (A-20) and the dead wrappers' `!isLinked` branch and `T.profileSt.signIn` (A-07,
  A-23) were already gone when this started. The pinned rows keep mounting their panel only while open (the group cards slide theirs): the
  pinned section shows one open row alone, so there is nothing to slide to.
- *Not looked at in a browser:* the home at 390 and 2560 px, both designs, Firefox: the pinned rows' stretched header (does the whole row
  still drag by its grip and open by a click elsewhere?), the profile column's height across tabs (`homeFit`, the min-height), and the stat
  pills' streak colours on each platform's tab.

**Done — family 5, grids, feed rows, sections and the opened game** (`refactor/125-platform-shells-4`, one commit per part, 2026-11-10; shells follow `docs/platform-shells.md`):
- *Badge grid (D1-02, D1-12 in part):* `badge-grid/BadgeGrid` (generic over the platform's item; the tooltip in `hooks/useBadgeTooltip`, one
  badge in `badge-grid-badge/`, the tooltip's "x% have it" and "Earned" chip in `badge-tip-parts/`; the adapter's slots are `name`, `label`,
  `href` or `onSelect`, `ring`, `icon`, `secret` + `reveal`, `pins`, `tip`, `corner`, `sections`). `AchievementGrid` (167 lines, was 231),
  `SteamAchievementGrid` (67, was 155), `PsnTrophyGrid` (88, was 194; its DLC folds are the `sections` slot, its ring is `TROPHY_GRADE_RING`,
  the `GRADE_RING` copy is gone) and `XboxAchievementGrid` (69, was 161) are adapters at their old paths. RA keeps its image preloading and
  its window; the shell's `loading` prop holds skeletons for what is shown and the badges out of sight until then. 741 → 391 + 337 shared.
  Contract: `BadgeGrid.contract.test.tsx` (4 platforms × 6, pins × 2 for three, secrets × 2 and the eye × 2 for the ones that have them, RA's
  window). Checked by taking away `onBlur`: 4 tests failed.
- *Feed row (D1-03):* `feed-game-card/FeedGameCard` (the controlled-or-local open state, the stretched expand button, links, chip, bar, facts,
  pin; the view model is `FeedGameCardView` in `types/gameCard.ts`, the clock-and-hours fact is `feed-game-card-playtime/`) and five
  adapters (`RaGameItem` 85, `SteamGameItem` 64, `PsnGameItem` 57, `XboxGameItem` 61, `PsnCollectionItem` 59). 693 → 326 + 144 shared.
  `PLATFORM_LOGO` is now exported by `GameCardPlatformTag` (the section shell uses it too). Contract: `FeedGameCard.contract.test.tsx`
  (5 platforms × 6, the link and pin ones for the four that have them, play time for the three that have it).
- *Category section (D1-05):* `platform-category-section/PlatformCategorySection` (the hook's result, how to count and preview, the words) and
  three adapters (`PsnCategorySection` 52, `XboxCategorySection` 52, `SteamCategorySection` 60 with its partial-progress note);
  `SteamStatusGameList` (a one-caller wrapper) is gone. 292 → 164 + 112. Contract: `PlatformCategorySection.contract.test.tsx` (3 × 8).
- *Opened game (D1-06, D1-09):* `game-expanded-layout/GameExpandedLayout` (ring, chart, grid, side panel: the four panel strings once, the
  ring and the chart's `isLoading` inside it), `badge-grid/lazy-badge-grid/LazyBadgeGrid` (skeleton → failure with retry → "nothing" → the
  grid) and `badge-grid-skeleton/`. `Psn-`, `Xbox-`, `SteamRecentlyPlayedExpanded` and `PsnCollectionExpanded` (50, 53, 57, 71) and
  `RaRecentlyPlayedExpanded` (75; renamed from `RARecentlyPlayedExpanded`, now a default export like its siblings) use the layout; the
  three `*GameItemTrophies` / `*GameItemAchievements` of the group cards use `LazyBadgeGrid` (46, 46, 43). 572 → 441 + 114 shared. Contract:
  `GameExpandedLayout.contract.test.tsx` (PSN, Xbox, Steam × 7; the collection and RA keep their own tests).
- *D1-20:* `asCategory` is one function in `utils/utils.tsx`, not four.
- *Visible changes (drifted copies, fixed):* **(a)** the badge's focus ring is the library's accent (`focus-ring`) on all four grids; PSN, Xbox
  and Steam used white (little contrast on a light theme), RA the accent. **(b)** RA's badges open their tooltip at once on keyboard focus, as the
  other three did (RA waited 450 ms); and its hover timer no longer stacks. **(c)** A badge with no picture shows the "?" stand-in on Steam
  and RA too (a blank grey square before). **(d)** RA's grid is a list (`ul` / `li`) like the others. **(e)** The focus ring on the feed row's
  title and expand button is the accent on Steam, PSN, Xbox and the collection (their platform colour before); RA's already was. **(f)** The
  PSN collection's row has its icon with the same shadow as the other rows, and the focus ring of its expand button is around the progress
  block (it was around the whole card): its title and icon are plain text now but the whole row still opens (the button is stretched over it,
  as in the other rows). **(g)** The category sections' loading skeleton reads `STATUS_GRID_COLS` like the list (adds `items-start` and
  the dense flow, no change in columns).
- *Left as it was, on purpose:* the feed row's chevron is inside its own stretched button, a 14 px `IconChevronDown`, not the 16 px
  `GameCardExpandButton` of the status and group cards (the whole body is the button there, so a separate chevron button would nest); RA's
  `SortableItemAchievements` keeps its own skeleton / failure / empty (it asks for the game on first open and shows `SectionFallback`); Steam's
  tooltip chip colours stay literal per platform (D1-14, platform tokens are separate).
- *Left out:* D1-15 (the user game page bodies, in family 7 with the routes' states) and D1-16 (the blurred hero backgrounds ×4: they were not
  in this round's parts; the four tuned values would pass as props to one `GameHeroBackdrop`); D1-10 (the three "rarest earned" side panels, whose
  Steam link still leaves the viewed profile: ask the owner before unifying).
- *Not looked at in a browser:* the badge grids at 390 and 2560 px, both designs, Firefox (the focus ring on an earned badge, RA's `ul`
  against the old `div`); the feed rows (does the PSN collection's focus ring look right, do the rows still stretch to the feed's height);
  the category pages' loading skeleton; an opened game in the feed at 1280×800 and ~800×450.

**Done — families 6 and 7, hooks, providers and game page states, plus D1-10** (`refactor/125-platform-shells-5`, one commit per part, 2026-11-11;
shells follow `docs/platform-shells.md`). Non-test source 1,459 → 1,019 lines (−440), tests +692 −515:
- *Pins (HK-02):* `hooks/useAchievementPins(spec, gameId, gameTitle, extra?)` replaces `usePsnFavoriteTrophies`, `useXboxFavoriteAchievements`,
  `useSteamFavoriteAchievements` and `useRaFavoriteIds`. A `PinSpec` per platform (`RA_PINS`, `STEAM_PINS`, `PSN_PINS`, `XBOX_PINS`: source, the
  row's id column, the id's name in the query and body, `idOf`) is all that differs; it answers `{ pins, error }` where `pins` is the table's
  `PinControl`, so every adapter's pins line is `pins={pins}`. Contract: `useAchievementPins.test.ts` (4 platforms × 9). Checked by taking
  away the rollback: 8 tests failed. RA's pin body now carries `source: 'ra'` and its list read is `source=ra&gameId=` (the route reads a missing
  source as RA, so the same answer); its unpin is `?achievementId=&gameId=` (the route reads `achievementId` first).
- *Reveal (HK-18):* `hooks/useRevealed(byDefault, idOf)` (returns the table's `RevealControl`) replaces `useRevealedTrophies` /
  `useRevealedAchievements`; `hooks/useStoredSwitch(key, off, on)` is under `usePsnRevealHidden`, `useXboxRevealSecrets` and
  `usePsnPlatinumCompletes` (the stored words `conceal`/`reveal`/`full`/`platinum` are the synced keys' values: unchanged).
- *PSN and Xbox libraries (HK-04, HK-03):* `context/consoleLibrary.tsx` → `createConsoleLibrary({ source, url, errorFrom, always })` returns
  `{ Provider, useData }`; the platform's provider is the session id plus (PSN) the platinum map, and `usePsnGamesData` / `useXboxGamesData`
  are `useData`. Loads on its first reader (`request()`), never at mount, and the value is memoized now (a session update no longer
  re-renders every reader). 293 → ~150 + the two adapters. RA's providers and Steam's two-step library are untouched.
- *Platform reads (#119's Open, HK-06/07):* `hooks/usePlatformRead(url, spec)` (loading derived from "no answer for this url", the effect only
  starts the fetch, retry is a handler, one fetch per url through `fetchShared`) replaces the `hasFetched` refs of `usePsnSummary`,
  `useXboxSummary`, `useSteamProfile`, `usePsnTrophies` and `useXboxAchievements`. `fromRa…fromXbox` (`gameInsights.ts`) are the per-item
  compare mappers plus points, kind and link.
- *Game page states (AP-03, D1-15):* `components/game-page-states/` (`GamePageNotLinked`, `GamePageLibraryError`, `GameTableState` = skeleton /
  error with hint and retry / empty / the table, `GameTableLoading`, `GAME_SECTION_WIDTH`) used by the PSN, Steam and Xbox routes;
  `user-game-page/user-game-compare-body/UserGameCompareBody` and `user-game-not-in-list/` by the four user game bodies; the shared props type
  moved to `types/userGamePage.ts`. Kept from #118: the session is waited for (`status === 'loading'` → skeleton) before a 404 or "not
  connected", a game 404 is `notFound()` on the client, Xbox for admins only, an Xbox library that cannot be read says try later with a retry.
- *D1-10:* `rarest-earned/RarestEarned` (rows from a 20-line adapter per platform, `ring` for the picture's colour); the link stays on the
  viewed profile (`gameHref(source, id, subject)`, #118's decision). Contract: `RarestEarned.contract.test.tsx` (3 × 6).
- *Xbox calls: the same.* `usePlatformRead` asks once per url (`fetchShared`, the same function the old hooks called) and no retry loop was
  added; `createConsoleLibrary` still loads on the first reader and for an enabled account only. `usePlatformRead.test.ts` counts the calls of
  `useXboxAchievements`, `useXboxSummary` (and none for a user who may not use Xbox) across re-renders. The pin read for Xbox is one GET per
  game page as before (`/api/favorites` is our database, not OpenXBL).
- *Visible changes (drifted copies, fixed):* **(a)** PSN's game page says "could not load your games" with the reason and a retry when its
  library fails, instead of a 404 (pending from #118). **(b)** Pins reset on another game on every platform (Steam did; the rest showed the
  old game's stars until the answer). **(c)** RA's star is only offered to a signed-in viewer on their own page, like the other three (it was
  always shown; on a signed-out or someone else's page the read just failed); RA waits for the session before reading its pins. **(d)** The rarest
  panels' link focus ring is the accent on all three (platform colour before). **(e)** On RA, `fromRa` reads an empty hardcore date as none
  (`||`, as the compare table did; `??` before): only matters for a `''` that RA does not send.
- *Left out:* the `hasFetched` hooks are not providers (each page reads its own; several readers of one url already share the request while
  it is in flight), so "first reader" is the reader mounting; `usePsnCollectionTrophies` is a third copy of the trophy fetch (not in the list,
  left); D1-16 (blurred hero backgrounds); the RA game route (`gameInfo/[gameId]`) keeps its own error screen (its retry already is `Button`).
- *Not looked at in a browser:* the three game pages' error and empty cards (now `SURFACE` + `Button`, same classes), PSN's new library error,
  the user game pages at 390 and 2560 px, the rarest panels' focus ring in both designs.
**Done — family 8, link and unlink** (`refactor/125-platform-shells-6`, one commit per part, 2026-11-11; shells follow
`docs/platform-shells.md`). The 18 files of the family 1,583 → 1,405 lines with the four new ones (−178); tests +677 −503:
- *SQL (AP-02):* `lib/platformLinks.ts` (67 lines): `linkSql` / `unlinkSql` from one column table (`LINK_COLUMNS`, `UNLINK_COLUMNS` = the link
  plus Steam's `steam_login_id`), `saveRaLink` (seals the key: `"raUser"`, `rausername`, `raid`, `raid_hash`), `saveLink` (admin Steam, PSN,
  Xbox), `unlinkPlatform` (the UPDATE, then `clearUserCache`, Steam's `forgetUnlocks` — unlocks and play time — and `forgetUser`; throws only
  when the write fails, before anything else is touched) and `PSN_ONLINE_ID` (was written twice). Used by `updateRaUser`, `psn/link`,
  `xbox/link`, `unlinkRaUser`, `steam/unlink`, `psn/unlink`, `xbox/unlink` and `admin/users/accounts`. Every route keeps its own auth
  (`requireSession`, `requireXboxUser`, `requireAdmin` first), checks, status codes and bodies, `logAdminAction` (same action and data),
  `onPlatformLinked` where it was, and mails (`sendSteamLinkNotice` on the user's Steam unlink; the callback's link mail is untouched).
  Steam's OpenID callback (`linkSteam`) keeps its own SQL: it is the only writer of `steam_login_id`. The sign-up's INSERT (`api/users`)
  stays: it writes the whole row. Column names are constants; every value is a parameter.
- *How it is held to "the same":* `lib/platformLinks.test.ts` pins the generated SQL character for character against the eight strings the
  routes wrote by hand (and the `RETURNING username, email` of Steam's user unlink). `app/api/platformLinks.contract.test.ts` (61 tests with
  the lib's): `describe.each` over the four user unlinks (401 signed out with no query; 200 `{ ok: true }`, the exact SQL with `['7']`, cache,
  user row, Steam unlocks only for Steam; a failed write is the same 500 body per route and touches nothing), the three user links (exact
  SQL and values, `forgetUser`, `onPlatformLinked(7, platform)`, no cache clear; a failed write is the same 500 and nothing is scored), the
  four admin unlinks and links (a locked panel gets the auth answer and nothing runs; exact SQL with `[11]`; the same housekeeping;
  `logAdminAction` with the same action and data; no mail, no scoring; a failed write is a 500 and nothing is logged); Steam's mail; Xbox's
  403 for a non-admin. The four unlink route tests and the admin test's unlink cases moved into it; each link route's own test keeps its
  platform's checks. Checked by moving `forgetUnlocks` to PSN by hand: 6 tests failed.
- *Account cards (B-06):* `UserPlatformCard` takes `identity` as data (`{ avatar, fallback, name, id, note }`, drawn once) and `disconnect`
  (`{ label, busyLabel, run, done }`: the card draws the danger `Button`, holds it while it runs, toasts `done` or `T.toast.unlinkFailed`);
  `action` is only the not-connected control. `user-platform-link-form/UserPlatformLinkForm` replaces `UserPsnCardForm` and `UserXboxCardForm`
  (ids `psn-online-id` / `xbox-gamertag`, max 16 / 20 kept). `user-ra-card/UserRaCard` (its stats, the RA modal, `hint` for the connect screen)
  leaves `UserPlatforms` (now 26 lines) and replaces the copy in `ConnectAccounts`. The link hooks lost `isUnlinking` (the card holds it).
  Contract: `UserPlatformCard.contract.test.tsx` (4 × 3, form × 3 for PSN and Xbox); the adapters' tests keep their own numbers and errors;
  `UserRaCard.test.tsx`. Checked by toasting success on a failed unlink: 4 tests failed.
- *Admin panel (E-10):* `utils/adminPlatforms.ts` (`ADMIN_PLATFORMS`: name, the two fields — linked id, shown name — and the boxes;
  `adminAccount`, `adminAccountChanges`) drives `AdminLinkedAccounts` (226 → 133, `PlatformLogo` and `Button`) and `AdminUserCard`'s rows
  (4 × 6 lines → one map). Contract: `AdminLinkedAccounts.test.tsx` (4 × 3: link sends every box and reports, a refusal in its own block,
  linked shows the account and unlinks). Each block is a named `group`.
- *Visible changes (drifted copies, fixed):* **(a)** RA's Disconnect is held while it runs, like the other three (it could be pressed twice;
  RA has no "Disconnecting…" text, so its label stays). **(b)** Admin: Unlink is the library's danger `Button` (`sm`, tinted with a ring) instead
  of a hand-set red text button; the logos go through `PlatformLogo`, so RA's is 10 px tall like everywhere else `PlatformLogo` draws it (was
  12); on the user cards an unlinked logo is `opacity-30 grayscale` on all four (Steam, PSN and Xbox were a 30 % grey). **(c)** Admin: an account
  linked with no name shows its id on the user card too (a Steam account whose persona Steam did not send showed "—" there while the
  linked-accounts block said linked). **(d)** The admin Xbox link `return`ed its handler's promise without `await`, so a failed write escaped
  the route's `catch` (an unhandled rejection); it is the route's own 500 `Internal error` now. **(e)** `ConnectAccounts` lost the stale
  comment that Steam's name is typed there.
- *Kept as it was, on purpose (the owner's call, not drift to fix blindly):* **the cache on link.** A user's RA, PSN and Xbox link and the
  admin's RA link only drop the cached user row; the admin's Steam, PSN and Xbox links also `clearUserCache`. Both sides are written as they
  were and the contract pins each. Neither is clearly right: PSN, Xbox and Steam caches are keyed by the platform's account, so clearing after
  the link only throws away the summary the link itself just read (one more OpenXBL call on Xbox's 150 an hour), while RA's are keyed by our
  user id (`ra:…:<userId>:…`), so linking a *different* RA account straight over a linked one (the admin route accepts it; the account page
  only offers linking once unlinked) would serve the old account's settled year buckets. If the owner wants one rule: clear on link for RA
  only, or clear before the verify read. **The admin's Steam unlink mails no one** (the user's does): admin changes are logged instead, as
  admin links are.

**Open — what is left of #125** (nothing blocks closing the issue; these are follow-ups or the owner's calls):
- *Owner's calls:* the cache on link and the admin Steam unlink mail (above); rarity descending in the table (family 1: an unknown rarity
  sorts first when reversed); whether RA's phone card gets its author / hardcore count back (family 1).
- *Not done, outside the nine families:* D1-16 (the four blurred hero backgrounds → one `GameHeroBackdrop` with the tuned values as props);
  `GameCardProgress` into `ui/` with D2-04's 22 "bar + %" copies; the pinned and feed rows' own chevrons (families 3 and 5);
  `usePsnCollectionTrophies` (a third copy of the trophy fetch); the twin `usePsnLink` / `useXboxLink` (link by name, same shape); the RA game
  route's own error screen; `useAchievementTable` has no `renderHook` test of its own (the contract covers it).
- *Never looked at in a browser* (390 and 2560 px, both designs, Firefox): the game page table and RA's phone card, the group and status
  cards, the home's pinned rows and stat pills, the badge grids, feed rows and opened games, the game pages' states, and now the account
  cards (RA's held Disconnect, the identity block), `ConnectAccounts` and the admin panel's linked accounts and user cards.
**Watch out** — `toRow` and `items` must be stable (a module-level mapper, or `useMemo`): the deep link's reset runs when `items` changes,
and an inline sort would reset it every render. The deep link looks for `data-anchor` on rows and cards; `anchor` is unencoded and the
fragment is decoded before comparing. `badgeClass` takes a ring colour, not a state.

---

## 2026-11-09 — Every text through T, one name per thing, copy fixes (`fix/122-texts-i18n`, #122)

**Did** — Antislop D2-03 / C-08 / E / AP-12 / A-18 and CP, plan S8, one commit per block:
- *Texts into `T`, nine languages:* `GameHashesModal` (all Spanish: title, error, empty state, count as `plurals.hashes`, patch link, copy label),
  `AchievementModal` (rarity, author, true ratio, created, recent unlocks, comments, a real load-error sentence in place of "Error 500"),
  `AchievementGrid`'s tooltip (pts, Hardcore, Softcore), the header ("Home", "Go back", "Main navigation", the search button),
  `NoMainHeader`, `PinGameModal` ("Game ID", "Remove"), `GameInfoSubsetSelector` ("Main game"), the heatmap's refresh label, `"pts"` in a dozen places
  (`T.libraryDetail.pointsShort`), "HC"/"SC" (`achievement.hardcoreShort`/`softcoreShort`), "Hardcore"/"Softcore" in a tooltip and a screen-reader line,
  `${n}d` in the streak figures (`rankings.daysShort`), and `DayAchievementsModal`'s "completions" word (it split `T.streak.completions`, which breaks in
  any language whose noun is not first; now `dayModal.completions`). "Menú" / "Close menu" and the ✕ were already done by #121.
- *Raw errors:* `src/utils/apiErrors.ts` (`signupError`, `profileFieldError`, `groupError`): `POST /api/users` (was Spanish sentences),
  `POST /api/updateUserProfile` (English sentences) and the groups routes (`message` in Spanish, now `error` codes; `groupValidation` returns `code`) answer
  codes, and the sign-up form, `EditProfileModal`, `LocationModal`, `useSaveProfileField` (so gender, description and avatar link) and `GroupModal`
  say them in `T`; anything unknown is the generic text, never `data.error`. The two category pages showed the thrown error ("Unknown error", a status)
  and now say `categoryPage.loadError`. Tests per code (route and util) and per form.
- *Dates in the reader's language:* `AchievementGrid`, `AchievementModal` (created, unlocks, comments), `GameInfoComments`, `DayAchievementsModal`,
  `Week`/`PeriodAchievementsModal` (also the week's hint, which printed a raw ISO date) and the heatmap's month names use `formatDate`/`formatDay`
  with `lang`; `GameInfoAchivement` and `AchievementDetailModal` use `formatUnlock`. Numbers: `toLocaleString(lang)` in `AchievementModal`, `MainPageBestPeriod`,
  `CollectionNumbers`, `PublicUserPlatforms`, `PublicUserDuelRow` (its default had none).
- *RA strings with no zone:* `LibraryListRow`, `LibraryDetailMilestones`, `LibraryGameDetail`, `ShowcaseTile` and `StatusGameItem` (×3) moved to `formatDate`. Checked
  first: RA's `LastPlayed`/`DateEarned`/`DateAwarded`/`Submitted`/`DateCreated` are "YYYY-MM-DD HH:MM:SS" in UTC (the fixtures and `docs`/#118 say so; `parseUnlockTime`
  reads them as UTC), `AwardedAt`/`HighestAwardDate` come as ISO with an offset, and Steam, PSN and Xbox send ISO with `Z`. `formatDate` reads every one of those at its
  real moment and shows the day in the reader's zone, which is the right day; `new Date(x)` read the zone-less ones as local, so a day near midnight shifted by the
  viewer's offset (and `GameInfoAchivement` showed the hour shifted too). A date-only string ("2024-01-01") reads as UTC midnight in both, so nothing got worse.
- *One name per thing (CP-05, 07, 11, 13):* see `docs/i18n.md` → Vocabulary. RA is connected, never signed in (keys `userData.connectRA`, `userConfig.disconnectRA`,
  `raLoginModal.connect`, `profileRa.connect`); connect/disconnect, "PlayStation" on buttons, toasts say connected/disconnected in every language; Spanish
  "biblioteca" (no "librería"), "Tu bóveda", "Puntos Vault", "Maestrías", "Correo", "Detalles del juego", "En progreso", "Editora/Desarrolladora" once; "Add to / Remove from
  achievements to get" and its load error; "Not started" in place of the "No achievements" that read as "the game has none" (CP-08).
- *Gender (CP-06):* rank names are abstract nouns in seven languages, `lastAdmin` and `yourRank` (es, pt) and `linkedAs` rephrased; in the same lines Polish "byłeś"/"zarejestrowałeś"/"zdobyłeś",
  Italian "sei passato / iscritto" and French "venu / inscrit" are neutral too.
- *Em dashes (CP-09) and the landing (CP-04):* no em dash in a live string in eight languages (a colon, comma, parentheses or a full stop; "·" in the cards' titles); the landing
  says "on every platform" in nine. CP-14 (five keys left in English in seven languages) and `pinnedGames.error` (CP-12) translated.
- *Test:* `src/translations/copy.test.ts` (no em dash but Russian, one RA name, one "not started", no "librería", no old masculine ranks, no "both accounts").
**Why** — #122: text that broke the rules (literal Spanish/English, raw API sentences), dates and numbers that ignored the reader's language, and one thing under three or four names.
**Decisions** — Codes, not sentences, from the routes; the two sign-up flows share `steamAuth`'s "username taken / closed / too many" texts. Reading a zone-less RA date as UTC is the
rule already in `parseUnlockTime` (#118), so those callers moved. Russian keeps its dash where it is punctuation (copula, apposition) and loses it in the cards, hints and privacy text.
Spanish "desvincular" stays for disconnect (CP-07's own proposal) while "conectar" is the verb for the action.
**Open** — Left out on purpose: CP-03 (115 dead keys ×9, a change of its own that the `Translations` type will force), CP-10 (Xbox in `/rankings/how`: CP says ask the owner),
CP-11's remaining pairs outside the lists above, CP-12 (the shape of every failure toast: only `pinnedGames.error` was reworded), CP-15/16/17/18/19 (low). The "G" after a gamerscore (Xbox's own mark), and the
`AdminPsnToken`/`AdminXboxGame` dates (admin is exempt). The groups' item routes answer codes too, which no client reads. Not checked on a screen in each language: ask for a pass in es, pl and ru, where the most text moved.
**Watch out** — A route that used to answer `message` (groups) now answers `error`. A test title with an apostrophe in a `'…'` string breaks the file (use ’). `tr`-style scripted edits of the
nine files kept the CRLF the working tree has.

---

## 2026-11-09 — Every theme at WCAG AA, and a test that keeps it (`fix/123-theme-contrast`, #123)

**Did** — Antislop V7-01 / T-04 / plan S7, one commit per group of tokens:
- *Error colour:* `--danger` 239 68 68 → 248 113 113 (base, the dark block, Blue): 4.28 → 5.5:1 on the notice tint in dark, dark-green, dark-blue, dark-white, blue.
  The missable badge in `AchievementGrid` (`bg-danger`) takes `text-bg-main`, not white, which a lighter red cannot carry.
- *Accent text on its own tint (pill, pressed icon button, dialog head icon):* light 124 58 237 → 118 55 225, arctic 15 118 110 → 14 112 105, blue 96 125 255 → 115 141 255,
  purple 150 110 250 → 162 126 251, red 236 84 102 → 238 101 117, steam-retro 196 181 80 → 227 210 93 (3.6–4.3 → ≥ 4.58:1). Same hue, only lightness; the dark themes' hovers moved a step to stay lighter than the accent. `THEME_ACCENT` (favicon) follows.
- *Tints:* light-green `--success` and light-blue `--info` 15 118 110 → 15 116 108 (4.46 → 4.58); steam-retro `--danger` 252 165 165 → 254 202 202 (4.32 → 5.41), `--info` → 150 199 253 (4.49 → 4.57), `--softcore` (new in its block) 147 197 253 (3.87 → 5.45).
- *Second text level:* midnight muted 172 203 241 → 158 187 222 (body:muted 1.28 → 1.51), crimson 232 201 192 → 193 167 159 (1.24 → 1.81), steam-retro body 216 222 211 → 230 234 227 (1.20 → 1.36); blue muted 128 142 168 → 131 145 170 (4.46 → 4.63 on tertiary).
- *Streaks on light themes:* `streakInk` mixed 72 % of the tier's hue into the text colour everywhere; new token `--streak-hue` (72 % base, 42 % on the light themes incl. sakura and arctic, 44 % on steam-retro). The tiers' hues and the "coloured by tier" rule are untouched.
- *Test:* `themes.test.ts` runs over all 22 `THEMES` (was 9) with `themeContrast.ts` (WCAG ratio, tint over a ground, oklab mix; its own small test): text and muted on the three grounds, body:muted ≥ 1.3, accent as text and on its 15 % tint, primary button and hover, the four meanings on a card and on their 10 % notice tint, hardcore/softcore on a card, every streak tier's ink on the page, a card and its own 16 % tag. Rules in `docs/design-system.md` → Contrast.
**Why** — #123: the error notice, selected pills, light-theme streaks and three themes' muted text failed AA, and nothing could fail a test.
**Decisions** — All 22 themes stay (owner, canvas 2026-11-07). Where a colour failed I moved the theme's value, never the rule or the tier. Steam Retro's grounds (the old client's header, card, tertiary) and Midnight's cream body text are untouched; its accent, body text, info/danger/softcore moved instead. Used V7's tested values where they existed (danger, steam-retro danger and softcore).
**Open** — Not looked at in a browser: check Steam Retro (brighter gold accent and body text) and the light themes' streak tags (hue share 42 %) on the real screen and in Firefox; the owner may want another look at the steam-retro gold. The audit's colour-budget ideas (info = softcore, one glow, gold token) are not in this issue; steam-retro now has info ≈ softcore. The new base+accent picker is #135.
**Watch out** — A test of a `color-mix` has to replicate it (`mixOklab`): if `streakInk` changes its formula, change that function too. `--streak-hue` is a percentage, the only non-triplet token the test reads.

---

## 2026-11-09 — Every dialog a plain Modal, lazy-loaded (`refactor/121-plain-modals`, #121)

**Did** — Antislop X3 / plan S5, one commit per group (ids are the audit's):
- *`CommonModal` deleted* (its 13 users moved to `Modal`): delete-account (`tone="danger"`, trash icon, hint, footer),
  change-password, edit-profile (username/email), avatar, gender, language, location, hidden games, hide-game
  confirmation, mastered-games order, RA login, admin create/edit user. Heads that were an `<h2>` in the body or a hand-made
  row with its own ✕ are `title` / `hint` / `icon`; Cancel / Save rows are `footer`. `Modal`'s `children` is optional now: a
  confirmation can be only a head and a footer (no empty padded body).
- *Own heads, ✕ and Escape out:* day / week / period achievements (the ✕ was `aria-label="Close"` in English or unnamed),
  `AchievementModal` (a bare `✕` text with no name), `AchievementDetailModal`, forgot password (own Escape on `window`,
  hard-coded "Close", a stray `AnimatePresence`), the game chart's period list (own Escape), AI export, hashes (its Spanish
  title is `T.gameInfoPage.hashesCompatible` now, "Cerrar" gone), `GroupModal` and `AddGameModal` (rebuilt `AnimatePresence`,
  hand head, own Escape; the group form's submit is in the `footer` through `form=`; AddGame's search is sticky in the body),
  showcase picker (own Escape; its way back to the games stays in the body), `AdminPanelModal` (its ✕ and its "Admin panel"
  heading are the Modal's; `AdminPanel` keeps only its sticky toolbar), `DeleteConfirmDialog` (`tone="danger"`, and it no
  longer returns null when closed, so the exit animation plays).
- *Lazy:* the static imports against the rule are `next/dynamic` + `{ loading: () => null }` (`LazyWhenOpened` where the
  modal has an `isOpen`): day/period/week modals in 7 files, `AchievementModal` in 4, `AchievementDetailModal` in 4, RA login in 2,
  AI export, hashes, mastered order, and the admin panel's own three.
- *Guard (`uiGuard.test.ts`):* no `CommonModal`; no `'Escape'` in a file that renders a `<Modal`; no static `import XModal` /
  `XDialog`; no `dynamic()` of a modal without `loading`. `createPortal` and `role="dialog"` already had rules (#120).
- *Tests:* the ones that opened a modal now `await findBy…` (the dynamic import); Escape is fired on `document` (Modal's
  listener); new checks for the danger dialog, AddGame, AI export (a new test file), `AchievementModal`'s named ✕, `Modal` with no children.
**Why** — #121: ~20 dialogs wrapped `Modal` in a second portal, hid its head and drew five different ones, added Escape
listeners that broke "only the top dialog answers", had an unnamed ✕ or were imported statically.
**Decisions** — *The achievement windows keep their hero as content* (icon, title with pin / showcase toggles, description,
stats): it is the content, not a head, and redesigning it is #132; they only take the corner ✕ (`T.cards.close`) in place of
their own. *Data-conditional modals* (`{selected && <DayAchievementsModal …/>}`, in an `AnimatePresence` that did nothing, as
`Modal` has its own) stay conditional: they are lazy by their condition, and giving them an `isOpen` would mean keeping the last
value for the exit animation. *Search and the phone menu* were already plain `Modal placement="top"` (#120): nothing to do.
**Open** — The welcome's `WelcomePageIntroDetail` / `WelcomePagePreferencesDetail` have their own Escape: they are cards
that grow into their detail on the page (not dialogs: no role, no backdrop), left alone. `StatusSortControl` and `useClickAway`
are menus. Some Spanish strings remain in `GameHashesModal`'s body (#122). Not looked at on a real phone or in Firefox: check
the sticky search of "Add games" and the admin panel's sticky toolbar inside the Modal's scrolling body.
**Watch out** — A footer is `flex-wrap justify-end`: a footer with a status line passes one child that is `w-full`
(AddGame) or `mr-auto` (showcase). A test that opens a lazy modal must `await findBy…`; Escape goes to `document`, not `window`.

---

## 2026-11-09 — The slant grammar of identity B v2 (`feat/127-slant-grammar-b2`, #127)

**Did** — Built page 1 of the canvas (boards "SheetB2" and "Piezas", B v2 as the owner confirmed it on 2026-11-07), one
commit per step:
- *Tokens:* `--slant` (-12deg slanted, 0 round) and `--mark` ("/" slanted, "\2022" round) replace the five `--slant-*` and the
  seven `--clip-*`. `ui/shape.ts` is now `SLANT_PLATE` (a plate behind the content leaning on `--slant`: its cut follows the
  angle at any height) and `MARK`; `slantStyle` is gone. `designTokens.test.ts` checks the angle and the mark.
- *What leans:* the primary `Button` (alone: secondary, quiet and danger are upright and fill their box), the chosen pill of
  `SegmentedControl`, `VaultLevelBadge` (`Tag slant`; `size="lg"` in the top bar so it matches the streak) and `StreakTag`,
  and the podium's steps (rankings, its skeleton, the Following teaser). Upright now: `Switch`, the `Select` box, every
  other `Tag` (`GameHeroChip` too), `Figure`'s pressed plate, `ListRow`'s and the tables' accent marks, the header's account link.
- *Data upright:* `ProgressBar` and `DataBar` (its `cut` prop is gone) have square ends slanted, `--bar-radius` round; the
  streak chart's bars and the heatmap's range mark too. The streak strip's break mark keeps the angle (an annotation).
- *Tabs:* one `ui/Tabs`, the mark in front of the tab you are on, no underline (`TabMark`; sizes sm/md/lg, `orientation="rail"`,
  `panels={false}`). Its three drawings are gone: the home's view switch (Framer underline) is `Tabs size="lg"`, the stats rail
  (pill with bar) is `Tabs orientation="rail"`, and `MainPageProfileTabs` (slanted line) is deleted, its four callers on
  `Tabs` (audit A-08: its never-drawn logos went too). The top bar's links, `StatusNavDropdown` and the two filter rows
  (`tabClass`) take `TabMark`; the search bar shows the mark instead of the leaning bar.
- *Facts:* `ui/Facts` joins the facts of a line with the mark in the accent (a screen reader hears a comma). Used by the
  four platforms' game rows, the PSN collection, the trophy cabinet, the profile's last game (PSN, Xbox, Steam), the search
  panel's games, the follow counts and the groups' lines (cards, shelf, album, hero, sortable items, home groups, group feature).
- *Sentence case:* `Kicker` (xs 13 px semibold, sm 13 px bold, md 14 px bold, no tracking), and with it figure labels and card
  titles; the achievement tables' heads (`dataTable.ts`), the rankings' and the guide's heads, `SortableHeader`, the public
  profile's "your profile" tag, `AchievementModal`'s and `ConnectAccounts`' headings.
- *Guard:* no `--slant-*`/`--clip-*`/`slantStyle`; a lean outside `ui/` only through `SLANT_PLATE` or three named drawings;
  no hand-made fact separator (`aria-hidden` `·`, the footer's links excepted); no hand-made tablist (PSN's trophy groups
  excepted, see Open); no `uppercase` (the hash modal's dump-group names excepted). The `kicker` pending list is empty.
- *Catalogue and docs:* `/design` explains the grammar (Shape, Button, Switch, Tabs, Segmented, Figures, bars, Tag, Facts),
  shows Facts and the level and streak as the only leaning tags; `docs/design-system.md` → The slant grammar; CLAUDE.md's
  design-system section; `docs/designs.md` row 2026-11-07; the shape choice's hints in the nine languages.
**Why** — #127: the owner found the site generic; the slant was everywhere at four angles, so it read as noise. B puts it
where it means something (audit §2.3–2.5, plan S6).
**Decisions** — *As drawn:* the progress bar and the week bars upright with square ends (the canvas draws no cut; "nothing
under ~28 px leans"), so horizontal data bars lost their small cuts too. The canvas draws the level and streak chips in the
accent; they keep their tier colours (CLAUDE.md's streak and level rules), only the lean and one height changed. The canvas's
pinned count pill stays a pill. *Points "ya lo trae B" done here:* #128 one tab bar drawing, card titles out of 10 px
uppercase, level/streak/user in the header as one family; #129 the half-slanted toolbar (select and secondary buttons upright),
uppercase labels in the detail and the table head; #130 the podium steps at one angle, uppercase titles, two title styles per
Following card (both label styles are now sentence case); #131 "Cuándo juegas" bars upright, labels out of uppercase; and
#132's "with B only the primary slants" (its footer layout point stays in #132).
**Open** — PSN's trophy-group tabs are still pills (`pillClass`), the guard's one tablist exception: they are filter-like and
not one of the three drawings the issue named; move them to `Tabs` if the owner wants. Many "label · value" pairs (e.g.
"Played · 12 h", group cover footers, #130's one-line group footer) still use a middle dot: they are not lists of facts;
the per-screen issues decide. The cover's "PS4 / 33 de 51 trofeos" line is #128's.
**Watch out** — Screenshots before/after (signed out, `/api/rankings` answered with made-up rows in the browser, no database,
no account): landing, login, `/rankings`, `/rankings/how` at 2560 and 390 px in both designs, kept in the session scratchpad.
A mark on a link or a button is an `aria-hidden` span, never `::before` on the control itself (it would join its name).

---

## 2026-11-08 — Library gaps, their guard rules, and the cursor spotlight gone (`feat/120-library-pieces`, #120)

**Did** — One commit per piece (antislop audit X2 / plan S4; ids are the audit's). Each piece has its test, its
specimen in `/design` (`catalogue.ts`) and its rule in `uiGuard.test.ts`, and one caller migrated:
- *Spotlight removed:* `.spotlight` (CSS), `useSpotlight` and its test, its 23 callers (the class carried
  `position: relative; isolation: isolate`, so each card now says `relative isolate`). The owner turned it down
  on the canvas (audit §3.7, V7); the finished bar keeps the only glow.
- *Tokens (C-16, B-07):* `focus-ring` (`@utility`), `shadow-hairline-t/-b/-b-soft`, `shadow-sunken`,
  `drop-shadow-done`, and the platform colours `ra`, `ra-gold`, `steam`, `steam-dark`, `steam-perfect`, `psn`,
  `psn-dark`, `xbox`, `platinum` (`--color-*`, so `text-steam`, `bg-psn/10`…). The library itself uses them;
  `PlatformLogo` is the first caller outside it.
- *`Kicker` / `kickerClass(tone, size)` and `SectionHead`* (C-04): `SECTION_LABEL` and `StreakSectionHead` are
  gone (welcome previews, `SectionFallback`, the four streak cards, `Shelf`).
- *`Tag`* (B-11): the four Beta tags. *`Avatar`* (B-08): `RankingsPageUser`. *`ListRow` / `LIST_ROW`*: the search
  panel's row promoted (`SearchModalRow` sits on it, `SEARCH_ROW` is gone). *`Figure`* (V6-12): the account page's
  platform cards (`PlatformStat` takes a `tone` now); `StatPill` / `StatCard` are wrappers over it. *`DataBar`*:
  the rankings guide's table. *`Spinner`*: Button's, exported; the admin unlock uses `Button loading`.
  *`ErrorRetry`* (D1-07): the Xbox achievements panel. *`Modal placement="top"`* (C-01): the phone menu is a
  `Modal` now (`T.header.menu`, nine languages, also the hamburger's label).
- *Guard holes (T-05, T-06):* palette classes of every hue, side radii, Framer `variants`, hex literals, hand-made
  pill buttons, notice boxes, `role="dialog"` / `aria-modal`, `createPortal`, and the token strings.
**Why** — #120: the library was walked around (kickers in 95 files, the focus ring ×220, platform hex ×116), the
mechanical cause of "the same thing looks different on every page"; and the owner dropped the spotlight.
**Decisions** — *Looks kept, where copies differed:* `Kicker` has three sizes, not one tracking (one would have
moved most of them): `xs` = the 32× home spelling, `sm` = the catalogue's, `md` = the welcome's at 0.14em (its
copies were 0.12–0.16em). `Tag` tints at 0.14 (0.15 for accent, 0.16 for warning, as the copies most often had).
The hairline is ink 10 % (the 13× table-head value; the 0.08 of the modal footer and tabs moves up 2 %) and ink
5 % for a table row. `shadow-sunken` is the field's (the switch's 0.25 moved to 0.22; the checkbox keeps its own
smaller one). The exported `Spinner` is Button's (current colour), not main-spinner's accent top. *Visible
changes, on purpose:* `ErrorRetry` is a tinted danger box with a quiet button (the issue asked for it on
`Notice` + `Button`; the old one was a red line and a pill); the phone menu takes `Modal`'s surface, head (title
"Menu" in the reader's language) and close, opens at 12 % from the top like the search (it was 15 %), and its rows
no longer stagger in; `Figure`'s card numbers follow the reader's language. The shape of `Tag` and `DataBar` is
#127's: both read today's tokens only. `text-sky-300` (PSN platinum) became the `platinum` token, the same colour.
**Open — the migration, for the next agent (one commit per rule; `npx tsc --noEmit`, lint, `npx jest --ci`
after each).** Each rule is `NEW_RULES.<key>` in `src/components/ui/uiGuard.test.ts`; its regex is the grep, its
list in `src/components/ui/uiGuard.pending.json` is the work. **Migrate a file, take it off its list; the test
fails while a migrated file is still listed. Empty every list, then delete `uiGuard.pending.json` and turn
`newOffenders` back into plain `offenders`** (it takes a third argument, the files that stay on purpose, and tolerates a rule with no list). Never add a file to a list. Look at each screen in both designs
(`/design` → the header's Slanted / Rounded) before and after.
**Points 1–9 are done on `feat/120-library-pieces-2` and 10–13 on `feat/120-library-pieces-3` (2026-11-08), one commit per rule
(10–13: per block); what is left of each is named. `uiGuard.pending.json` now holds only `kicker` (3) and `tag` (5), the
leftovers named in points 1 and 2; the rest of the file's mechanism stays until those two are empty.**
1. DONE `kicker` (86 files → 3): 81 moved to `Kicker` (or `kickerClass()` on a `label`, a link, a `motion.p`, a `const`).
   `Kicker` got the tones `warning` and `inherit` (the colour is the caller's: a tier, a label on a picture). The four
   table heads (`SortableHeader`, `RankingsGuide`, `RankingsGuideTable`, `RankingsPageTable`) and `PublicUserHero`'s "your
   profile" pill (a `rounded-full` chip) are an `allowed` list in the test. The labels of the admin create modal and the profile edit
   modal are `Field` now (sentence case, semibold, no longer capitals); the admin's rows and the "current value" label are `Kicker md`.
   *Left:* `AchievementModal` and `ConnectAccounts` (headings at `text-sm`, 14 px: no `Kicker` size is that big, they are titles,
   #127), `GameHashesModal` (a chip with its own palette hues, the palette rule's).
2. DONE `tag` (30 → 5): 25 moved to `Tag`. `Tag` got a size `xs` (a row's console: `text-[10px]`, medium, `rounded-tag-sm`),
   the tones `gold`, `surface`, `custom` (colours from `style`, a tier's hue) and the platforms (`steam`, `psn`, `xbox` and the
   consoles' `white`, `black`, `sky`), and takes `title` and `style`; `overlay` is `bg-black/40` with the main text (the copies were
   0.35 to 0.45). `psnPlatformChip`/`xboxPlatformChip` are `psnPlatformTone`/`xboxPlatformTone` now (they returned palette and
   hex classes; their tests moved). `GameHeroChip` is a slanted large `Tag`; `VaultLevelBadge` sits on `Tag tone="custom"`.
   *Left:* `AchievementModal` (the comments' pager buttons are not tags), `GameHashesModal` (palette hues),
   `SortableItem` and `StatusGameItem` (RA's console colours are palette strings from `constants/index.ts`: tokens first,
   then a `Tag` tone), `RouteErrorCard` (a monospace digest, not a label). `RarityBadge` and `StreakTag` do not sit on `Tag` yet.
3. DONE `avatar` (18 → 0, one `allowed`): every person's picture is `Avatar`. It got `sizeSm` (the profile pictures that grow
   from `sm`: two CSS variables) and the dot follows the bigger size up to `lg`. `AvatarModal` is `allowed`: it previews the draft
   picture, names it for a screen reader and reacts to it failing (`Avatar`'s picture is decorative and has no `onError`).
   Dots now follow the size (36 px: `sm`, was `xs`; 28 px: `xs`, was `sm`).
4. DONE `figure` (10 → 0): the ten callers use `Figure`; `ui/StatPill.tsx` and its tests are gone (their cases are in
   `Figure.test.tsx`). *Left:* `UserVaultStat` still takes a class `accent` (it is not `StatPill`; its icon and sub line are its own).
5. DONE `dataBar` (13 → 0, seven `allowed`): the portada streak, the weekdays, the weeks, the platform split and the guide's example
   are `DataBar`. `allowed` (with the reason in the test): the podium steps and their skeleton, the Following teaser's podium, the
   heatmap's range mark, the streak chart's bars (they carry a label inside), the catalogue's and the shape preference's specimens.
   `PLATFORM_FILL` uses the platform tokens now and `PLATFORM_COLOR` is its colour for a bar.
6. DONE `spinner` (12 → 0, three `allowed`): the auth forms, the avatar save and the RA link modal use `Button loading`;
   `src/components/main-spinner/` is deleted. The RA link modal's spinner-only box now says "Sign in" (a button with a word).
   `allowed`: `MainHeaderLevel`'s ring and the two refresh icons that turn while they refresh.
7. DONE `pillButton` (15 → 0): the retries are `ErrorRetry` (each platform keeps its texts; a Steam one always shows its
   private-profile hint, PSN's and Xbox's only for `private`), the rankings' "more" and the consoles' "show all" are `Button`, and
   `SectionFallback`'s retry is a `Button`. A visible change on purpose: the retries are a tinted danger box with a quiet button.
8. DONE `notice` (14 → 0): `Notice` got `alert` (announce a warning at once: the RA key notice, the email notices keep their
   `role="alert"`) and `size="sm"` (a line inside a card: the vault fill lines). The reset form's "done" box is a `Notice` too.
9. DONE `dialogRole` (2 → 0) and `portal` (12 → 0, one `allowed`): `SearchModal` is `Modal placement="top"` (`size="lg"`, `flush`,
   `showClose={false}`, no Framer variants, no Escape handler of its own); `Modal` got `flush` (no padding round the body).
   `LayoutModal` was already a `Modal`: its `closest('[role="dialog"]')` is spelled `[role=dialog]`. The seven modals that wrapped
   `Modal` in `createPortal` dropped the wrapper. The four achievement grids use the new `ui/CursorTooltip`. `WelcomeCurtain` is
   `allowed`. `SearchModal` left the `variants` list on its own.
10. DONE `focusRing` (143 → 0): the three classes are `focus-ring` in 143 files (a plain replace; none had `ring-inset` or
   `ring-offset-*` inside the string, so none moved).
11. DONE `hairline` (11 → 0), `sunken` (2 → 0): 0.08, 0.1 → `shadow-hairline-t/-b`, 0.05 and the comments' 0.06 →
   `-b-soft`, the two 0.22 insets → `shadow-sunken` (`MainHeader`, `ProfileField`). The tabs' and search modal's 0.08 moved up 2 %.
12. DONE `hex` (58 → 0, three `allowed`) and `palette` (14 → 0), 70 files. Platform hexes → `steam`, `psn`,
   `xbox`, `steam-perfect`, `ra-gold`, `ra`, `steam-dark`, `psn-dark`; a `ring="#0070d1"` prop → `ring="var(--color-psn)"`; the
   welcome's gradients (`welcomeArt.ts`, `WelcomePageIntroArt`) use `var(--color-…)`. **Tokens added** (`globals.css`, all
   in the exact value the palette class had, as oklch; in the catalogue's Colour section and `docs/design-system.md`):
   `silver`, `silver-light`, `silver-ink`, `gold-ink`, `bronze-ink` (PSN silver, medals), `hardcore-deep`, `offline`,
   `status-playing|want` (+ `-bg`), `status-done-bg`, `redump`/`tosec` (+ `-ink`), `best-period` (+ `-soft`), the 13 consoles
   `console-<name>` (+ `-ink`; NDS and N64 keep `text-warning` / `text-hardcore`), `award-mastered|completed|beaten-hardcore|beaten-softcore`
   (the four hexes of `MasteryMix`), `steam-button`, `steam-slate`, `steam-night`, `steam-sky`, `psn-night`, `psn-light`, `xbox-dark`,
   `art-pink`, `art-cyan`. `sky-300` → `platinum`, `zinc-400` → `silver`. *`allowed` for `hex`* (the reason is in the test): the RA guide
   (a drawing of RetroAchievements' own dark page), `WelcomeCurtain` (its ink on the white badge) and `lib/siteUrl.ts` (`THEME_COLOR`,
   the browser bar, read before a theme exists). *Left:* `GameHashesModal` and `AchievementModal` are still on the `kicker` / `tag`
   lists (their palette hues are tokens now).
13. DONE `sideRadius` (1 → 0): `LibraryShelfCard`'s banner is `rounded-t-card` (1.25 rem, as its card; was 1 rem in the slanted
   design). `variants` (2 → 0, two `allowed`): `AuthPage` swaps its forms on a click and `LibraryGameDetail`'s panels come in when a
   card is opened: both are a click's (CLAUDE.md → Entrances), not a load's.
14. Not in #120, seen on the way: `SURFACE` spelled out by hand (C-05, 38 files) and the hand-drawn icon buttons
   (C-06) have no rule yet.
**Watch out** — A token used only as a utility is inlined by `@theme inline`; the `--color-*` variable is in the CSS only if something reads it with `var(...)` (checked in the build output). There is no script to regenerate the lists, on purpose: they only shrink, by hand. A
rule's text in `catalogue.ts` must not match its own regex (two did, and were reworded). `Avatar`'s `ring` is a
class on purpose (a highlight, like `PresenceDot`'s), the one exception to "className is layout". The phone menu
keeps `router.push` buttons (its tests expect them); making them links is #121's dialog pass.

---

## 2026-11-08 — Shared helpers for dates, RA assets, platforms, types and sessions (`refactor/119-shared-helpers`, #119)

**Did** — One commit per helper (antislop audit X4 / plan S3; ids are the audit's, `docs/audits/antislop-v17/code/`):
- *Secrets (LB-07):* `src/lib/secrets.ts` — `appSecret()`, `hmacHex(payload, key?)`, `sameHex`, `sameText`,
  `cookieFromHeader(header, name)`, `cronRefusal(req)`. `secretBox`, `raKey`, `adminAuth` (its `readCookie` is gone),
  `emailVerification`, `steamLogin` and the three cron routes use them. Every derivation is unchanged:
  `secrets.test.ts` opens values sealed and checks hashes, links, tickets and unlock cookies **made with the code from
  before**, under a fixed `NEXTAUTH_SECRET`.
- *Sessions (AP-01):* `requireSession(unauthorized?)` returns `{ ok, id, user }` (the session's user, server side, with
  `raid`). Every hand-rolled check (the audit counted 39, in 25 route files) uses it, each with **its own 401 body as before** (`{ message: 'No
  autorizado' }` is the default; `{ error: 'Unauthorized' }`, `{ error: 'unauthorized' }` and `{ error: 'unauthorized',
  retryable: false }` are passed where a route answered them). `follows/overview`, `users/search`, `favorites` GET and
  `avatar/[file]` no longer read the session twice; `me/streak` passes the session's user instead of rebuilding it.
  `requireViewerApiKey` and `requireXboxUser` sit on it.
- *`useRetryingRead(url, { parse, keepFor?, attempts? })` (HK-01)* replaces the attempt/timer/`hasFetched` loop in
  `GamesDataContext`, `RecentAchievementsContext`, `RecentlyPlayedGamesContext`, `ActivityHeatmapYearContext` (RA part),
  `useUserRank`, `useUserAwards`, `useAllGamesGlobal`, `useGameProgression`, `usePinnedAchievements`, `useShowcase` and
  `MainPageAbandoned`. Only `useRetryingRead` calls `scheduleRetry` now.
- *Dates (UT-04):* `src/utils/dates.ts` adds `unlockIso`, `utcDay`, `localDay` and `formatDate(s, lang, options?)` next to
  `parseUnlockTime`. `formatDate` moved out of `utils.tsx` and its ten callers pass the reader's language.
- *`src/utils/raAssets.ts` (UT-01, D2-05):* `raImageUrl(path)`, `raBadgeUrl(name)`, `raAvatarUrl(user)` (moved from
  `lib/raProfile`, which reaches RA's client and so could not be imported by components).
- *Types (UT-03, UT-09):* `src/types/game.ts` — `GameSource`, `GameStatus`, `SavedGame`, `GameProgressBase`,
  `GameAchievement` (the core `InsightAchievement` and `CompareAchievement` now extend). `GameSource` and `GameProgressBase` are imported from here (the old re-export in `types/steam.ts` is gone).
- *Platforms (UT-02):* `isGameSource` reads `GAME_SOURCES`; `raGameId(g)` (UT-08) in `gameRef.ts`.
- *Hidden games in SQL (LB-01):* `notHidden(row, user?)` in `src/lib/gameVisibility.ts`.
- *One game's achievements on any platform (HK-05):* `src/utils/gameAchievements.ts` — `fetchGameAchievements(source,
  id, lang)`, `raAchievementList(game)`, `readJson(url)`; `useShowcaseGameChoices` and `useGameInsights` only map.
- *PSN grade labels (UT-07):* no helper: `T.psn` is already keyed by grade, so it is `T.psn[t.type]`.
- *Play-time units (D1-13):* `formatPlaytime(minutes, T.steam, lang)` — its units are `T.steam`'s own keys; all 27
  callers moved (the signature forced it).
- *Upstream fetch (LB-05):* `src/lib/upstreamFetch.ts` — `fetchUpstream(url, { platform, before?, wait429? })`;
  `fetchRA` (pacing, 429 wait) and `fetchSteam` are one line each.
**Why** — #119: each copy had drifted on its own (time zones, resets, error shapes), and the per-platform shells (#125)
need these first.
**Decisions** — API kept to what the real uses need. The 401 bodies were kept per route, as asked ("same responses"),
though no client reads them; unifying them is a one-line change per route later. `T.psn[grade]` instead of a
`trophyGradeLabel`. `raGameId` keeps the library lists' priority (`GameID`, then `ID`). The re-export in `types/steam.ts`
was dropped in the second round.
**Visible changes (drifts fixed, on purpose)** — *Dates:* `formatDate` was fixed to `en-GB`; it now uses the reader's
language, so an English reader sees "Sep 07, 2026" instead of "07 Sept 2026", and a Spanish one "07 sept 2026" (lists,
cards and trophy/achievement tooltips). *Loaders:* the copies disagreed, the hook keeps one behaviour: a new URL, account
(`keepFor`) or sign-out is a new read and drops the old data. So `useUserRank`, `useUserAwards` and the RA year now reset on
sign-out or another RA account (they never did); the RA library and want-to-play now empty when RA is unlinked (they kept
the old list); `useAllGamesGlobal` now asks for want-to-play when RA is linked after the page opened (it never did); a game's
progression shows nothing (skeleton) instead of the previous game while another one loads; `MainPageAbandoned` stops
waiting when the dates answer is malformed (it used to wait forever). `RecentAchievementsContext` is loading while the
session is read, as the other providers are (it said "not loading, nothing" for that moment). A final failure logs
`[useRetryingRead] <url>`; per-attempt logs of pins and the showcase are gone. *Upstream:* a Steam error now carries
`retryAfter` too (nothing reads it).
**Done in the second round (`refactor/119-shared-helpers-2`, one commit per point):** the day keys (every `toISOString()` split/slice
→ `utcDay`, 2 hand-built local ones → `localDay`), `relativeTime`/`formatDay`/`daysBetween`/`unlockSpan` moved to `dates.ts`, 16 platform
`toLocaleDateString` sites and the three calendar-day tooltips → `formatDate`/`formatDay`; ~40 files of RA picture URLs → `raAssets`; the
platform list (`GAME_SOURCES`, 13 sites), names (`PLATFORM_NAME`, 4) and `raGameId` (4 files, 5 sites); `GameSource`/`GameProgressBase`
imports (59 files) and the re-export in `types/steam.ts` is gone; the 7 status aliases → `GameStatus`; the `SavedGame` and
`MainPlatform`/`Platform`/`parseSource` copies; `notHidden` (9 SQL sites, 5 files); `raAchievementList` (9 files); `T.psn[grade]` (7
files); `api/users/[username]` GET on `requireSession`. Things a reader may see: a platform date that cannot be read now shows "—"
instead of "Invalid Date" (`formatDate`), and `formatUnlock` (date and time) is `formatDate` with its options.
**Open — what really is left (same rules: one commit per helper; `npx tsc --noEmit`, lint and `npx jest --ci` after each).**
1. **Dates.** Left on purpose, each differs from the helper:
   - `toLocaleDateString(undefined, …)` / no argument, i.e. the **browser's** locale, not the app's language (`AchievementGrid`,
     `AchievementModal` ×3, `GameInfoComments`, `AdminPsnToken`, `AdminXboxGame`): moving them to `formatDate(s, lang)` changes
     what the reader sees. Do it only if the owner agrees the app's language should win there.
   - `'default'` locale on calendar days (`DayAchievementsModal`, `PeriodAchievementsModal`, `WeekAchievementsModal`): same reason.
   - RA strings that may carry no zone and are read by `new Date(x)` as **local** time (`LibraryListRow`, `LibraryDetailMilestones`,
     `LibraryGameDetail:112` `completedAt`, `ShowcaseTile`, `StatusGameItem` ×3 on RA's `AwardedAt` and `lastPlayed`): `formatDate` would read them as UTC. Check what each really holds, and fix as a
     bug if they are zone-less (a day near midnight shifts), not as a refactor.
   - `formatUnlockDate` (`gameCompare.ts`) answers `null` for "no date" (the caller shows "earned, no date"), `formatDate` answers
     "—"; `lastPlayedAgo` (`libraryShelves.ts`) counts calendar days with `numeric: 'auto'`, `relativeTime` uses short units. Not the
     same thing, so both stay. `VaultWeeksChart` formats a UTC day (`timeZone: 'UTC'`), `formatDay` reads local.
   - `raIso` (`vaultScoreInputs.ts`): do not touch (stored unlock data). `unlockTime` in `activityInsights.ts` is already on `parseUnlockTime`.
2. **RA URLs.** Left: `AuthCollagePanel` and `LandingBento` (constant lists of `media.retroachievements.org/Images/…` pictures, not
   built from a path); links to RA **pages** (`/user/…`, `/game/…`, `/settings`); the image proxy's host list. Where the field was
   unguarded in an `<Image src>` the call is `raImageUrl(x)!` (its JSX is already inside a `x ? … : …` / `x && …` guard).
3. **Platforms.** `PLATFORM_STEPS` (Xbox out on purpose), `aiExport.ts` ("PlayStation Network"), `AdminLinkedAccounts.tsx` ("PSN") and
   `VaultPlatformSplit`'s short names ("RA", "PSN") stay. The want-to-play reads that put `ID` before `GameID` (`library.ts:60`,
   `gameCandidates.ts:87`, `useAllGamesGlobal`) stay as they are (opposite priority to `raGameId`); the OG card
   (`user/[username]/opengraph-image.tsx`) keeps its own three-platform list (no Xbox) and takes only the names.
4. **Types.** DONE in #125 (2026-11-11, `fromRa…fromXbox` now build on the per-item compare mappers; the `*CompareList` stay, they only sort and map). Was not mechanical (UT-09/UT-10, better in #125): merging the `fromRa…fromXbox` and `*CompareList` mappers.
   *Traps:* RA's date is `DateEarnedHardcore ?? DateEarned` in insights but `||` in compare (an empty string differs), compare
   sorts RA by `DisplayOrder` and insights do not.
5. **Sessions, left on purpose:** `groups/[id]` GET and `rankings` GET read an optional session (signed out is allowed);
   `perfectGamesOrder` GET and `showcase` GET read the **viewer's** admin flag after `dataOwner(req)` named someone else.
6. **`notHidden` — kept by hand:** the overview's four favourites (literal source, id from JSON), its `"hiddenGames"` list, and the
   `JOIN hidden_games` in `follows/playing`.
7. DONE in #125 (2026-11-11, `usePlatformRead`: no retry loop added, one fetch per url as before, so Xbox makes the same calls). Was: optional, judgement needed: `usePsnSummary`, `useXboxSummary`, `useSteamProfile`, `usePsnTrophies`, `useXboxAchievements` keep a
   `hasFetched` ref with no background retry; `useRetryingRead` could replace them only if retrying their platforms is wanted
   (Xbox has a 150-calls-an-hour budget: ask first). Not touched.
**Watch out** — Never change a key derivation in `secretBox`, `raKey`, `adminAuth`, `emailVerification` or `steamLogin`:
`secrets.test.ts` fails, and so would every sealed key and link in production. `useRetryingRead`'s `parse` must be made
once (module level): a new function per render starts a new read every render. A route test that mocks `@/lib/apiAuth`
whole must give `requireSession` a `user`, or use `jest.requireActual` for it.

---

## 2026-11-08 — Probable bugs from the antislop audit, checked and fixed (`fix/118-audit-bugs`, #118)

**Did** — Each line of #118 was checked in the current code first; one commit per point (ids are the audit's, in
`docs/audits/antislop-v17/`). Fixed, with a test that fails without the fix where it is logic: E-06 `PlatformMark` draws
`PlatformLogo` (Xbox no longer gets PlayStation's mark); CP-02 `passwordReset.saveFailed` (and `registerForm.errorCreating`
reworded) in 9 languages; CP-01 the friends page copy (showcase not pinned achievements, followers are yours alone, the
public card) and `updated`; UT-04 `parseUnlockTime` (`src/utils/dates.ts`) is the one reader of the platforms' zone-less
unlock dates, which are UTC, and every `.replace(' ', 'T')` that read them as local now goes through it (`getBestWeek` also
counts weeks in UTC now, as the key it builds already was); AP-17 `steam/activity` and `steam/unlockYear` pass through
`visibleGamesForUser`; D1-10 Steam's rarest-earned links use `gameHref(..., subject)`; AP-02 admin unlink clears
the user cache for all four platforms; C-13 welcome phone bar is `flex` with a `flex-1` segment per step; D2-06 one
`raTypeTag` in `ui/dataTable.ts` for the four RA type tags (`win_condition` reads "Win" everywhere); D2-10 the status
skeleton reads `STATUS_GRID_COLS` (moved to `status-grid-control/statusGridCols.ts`); UT-10 `perfectDates` takes a PSN
date only for a completed game; E-15 `AuthPage` mounts the forms in the layout in use only (`useMediaQuery`; until the
browser can say, both hold it, as the server printed them); AP-06 the design tokens moved from `:root, [data-theme]` to
`:root`; V1-12 "/" opens search empty; V4-02 the `Switch` knob is `bg-bg-main` when on; V4-01 `ProfileField` names a
children-only value through its text; V3-08/V5-18/V4-03 `VaultLevelBadge compact="phone"` (one badge, tier dropped below
`sm`; podium and the account's level row); V5-16 `REGISTER_HREF` (`utils/authLinks.ts`) on every create-account link;
V2-09 `useGameInfo` exposes `missing` (RA 404) → `notFound()`, a real failure shows a sentence (`gameInfoPage.loadError`)
and `Button`, and `raUnavailable` answers RA's 404/422 with a 404 so it is not retried; V7 `ThemeContext` writes the theme
only once the account's or a pick is known (or the session is authenticated); V3-15 the public rankings guide names no Xbox
(intro text in 9 languages; the example row only for who `useXboxEnabled`); B-05 `platformStat` (loading figure, `—` only for
an absent value) on the four platform cards and the Xbox profile's play time; HK-09 pins, the perfect-games order and the home's
groups show `SectionFallback` (error + retry) instead of an empty list, `saveOrder` rolls back, reads log; AP-10 hashes and
subsets answer `raUnavailable`, achievement detail no longer swallows a half and so never caches a pair with a hole,
`getGamesLastPlayed` logs; B-02 the add-game modal says when the id lookup fails.
**Why** — #118: ~30 probable bugs found while reading the code and the screenshots, none fixed.
**Decisions** — RA's dates are UTC (every other reader already appended `Z`; `activityInsights` says "every platform
alike"), so the local readers were the bugs. Type-to-search stays (owner, 2026-11-07); only "/" is special. Steam's rarest
stays on the viewed profile like PSN and Xbox, the three components are not merged (#125). A page does not shrink: the pins
and groups error states keep their section. The Xbox mark and Venom switch fixes keep every colour. E-15's SSR is unchanged
(both layouts still render on the server).
**Did, second part (`fix/118-audit-bugs-2`, another agent, reasoned from code and tests; no OpenXBL call, no database)** —
*Level ring at 99 %:* `fillProgress` leaves Xbox out of the ring's count, but `fillComplete` waited for Xbox to leave
`reading`, which a refused Xbox read (OpenXBL's hourly quota, `busy`) never did; every other platform read, the ring sat at its
99 cap until the page's 30 passes ran out, and again on every load. `refreshSource` now settles Xbox as `estimated` (with the
busy reason) whenever its read stops, list included. *Xbox "game not found" (V2):* not a dead id (1480659447 is Minecraft:
Xbox 360 Edition, the twin `foldTwinTitles` keeps) nor the quota: the page called `notFound()` while `useXboxEnabled` was still
false because the session had not been read, so **every full load of `/xboxGame/<id>` was the not-found screen, admins
included** (a client navigation worked). It now holds the skeleton while the session loads (PSN and Steam game pages too, which
flashed "not connected"), and a failed library read shows `T.xbox.gamesError` + the error's own line + retry instead of a 404.
*LB-02:* `totalPoints` is `vaultTotals([id], canUseXbox(admin))`, the header's total; no formula number changed, no
`RULES_VERSION` bump.
**Open** — `vaultMe`'s daily and provisional queries still skip `LINKED_ACCOUNT` (LB-02's second half; rows
of an unlinked account are deleted by the next pass anyway). PSN's game page still 404s when its library read fails (Xbox's
fix not copied). A page whose fill stops (failed POST, 30 passes) keeps its last ring until the next load. Check on the
preview: a full load of an Xbox game page as an admin, and the header ring with Xbox linked. Not done, the owner has not decided: V1-01 ("Ratio
hardcore 285 %": RetroRatio or the hardcore share; the avatar ring reads it too). Not done, the owner declined: V5-09 (cookie
notice on phones stays, 2026-11-07). Unverified without an RA key: what RA answers for a game that does not exist (V2-09 handles
a thrown 404/422 and an object without `ID`). The vault guide still says "gamerscore" as one of the native values
(not a platform name); V4-23's state words beside the four switches are not added. `getGamesLastPlayed` still answers
`null` per failed game (only logged now).
**Watch out** — The shape tokens must stay out of `[data-theme]` blocks (a test fails otherwise). `raUnavailable` now
answers 404 for RA's 404/422: a client that retried that on a 503 no longer will. `withCache`'s validator throws on a
failed pair in `getAchievementDetail`, so one failing half is a 503 for the modal. `migrations/045_steam_playtime.sql`
is in pre since 2026-11-07, not in production (`docs/releases.md`).

---

## 2026-11-07 — Steam last-played for everyone, not only the key's owner (`fix/113-steam-last-played`, #113)

**Did** — One "last played" for Steam, `lastPlayedOf` (`src/utils/steamMappers.ts`): Steam's `rtime_last_played` when it
comes (only the API key's owner), else the newest of the game's last kept unlock (`steam_unlocks`), the last rise in its
hours (new `steam_playtime`, `migrations/045_steam_playtime.sql`) and `playtime_2weeks > 0` / the game in
`GetRecentlyPlayedGames`. `withLastPlayed` (`src/lib/steamProgress.ts`) adds `last_played_at` inside `loadOwnedGames` and
the score refresh's owned read, and records the hours. Readers moved onto it: `lastPlayedGames`, `toSteamGameProgress` (so
the library, recently played, the friend banner and every `lastPlayed` sort), `loadActivityAchievements` (activity, the
year, the streak, the Following and home Friends data), `/api/steam/recentlyPlayed` (the recent list now counts every game
in it, not only the ones the owned list lacks). `progressCacheKey` is keyed by minutes (`steamProgress3:`), `progressTtl` is
one hour for games with minutes in the last two weeks. `scoreRefresh`'s Steam `changeKey` is
`playtime_forever:rtime_last_played`. Unlinking deletes the kept hours too; `/privacy` says so in all nine languages.
Cache keys bumped: `steamOwnedRaw:v2:`, `steamOwned3:`, `steamRecent:v3:` (and `scripts/demo-rankings.mjs` seeds the new
ones). Tests with an account Steam does not date in every touched file.
**Why** — Steam's `GetOwnedGames` sends `rtime_last_played` only for the key's owner (measured 2026-11-03), so for everyone
else recently played, recent achievements, the counters, the streak and the friends' cards were empty, and their Steam games
were scored once and never read again (`changeKey` `''` on both sides).
**Decisions** — Dates per signal: a kept unlock is exact; a rise in hours is dated at the read that saw it when Steam counts
minutes in the last two weeks, else two weeks before that read (it cannot be later); a first sight is undated; two-week
minutes alone are `now − 14 days`, the start of the window, so a date is never later than the truth (a game played
yesterday may read "two weeks ago" until a rise or an unlock dates it). None of them reaches the streak, heatmap or counters
as a day: those count unlocks with their own dates; a date only picks which games are read. The derived date is not in the
score `changeKey`: its two-week part moves every read, its unlock part is written by the refresh's own read, and a rise in
hours already moves the minutes. The new key differs from every stored one, so each Steam game is read once more on the next
refresh (what a `RULES_VERSION` bump does). The score refresh also records hours, so the daily cron dates the games of
someone who stays away to about a day. `TWO_WEEKS_S` lives in the mappers and is reused.
**Also checked (PSN, RA, read from code and docs, no calls):** neither depends on whose credential reads. PSN reads every
profile as the app's one account anyway: `getUserTitles` gives `lastUpdatedDateTime` per trophy set and
`getUserPlayedGames` `lastPlayedDateTime`, both governed by the target's own privacy settings (`psnClient.ts`, 331/390); the
owner's measurement on #113 (39/39, 50/50, 2/2 on other accounts) agrees. RA keys are not scoped to their owner (a valid key
reads any public user, `docs/accounts.md` → RA sign-up), and the score's change key is `MostRecentAwardedDate`, not a
last-played field. Xbox, measured on #113, is fine too. Steam is the only one.
**Open** — **Apply `migrations/045_steam_playtime.sql`** to pre, then production when it reaches `main` (owner). Until then
every owned-list read logs the missing table and games with no achievements played more than two weeks ago stay undated;
nothing fails. Check on the preview with an ordinary account (not the key's owner): recently played, the counters, the
streak, a Steam-only friend's card. No `friends.ts` test was added: it reads `lastPlayed`, which is now filled upstream.
**Watch out** — Never read `rtime_last_played` directly: go through `lastPlayedOf`. The first owned read after the
migration only records hours (no dates); dates from hours start with the next rise.

---

## 2026-11-07 — CLAUDE.md slimmed to its rules, the old worklog archived (`docs/124-slim-claude-md`, #124)

**Did** — `CLAUDE.md` from 1,495 lines / 111 KB to about 565 / 38 KB: the rules every task obeys, one line each, with
an area table on top. What left it went, whole and with its reasons, to new docs: `accounts.md` (registration, RA and
Steam sign-up, sessions, email, admin), `platforms/` (`ra`, `steam`, `psn`, `xbox`, and the failure table in its
`README.md`), `performance.md` (performance rules + data loading), `social.md` (presence, Vault Points and rankings,
follows, showcase), `library.md` (synced preferences, consoles, hidden games, completion dates), `welcome.md`,
`i18n.md`, `releases.md` (milestones, release gates, environments, a migrations table) and `roadmap.md`; the design
details were appended to `design-system.md` → The rules in full. Worklog entries older than v1.7.0 (132) moved to
`archive/worklog-2026-09-to-11.md`. Finished plans moved to `archive/` (`welcome-plan`, `welcome-look-plan`,
`xbox-integration-plan`, `ui-polish-roadmap`, `ui-polish-v2-plan`) with a dated note; links to them updated.
`docs/README.md` rewritten (every doc listed); README's "two daily crons" is "daily crons" (there are three).
**Why** — Antislop audit #77 (MS-01, MS-02, MS-04, MS-06, plan S9): every session read ~28k tokens of rules mixed with
history, and the file contradicted itself.
**Decisions** — The contradictions, each checked against the code: Xbox's score pace is 2 games a pass
(`PACE.xbox.perPass`, #87), not 5; streaks are coloured by tier everywhere (the hero uses `streakTier` too), the
"accent, amber only in the hero" line is gone; `showcaseFromUnlock` was already deleted by #117; the "Spanish UI text"
line was already replaced by "every text through `T`"; new strings go in every file under `src/translations/`, not
`en.ts` + `es.ts`; pure transforms go in a topic file under `src/utils/`, not `utils.tsx`; hooks load on first reader,
`hasFetched` is legacy; toggles are `Switch` / `ToggleButton`, never a hand-made `role="switch"`; 1.5.0/1.6.0 are
history in `releases.md`, not "current on develop"; the component library is built (roadmap and plan updated); Xbox's
call cost is one figure (~4 calls a new user: gamertag search, library, play time, first game's achievements); one
Next.js block at the end, the generator's own text (`##` heading). Kept verbatim: the owner's rules (Git, the antislop
section, toasts, state and effects, testing, documentation). Above the ~370-line proposal because Git and the antislop
section stayed whole; the size that matters (tokens) is about a third.
**Open** — The owner reviews the new `CLAUDE.md` before merging (the issue says so). `migrations/README.md` (MS-11)
not made: the table is in `releases.md`, with `—` where no date was written down.
**Watch out** — A rule that changes now goes in its area doc, and in `CLAUDE.md` only when every task must obey it.
Archive the worklog again at the next release.

---

## 2026-11-07 — Dead code out (`refactor/117-dead-code`, #117)

**Did** — Deleted what nothing reads, each checked by grep first (antislop audit #77, plan S1): the old home cards
(`MainPageMastery`, `MainPagePerfectGames`, `MainPageGamesList` and their pieces), `GamesPlayedPieChart`, `MainStart`,
`ragamesidpool.ts`, `CATEGORIES`, `getGamesInfo`, `getWantGames`, `groupByDay`, `groupByConsole`, `calcStreak`, the
`calcAllStreaks` re-export, `showcaseFromUnlock`, `withAchievementCounts`, `GET /api/follows`, `modalOverlay`/`modalContent`,
`isLimited`, `FadeImage.placeholderClassName`, `IconButton`'s `accent` tone, the home's unreachable "not linked" profile
branches (and their three `rounded-3xl` guard exceptions), 39 light-theme rules for palette classes nobody uses,
`--accent-muted` (equal to `--accent` in every theme), `commit_all.tmp.sh`,
`tailwind.config.ts`, `tasks/`, `public/media/3DSa.png`; un-exported four `lib` functions used only in their file.
Then 121 translation keys no component reads, in all nine languages (~1,160 lines). About 3,200 lines in all.
**Decisions** — Kept what the audit marked as plausible or owned by a later issue: `GAME_SOURCES` (#119 uses it),
`Tabs.size` (#120 may need the small tabs), `Notice.title/action`, `StreakTag lg`, `rarityTone` (its test), the shape-token
move of AP-07 (a visible change, with #118), the DARK block (it restates the base, but
`themeGroups.test.ts` checks every theme is named in `globals.css`). No test for unread keys: dynamic access (`T.libraryLayout.shelves[id].hint`)
fools a grep, so it would fail on keys that are read. The keys were found by a script and then checked by eye.
**Watch out** — `Key` on unlocks is now set by the mappers and read by nothing (only `showcaseFromUnlock` read it); left
in place, as dropping it changes cached shapes. CLAUDE.md lost its line about it.

---

## 2026-11-07 — CI on every pull request (`ci/116-pr-checks`)

**Did** — `.github/workflows/ci.yml`: one job, `checks`, on PRs into `develop` and `main`: `npm ci`, `tsc --noEmit`,
`npm run lint`, `jest --ci`, `npm run build`, Node 24, npm cache, older runs of the same PR cancelled. CLAUDE.md → Git says so.
**Why** — #116, plan S0 of the antislop audit (#77): the guard tests only held when someone ran them by hand.
**Decisions** — No env vars or secrets: a clean checkout of `develop` with no `.env.local` passed all four on 2026-11-07
(855 suites, 5,569 tests; the build with every route). One job, not four, so `npm ci` runs once. Node 24 as Vercel's default
(`.tool-versions` is ivm's `ivm-node`, which `setup-node` does not read).
**Open** — After the first green run, add `checks` as required to the `develop` and `main` rulesets (GitHub settings, the owner).
**Watch out** — Testing the build from a git worktree with `node_modules` as a junction fails: Turbopack refuses files
outside the project root. Give a worktree its own `npm ci`.

---

## 2026-11-07 — Antislop canvas v2: page 1, identity from zero (`chore/77-antislop-pass`, #126)

**Did** — New design canvas (https://claude.ai/artifact/SZB3BhCYKkXabJMA75fz8D), as `docs/audits/antislop-canvas-v2-brief.md`
asks. Page 1 only: the owner's real crops, Hoy redrawn from today's tokens, and three identity directions (A El escudo,
B El título, C La vitrina) on the same pieces, each switchable slanted/round and Dark/Venom. Row in `docs/designs.md`.
**Why** — The owner wants identity, per-screen improvements, themes and the landing proposed again, one page at a time.
**Decisions** — Asked first (2026-11-07): both designs stay; the app takes only the logo and its colour from the MGS2
landing; three directions; the problem is "generic / AI-made" and "not recognisable", not the slant. So every direction
shared an antislop base and differed in where the signature came from (logo shape, type, game art). Rejected, see Round 2.
**Round 2** — The owner rejected the three directions: identity here means how the slant the site already has is
applied (one angle, only big gestures and the player's own marks, never data, the "/" as signature, a dot in round), not new
brand devices. They chose the old canvas's B (B v2); its `Piezas`, `SheetHoy` and `SheetB2` were brought over unchanged but
for the image ids, and A/B/C removed.
**Round 3** — B v2 confirmed after the owner asked why only some pieces slant. Page 2 started with the Home: the
old `MejHome` points re-checked against `visual/V1.md`, 14 now (month names in the browser's locale added), the ones B
already brings marked "ya lo trae B"; V1-03's cuts left out, as the owner rejected cuts.
**Round 4** — Home points approved but 10 (type-to-search is intended; only "/" typed into the box is the bug) and 14
(drawn as `Mej14`). The owner asked to cover the cover layout and the per-platform profile tabs too: `MejPortada` (12) and
`MejPlataformas` (8). Portada's point 3 (hero says AC II, the list starts with Fallout 4) must be checked in code first.
**Round 5** — Home review closed: what not to touch is in the report's §3.7 (one surface level declined, the heatmap's
entrance stays, the cover's hero by design, platform colours stay); the "99 %" ring is the level loader getting stuck.
**Round 6** — Page 2 finished: every remaining screen in one go at the owner's request (game page, /allGames, groups,
rankings, streak, dialogs). Points the owner already declined elsewhere were not proposed again (colours per platform,
boxes, shrinking, cuts). Library views came from the owner's own production captures (browser bar cropped off).
**Round 7** — Pages 3 (themes: base + accent, named eight kept, no removals) and 4 (landing: chosen screen, Fondo/Franja
page, "Qué es" redone, phone) drawn; /allGames rework proposed as the library with a "Todos" status; streak calendar widened.
**Round 8** — Landing approved with "Fondo". Last screens drawn while the owner was away: sign-in and sign-up (+ reset,
signed-out 404), the public pages and the phone. Welcome left alone; app 404 kept.
**Round 9** — Last three boards reviewed. Sign-in: all agreed, 4 (bigger covers at 2560) to try and revert if disliked.
Public pages: the owner asked whether the signed-out profile card is needed; kept (it is what a shared link and its
preview show), all nine points agreed. Phone: all agreed but 11 (cookie notice stays); 7 left to the agent: the profile
folded to one line ("Ver perfil" opens it), not moved below the games. The owner leaves phone details to the agent's
judgement. The cursor spotlight (`.spotlight`, `useSpotlight`, 26 files): the owner asked; dropped (owner,
2026-11-07; as the audit's V5/V7 said): the finished bar keeps the only glow, the links inside a card keep their own hover. The canvas is complete.
**Issues** — Opened from the canvas, 2026-11-07: #127–#136 (list and order in the report's §3.6); comments on #118
(cookie sheet stays), #120 (spotlight goes) and #126 (the result).
**Next** — #116 CI, then the plan's order (#117, #113 + #118, #119, #120, #121/#123/#122, #125, #127–#135, #115, #136).
**Open** — Captures: the Playwright MCP profile was locked by another process this session; a fresh `playwright-cli`
profile is signed out.
**Watch out** — Captures of the account page or anything over it show the owner's email (sharp, or readable behind a
dialog's blur): cover it in the image before uploading (System.Drawing in PowerShell works here; Python has no PIL).
**Open (old)** — Pages 2 (improvements per screen, from `MejHome.dc.html`), 3 (themes from
zero) and 4 (landing: screen 1 v2 kept, a second variant with Landing v2's band, and the "qué es" sections redone).
**Watch out** — The canvas sources live in the scratchpad of that session; read them back from the artifact (`read`
with `path`) before editing in a new one.

---

## 2026-11-06 — Antislop: the owner's answers, v2 of the canvas, lessons in CLAUDE.md (`chore/77-antislop-pass`)

**Did** — CLAUDE.md gained "The antislop audit (#77)": where the report is, the issue order, the owner's
decisions and the mistakes not to repeat. The report's §3.6 places #113–#115 in the plan and §3.7 records the
answers. Canvas v2 (B v2, Temas v2, Landing v2 desktop and phone); `docs/designs.md` updated.
**Why** — the owner wants every later agent to know the audit and not repeat its mistakes.
**Decisions** — identity B, with the slant on the player's own marks; the page-by-page cuts rejected (they took
the personality away); purple stays; the landing is concept 2 made functional. #114 goes inside #115's sweep;
#115 after the shells and the per-screen work; #113 with the bugs.
**Open** — the owner's verdict on v2: dark/light accents (white/black or violet), B v2, the landing. The cuts
are under debate: none is built without a yes, one by one.

---
## 2026-11-06 — Antislop audit: code, visuals, identity (`chore/77-antislop-pass`, #77)

**Did** — The deepest audit so far, report only: `docs/audits/antislop-v17.md` (synthesis: cross-cutting code
patterns, probable bugs, owner questions, visuals screen by screen, why slanted feels off, round, three identity
directions, cut proposals, the plan) with 20 auditor reports as appendices in `docs/audits/antislop-v17/` (each with a
per-file coverage table). Every file in `src/` read, 853 test files, everything outside `src/`; 391 screenshots
(git-ignored under `.audit/`). Issue #77 updated with the owner's wider scope and a coverage manifest. `.audit/`
added to `.gitignore`. Nothing in the app changed.
**Why** — The owner felt a loss of control over a largely AI-built site and wanted code a human can maintain, an
identity of its own, simplicity, and a deeper component library.
**Decisions** — antislop in "after" (audit) mode. Every screen in one theme plus a theme sample (owner); then the
per-theme visual review was cut as not worth its cost (owner, 2026-11-06), so themes are judged from tokens.
Mechanical auditing moved from Opus to Sonnet after the first rounds burned the five-hour limit (owner).
**Open** — The owner's decisions (report 3.1), then a design canvas for the identity directions A/B/C and the MGS2-
style landing, then issues for S0–S9, the per-platform shells and the screens. Nothing is fixed yet, the ~30 probable
bugs included.
**Watch out** — Signed-in screenshots take the **account's** synced shape, home layout and theme, not what a script
puts in `localStorage`: the first round shots were all slanted Venom. Re-take by intercepting `/api/preferences` and
`/api/me/bootstrap` in Playwright (and block their writes), as `.audit/shots/app2/` was. Signed out, `ThemeContext`
overwrites the stored theme with dark. Agents left on the default model inherit Opus: pass `model` for mechanical work.

---
## 2026-11-02 — Second pass: caches and moving inside the app (`perf/101-bff-by-domains`, #101)

**Did** — Measured client navigation (the first pass measured full loads only): coming back to the home asked
12 reads again. `cachedJson(..., { sameForEveryone })` for game-only answers; the home's RA and PSN 60 days
from the year (`getActivityHeatmap` and its hook removed); `raArtStore` (RA pictures in localStorage, `/privacy`
in nine languages); `lastAnswers` (paint the last answer on return, read again) in rank, awards, last game,
groups, a group, perfect order, pins and Following; `dueInThisTab` for the RA profile refresh and the arrival beat.
**Why** — The user asked for a deeper second analysis of caching and repeated reads.
**Decisions** — The user wants platforms as fresh as possible (see a game change at once, and faster later):
no client TTL on platform data, only paint-then-read; Steam keeps its own 60 days (its year is 30 min). Own data
got the same (not a TTL) because its writers are spread over many hooks: a forgotten invalidation would show
old data after an edit. `fill` left alone: its POST is the work, a GET would not save a request.
**Open** — A faster platform refresh as its own issue (the user's wish; costs each platform's budget); its text is
ready but `gh issue create` was refused by the permission check, so the user opens it. Done later the same day:
browse (want to play), Steam's feeds and every game page's pins paint their last answer (keyed by platform account
too: Steam's unlink test caught a link painting the old account); RA unlocks drop four unread fields (year 755 → 577 KB).
Left: `getGamesLastPlayed` in the home's abandoned card (its ids come from data loaded first, so painting gains
nothing); PSN's year repeats each game's icon URL per trophy (101 of 166 KB): a per-game table would cut it, but
changes the shape.
**Watch out** — `Vary: Cookie` stays on anything per user or refreshed by cookie; next-auth rewrites the session
cookie on every read, so only `sameForEveryone` answers really reach the browser cache.

---
## 2026-11-02 — Pages load only what they show: the BFF by domains (`perf/101-bff-by-domains`, #101)

**Did** — `useAuthSession` (next-auth's `update()` flipped `status` and re-ran every "signed in" effect: the
second wave on every page); `RaUserRefresher` only updates when RA's profile moved. The header's streak from
`GET /api/me/streak` (`lib/meStreak.ts`, the RA and Steam years moved to `lib/raYear`, `lib/steamUnlockYear`).
Every global data provider loads on its first reader (`request()`, `{ passive: true }`). `GET /api/me/bootstrap`
(preferences, hidden games, Vault Points; `lib/meBootstrap`, `lib/vaultMe`, `lib/bootstrapParts`). The home mounts
pins, groups and browse when idle (`useWhenIdle`). `GET /api/follows/cards` (`lib/friendCards.ts`) for both
Following lists. `scripts/measure-api-calls.js`. Rules in `CLAUDE.md` → Data loading; results in the v1.7 audit.
**Why** — #86 measured ~25 shared calls and ~1.3 MB on routes that show little (Rankings, Groups), 55 on Following.
Measured after (same environment, warm): Rankings 26 → 7 calls, 1,258 → 14 KB; Following 55 → 10; game pages
25–33 → 6–12; home 42 → 35 (its bytes stay: it draws the year and the libraries).
**Decisions** — The user asked for everything in one PR, commits per step. No `overview` per platform: the
home's profile column and overview panel compute from the whole library, so it would add requests (told the
user). `follows/cards` calls the profile routes' own handlers in-process instead of copying `dataOwner`, keys,
private checks and caches: parity by construction. The streak takes the browser's unticked consoles as
`?hidden=` (the account copy lags 800 ms). Bootstrap is DB-only so no platform can hold up start-up data.
Home sections are prefetched when idle, not on open (the user's choice: tabs stay instant).
**Open** — Injected failures/429s, a cold server cache, RA-only and single-platform accounts (the audit's
"Still to measure"). The public profile route was not measured. A daily-count DTO for the home's heatmap and
charts would be the next cut in bytes. Watch `follows/cards` duration on Vercel (ten people in one call).
**Watch out** — A new provider in `MainProviders` must load on first read, never at mount; read `status` through
`useAuthSession`. Measuring on two ports: each has its own browser cache, which moved `getGameData` between runs.

---
## 2026-11-02 — Release v1.7.0 to production (`chore/merge-main-into-develop-3`)

**Did** — Applied `migrations/043_ra_key_sealed.sql` and `044_admin_totp.sql` to production (checked first:
neither was there; checked after: `users.raid_hash`, its unique index and `admin_totp` exist). Merged `main` into
`develop` (no file changes, it only records the link) and bumped to 1.7.0 for the `develop` → `main` PR (62 commits,
#46–#109).
**Why** — The user asked to ship what `develop` holds. Without 043/044 in production, linking RA and the admin
unlock would answer 500 the moment the code is live.
**Decisions** — Minor bump: new pages, the component library and the two designs. No new environment variable
(compared the `process.env` reads of both branches); Next went from 16.3 to 16.4.
**Open** — After the merge to `main`: check `www.cheevovault.com`, and the admin panel's first unlock enrols a
second factor (the admin needs an authenticator app). Vercel WAF rules (audit v1.7) are the user's.
**Watch out** — Merge this PR with **"Create a merge commit"**, never squash: a squash drops the link to `main`.

---

Older entries (2026-09 to the v1.7.0 release): `archive/worklog-2026-09-to-11.md`.
