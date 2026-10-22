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

Facts that must keep holding go in `CLAUDE.md`, not here; an entry can say
"added X to CLAUDE.md".

---

## 2026-10-22 — Welcome ready for more platforms; gender-neutral greetings (`feat/welcome-onboarding`)

**Did** — `PLATFORM_STEPS` / `isPlatformStep` and `platformKicker` (the "n of total" count comes
from the list, no longer a "3" in nine translations); CLAUDE.md lists what a new platform must
touch in the welcome. Greetings made gender-neutral: the welcome's title ("Esta es tu bóveda",
"Este é o seu cofre", "Questa è la tua cassaforte"), its giant word and the first step's name in the bar ("Hola", "Olá", "Ciao": the user still read "Bienvenida" as clashing with the title), a
Polish line, and the app's "Bienvenido/Bem-vindo/Benvenuto + name" → "Hola/Olá/Ciao".
**Why** — The user will add platforms and wants the welcome to always include them (and to
follow changes to the site); they noticed "Bienvenida" in the bar against "Bienvenido" below.
**Decisions** — Two standing rules in CLAUDE.md: the welcome follows every new platform and
feature; texts never assume the reader's gender.

---

## 2026-10-22 — Welcome curtain, smoother (`feat/welcome-onboarding`)

**Did** — The curtain glides in over 26 % of its 2.2 s easing out and leaves over the last 26 %
easing in (was 18 % each, one sharp curve); what rides on it (nodes, line) fades in and out with
it; the band travels with an ease-in-out; the new step's content waits for the curtain to start
leaving (`--enter-delay`, set by `WelcomePageStep`) instead of finishing hidden under it.
**Why** — The user found the animation abrupt ("de golpe").
**Decisions** — Same total length (2.2 s) and same swap point (50 %), so the sign-up hand-off
and the hook's timers did not change; only the curves inside.

---

## 2026-10-22 — Welcome curtain on <body>, not inside the sign-up card (`feat/welcome-onboarding`)

**Did** — `WelcomeCurtain` renders through a portal into `<body>`; `underBar` keeps the
between-steps curtain under the welcome's bar (z-20), the one from sign-up covers all (z-50).
**Why** — On sign-up the curtain showed inside the form card: the card's `backdrop-filter`
(like any `transform`) makes `position: fixed` relative to it.
**Watch out** — Anything meant to cover the screen from inside a card or an animated box needs
a portal (as `CommonModal` already does).

---

## 2026-10-22 — Welcome: bigger on big screens, slower curtain, a way in from sign-up, new avatar modal (`feat/welcome-onboarding`)

**Did** — After the user tried `/welcome` on a 2560 px screen: content and bar scaled with CSS
`zoom` on 2xl and ≥2200 px; curtain 2.2 s (was 1.1 s); the same curtain now runs from the
sign-up page into the welcome (`WelcomeCurtain` shared, `useWelcomeEntry`/`useWelcomeArrival`);
a new `AvatarModal` (big preview, pick or drop, link folded away) for the account page and the
welcome, `AvatarUpload` turned into `useAvatarUpload`, the avatar taken out of `EditProfileModal`.
**Why** — The user's four points: text tiny on 2K, change too fast, no feedback between sign-up
and welcome, the avatar modal (a URL plus "confirm URL", the current address in mono) was poor.
**Decisions** — `zoom` over per-element sizes (keeps the design's proportions; supported in all
current browsers). The sign-up side holds the curtain once covered (`holdAtMs`), so a slow
route load never shows the old page; the welcome restarts it at the same point with a negative
`animation-delay`. No "confirm" field for an avatar link: the preview is the check.
**Open** — Same as before: browser back between steps, first paint in the detected language.

---

## 2026-10-22 — Welcome after sign-up, first integration, and the browser's language (`feat/welcome-onboarding`)

**Did** — `/welcome` built from design v4: seven steps (intro, RA with the key guide, Steam,
PSN, profile, preferences, done) under the app-styled top bar, the Inazuma-style curtain
between them, back on every step, skip everywhere. Sign-up now signs in and goes there (form
and new Steam accounts). The language is taken from the browser (`navigator.languages`) until
the person picks one. `useRaLink` and `useThemeChoice` pulled out of their modals so the
welcome reuses them. Texts in all nine languages; tests for every new hook and component.
Also fixed two visual bugs the user found in the prototype (a long description overflowing
its preview, theme names wrapping).
**Why** — The user wants new accounts to link platforms right away instead of meeting the
login form again and then an empty `ConnectAccounts`.
**Decisions** — No app header in the welcome (its own bar only), by the user's choice: the
route is `src/app/welcome/`, outside `(main)`. Step kept in sessionStorage, not the URL hash,
because Steam's callback answers with its own `#steam-…`. Detected language never saved; no
server-side `Accept-Language` (would make the root layout dynamic). Theme picks in the
welcome do not toast (the change is visible; a failure is said in place).
**Open** — Browser back between steps; the first paint in the detected language. Not
checked in a browser with a real account yet (needs signing up on pre).
**Watch out** — `LanguageContext` no longer defaults to English for everyone: tests that
expect English get it because jsdom's `navigator.languages` is `en-US`.

---

## 2026-10-22 — Welcome v4: top bar in our style, RA guide page, browser language (`feat/welcome-onboarding`)

**Did** — No code. v4 on the canvas (desktop, mobile, a notes board) and the plan updated:
v4 is the design to build.
**Why** — The user found flaws in v3, still did not like the side rail (wants a top bar as in
E, styled like the app), wants RA's step to be a page explaining how to get the key, and wants
the language taken from the browser when possible.
**Decisions** — The bar is `MainHeader`'s floating bar with the steps as its nav pills and a
2 px progress line. RA: the form beside an animated three-step guide, not the modal. Language:
saved choice, else `navigator.languages`, else English; detection never saved as a choice;
`Accept-Language` on the server for the first render. Found: today the app starts in English
for everyone until they pick (`LanguageContext`).
**Open** — The header question; whether language detection ships first on its own.

---

## 2026-10-22 — Welcome v3: E as it was, with the side rail (`feat/welcome-onboarding`)

**Did** — No code. v3 on the canvas (desktop and mobile prototypes) and the plan updated: it is
now the design to build.
**Why** — The user clarified that they liked E's look and animation as they were and only
wanted its top step bar replaced; v2 had restyled everything.
**Decisions** — Keep E entire (full-screen curtain, Barlow italic, giant word, preview cards);
take from v2 only the side rail, back on every step, the profile and preferences steps, and no
achievements.
**Open** — The header question and RA inline vs modal (see the plan).

---

## 2026-10-22 — Welcome v2: back, profile and preferences, the app's own step bar (`feat/welcome-onboarding`)

**Did** — No code. v2 of the welcome on the design canvas (style audit and three step-bar
options, the 7 steps and what each saves, the prototype, mobile, updated motion spec) and
`docs/welcome-plan.md` rewritten around it.
**Why** — The user liked concept E and asked for: back on every step, profile and preferences
in the welcome, a step bar that matches the app (v1's did not), and no achievements for now.
**Decisions** — A side rail of steps like the account page's Preferences rows (tabs did not fit
7 steps; pills looked like a second header). Platforms before profile/preferences so the games
are read meanwhile. Back mirrors the curtain. CheevoVault's own achievements: a future idea,
written down in the plan, not in the welcome.
**Open** — The header question and RA inline vs modal (see the plan); then build it.

---

## 2026-10-22 — Welcome after sign-up: design exploration (`feat/welcome-onboarding`)

**Did** — No code. A design canvas with clickable prototypes (four concepts, a recommended
mix, the RA step, mobile and a motion spec) and `docs/welcome-plan.md`: the reference
analysed frame by frame, and how the welcome would be built.
**Why** — The user wants a welcome after sign-up that explains the site and walks through
linking each platform with animations, instead of sending people back to the login form and
then to `ConnectAccounts`; the reference is Inazuma Eleven: Victory Road's day change.
**Decisions** — Prototypes in a design canvas, not Figma: the Figma connector was not
authorised in this session. Recommended concept E (A's curtain between steps + B's unlock on
link). No Xbox in the welcome (admin-only). Branch cut from `feat/steam-sign-in` (PR #46, not
merged), as the user asked; nothing pushed.
**Open** — The user picks a concept; then build it as the plan says.

---

## 2026-10-22 — Steam: batched library counts, the whole year's streak, "now playing" (`feat/steam-sign-in`)

**Did** — (1) `fetchBatchCounts` (`GetTopAchievementsForGames`, 100 games a call) counts a
library's in-progress and unstarted games at once; only finished games are read one by one, for
their completion date. (2) `steam_unlocks` (`migrations/042`, `lib/steamUnlocks.ts`): every
per-game read keeps its dated unlocks; the streak/activity read the `maxGames` played last live
and the rest of the window from the table. Unlinking deletes them. (3) `/api/follows/playing` +
`PresenceLabel`'s `playing`: "Now playing: <game>" on the Following and home friend cards.
`/privacy` (9 languages) says both what is kept and who sees the game.
**Why** — The user picked these from a list of Steam improvements (they declined refreshing the
stored Steam name and a "verify with Steam" for old typed links).
**Decisions** — Measured 2026-10-22: the batch returns exactly the unlocked achievements when
`max_achievements` ≥ the total (40/50, 84/84, 43/43 against the per-game calls), 192 games in
0.6 s, but **no unlock times**, and it answers even when Steam says "Profile is not public" per
game; so a per-game probe must agree before it is used. The unlocks table is fed by the score
refresh, which already reads every played game; no extra Steam calls. "Now playing" lives in its
own route so the overview stays database-only.
**Open** — 042 applied to pre and production (2026-10-22); without it the
writes/reads just log. Days older than the table's first fill stay missing for games past the
live cap until the score refresh reads them.

---

## 2026-10-22 — Steam review: one owned-list read, private profiles said aloud (`feat/steam-sign-in`)

**Did** — `loadOwnedGames` (`lib/steamProgress.ts`): Steam's owned list cached 5 min under
`steamOwnedRaw:<steamid>` (refreshable, a private answer not kept), now read by the library,
recently played, recent unlocks, activity and the year's unlocks. `recentlyPlayed` answers
`403 private` for a private profile (`isPrivateLibrary`, `SteamPrivateError`, shared with
`ownedGames`), so the home's "recently played" says why it is empty. The Steam sign-up warns
when the Steam profile is not public (`isPublic` from the summary it already reads).
**Why** — The user asked to look for more ways to improve Steam. A home page load downloaded the
whole owned list up to five times (one per route) against an app-wide budget of ~100–200 Steam
calls per 5 minutes; and since linking no longer refuses private profiles, the home showed an
empty list where it should say "private".
**Open** — `scoreRefresh` still keeps its own owned-list cache (`score:steamOwned`, its own TTL);
left alone, it runs in the background. The community visibility state says nothing about
"game details" being private; only the owned list does.

---

## 2026-10-21 — Users link Steam through Steam's sign-in (`feat/groups-redesign`, uncommitted)

**Did** — The Steam card's typed box is replaced by "Connect Steam" (`UserSteamCardLink`) →
`/api/auth/steam?intent=link&next=/user|/` → Steam → the callback links the proven account
(`steamid`, `steamusername`, `steam_login_id`) and returns with `#steam-linked|taken|failed`,
which `useSteamLink` toasts. `/api/steam/link` and `UserSteamCardForm` removed; the `steamLink`
strings kept only `errors.private`. A random `state` (cookie + signed `return_to`) now guards
both the sign-in and the link. Texts that said Steam is linked by name (account card hint, landing
FAQ, privacy, the "track" SEO page) updated in every language they exist in.
**Why** — The user signed up with Steam on a second account while their admin account had the
same Steam typed in: nothing broke (separate columns), but a typed link proves nothing, so a
Steam account could score on several users. They chose "only through Steam".
**Decisions** — The three existing typed links (the user's test accounts) are left as they are,
by the user's choice. Admins still link by typing (logged). A private profile is no longer refused
at link time: ownership is proven, and the library page already says "private".
**Watch out** — Without the `state` check, a callback URL made with another person's Steam would
link it to whoever opens it, and then let that person sign in as them.

---

## 2026-10-21 — Steam "recently played" no longer limited to two weeks (`feat/groups-redesign`, uncommitted)

**Did** — `/api/steam/recentlyPlayed` builds its list from the owned list's `rtime_last_played`
(`lastPlayedGames` in `utils/steamMappers.ts`), the 20 played last; games only in Steam's recent
list (family sharing) are appended. Cache key `steamRecent:v2`. `loadRecentAchievements` scans the
10 games with stats played last, from the owned list too. `loadOwnedFacts` removed (unused).
**Why** — Steam's `GetRecentlyPlayedGames` covers only the last two weeks: the user saw 4 games, and
a user who had not played in months saw none after linking.
**Watch out** — A failed owned lookup still falls back to Steam's recent list, undated.

---

## 2026-10-21 — Sign up and sign in with Steam (`feat/groups-redesign`, uncommitted)

**Did** — "Continue with Steam" under the sign-in and register forms. Steam OpenID
(`lib/steamLogin.ts`, `api/auth/steam`, `/callback`, `/register`), a second NextAuth provider
`steam`, and `/authPage?steam=…` (`SteamSignupForm`, `useSteamSignup`): a known Steam account
signs in at once; a new one picks a username (suggested from the Steam name) and an email, and
gets Steam's picture as avatar and Steam linked. `migrations/041_steam_login.sql`. Privacy policy
(9 languages) says what Steam sign-in keeps. CLAUDE.md → Registration.
**Why** — The user asked for sign-up with Steam carrying over the Steam picture, name and email,
as a first step of a larger integration.
**Decisions** — Steam never shares an email (OpenID gives only the SteamID64; the Web API name and
picture), so the email is still asked for: it is the only recovery path. A new column, not
`steamid`, because `steamid` is typed and unproven (migrations/028). Random password, so the
account has none until "forgot password"; rejected a nullable password (every `passwordVersion`
and current-password check assumes one). The ticket goes in an httpOnly cookie, not the URL.
**Open** — 041 applied to pre (2026-10-21) and production (2026-10-22). No "link Steam sign-in" for existing accounts.
Changing the email or deleting the account asks for the current password, which a Steam-only
user has to set through "forgot password" first. Not tried against real Steam yet: try it on the
preview (Steam needs to reach `NEXTAUTH_URL`'s host, any public or localhost URL works as realm).
**Watch out** — `return_to` is built from `NEXTAUTH_URL`; if it differs from the host the user is
on, the ticket cookie lands on another host and every Steam sign-in "expires".

---

## 2026-10-21 — Xbox: a game's empty launcher twin no longer shows as a second game (`feat/groups-redesign`)

**Did** — `foldTwinTitles` (`utils/xboxTitles.ts`), applied in `xboxLibraryData`: a title with no
achievements that shares its name with one that has them is dropped, its last session and play
time folded into the game. Library cache key bumped to `xbox:titles:v6`. CLAUDE.md (Xbox) says so.
**Why** — "Minecraft: Xbox 360 Edition" showed twice in Recently played, once 5/93 and once 0/0.
Read from pre's cache: Xbox lists two 360 titles with that name, 1480659447 (93 achievements) and
1297287809 (0x4D53…, none), played six seconds apart: the game and what launches it.
**Watch out** — Only same-name twins are folded; a game with no achievements and no twin stays.
If the twin was ever pinned or put in a group, that row no longer finds its game.

---

## 2026-10-21 — Opening a home section keeps its top in view while it loads (`feat/groups-redesign`)

**Did** — New hook `useSectionScroll` (used by `MainPageCharts`): opening a stats section scrolls
its top under the header as before, then keeps asking again while the section resizes, for up to
`SETTLE_MS` (3 s), and lets go as soon as the user scrolls (wheel, touch, keys).
**Why** — "Siguiendo" (Following) scrolled badly: it loads only once opened, so at the moment of
the scroll the page held a short skeleton, could not scroll that far, and stopped short; the
friends then arrived and nothing corrected it.
**Decisions** — Rejected a minimum height on the panel area (always tall enough to scroll): it
left a blank screen under every short section.

---

## 2026-10-21 — More group icons; the edit preview shows the group (`feat/groups-redesign`)

**Did** — `GroupModalIconPicker` offers 80 icons in five categories (`ICON_CATEGORIES`: games,
trophies, mood, lists, nature) and opens on the category of the current icon; the own-emoji/link
field stays. Editing a group, `GroupModalPreview` now shows its own covers and game count (it said
"0 games": it only counted the games picked while creating).
**Why** — The user asked for a bigger icon choice, and to improve the edit modal.

---

## 2026-10-21 — Edit a group from the home page (`feat/groups-redesign`)

**Did** — The featured group on the home (`MainPageGroupFeature`) has an edit button that opens
`GroupModal` with the group; saving goes through the section's `updateGroup` (so the list beside
it updates too) and toasts "Group saved"; a refused save stays in the modal. `updateGroup` no
longer throws a JSON parse error when an error answer has no JSON body.
**Why** — The user asked for an edit button there.

---

## 2026-10-21 — A friendlier new-group modal (`feat/groups-redesign`)

**Did** — `GroupModal` rebuilt: a titled dialog on `<body>` (portal), Escape closes it. Creating is
two columns: a live preview (`GroupModalPreview`: chosen games' covers, icon, name, privacy),
name and description with character counters (limits from `groupValidation`), the icon as a row
of one-tap emoji plus "none" and a field for your own emoji or image link
(`GroupModalIconPicker`), and private/public as two radio options that say who sees it
(`GroupModalVisibility`, replaces the switch). The games column (`GroupModalGamePicker`) is now
suggestions and matches as covers to tick (`GamePickerTile`, `suggestCandidates`), chosen games
stay ticked in place. A missing name is an inline error on the field (it used to say only
"Title"); the button reads "Create with N games". Editing keeps the first column only.
**Why** — The user asked to improve the new-group modal after the add-games one.

---

## 2026-10-21 — Home page Groups section in the new style (`feat/groups-redesign`)

**Did** — `MainPageGroupFeature`: covers faded behind a progress ring (was an amber `text-warning`
number), finished / started / not started counts, a "Closest to done" link to that game
(`closestItem`), the first six games as covers (`MainPageGroupFeatureGame`), and an empty group
offers "Add games" (the new modal) right there. `MainPageGroups` (the list beside it): a progress
bar and % per group, **no delete** any more (it is on the group page), and it takes the groups
from `MainPageGroupsSection` instead of fetching them itself (it asked twice before). New hook
`useGroupProgress(items)`: one reading of progress (RA live, the libraries, then stored) shared by
the group page and the home, which used to show the stored `pct_won` and could disagree.
**Why** — The user asked what to improve in the home's Groups section and approved the list.
**Decisions** — Until the featured group's games load, its ring uses the stored totals from the list.

---

## 2026-10-21 — A friendlier "add games" modal for groups (`feat/groups-redesign`)

**Did** — `AddGameModal` rebuilt: a titled dialog ("Add games", "to <group>"), on `<body>`
through a portal; it opens on **suggestions** (`suggestCandidates` in `gameCandidates.ts`: being
played, closest to done first, then wanted, then the rest), narrows by title and by platform
(`AddGameModalPlatforms`, only platforms the user has games on), and shows games as selectable
covers (`GamePickerTile`, `aria-pressed`, a check besides the ring). "No games match" when a search
finds nothing; the footer is always there (count, clear, "Add N games", disabled at 0). RA id/link
lookup kept. Cover tiles on the group page now top out at 9rem (the user found 11rem still blurry).
**Why** — The user asked for a friendlier modal: before, it showed nothing until typed, said
nothing when a search failed, and the add button appeared only after a pick.
**Decisions** — `GamePickerRow` stays for the pin and favourite pickers; only this modal moved
to covers.

---

## 2026-10-21 — Group page redesign: banner, one filter bar, covers or list (`feat/groups-redesign`)

**Did** — `/groups/[id]` follows mock-up C. `GroupDetailHero` (replaces `GroupDetailHeader`): the
first covers faded behind, a progress ring, title, privacy, description, finished / started / not
started counts, add-edit-delete. `GroupToolbar` (replaces `GroupFilters`): progress states as
pressed buttons, consoles as a checkbox menu (`<details>`), decade as a `<select>`, and a view
switch saved as `group-detail-view` (synced). **Covers** (default): `GroupCoverGrid` +
`GroupCoverTile`, sortable like the list, each opening its game, a finished one ringed in the
theme's colour. **List**: the old `GroupGameGrid` cards, two per row; the 1/2/3 control is gone.
`itemProgress` / `groupStateCounts` in `groupItems.ts` give one reading of a game's progress (RA
live, then the platform libraries, then what was stored) for the tiles, the counts and the filters;
`GroupViewToggle` became generic (options passed in) for both pages. Skeleton reshaped.
**Why** — The user picked option C for the group page after the list redesign.
**Decisions** — The progress filter now reads RA's live progress too (before, only the stored
fraction), so the filters, the counts and the tiles agree.
**Watch out** — A Steam item's stored art can be a wide header; on a square tile it is cropped.

---

## 2026-10-21 — Groups list: covers or shelves (`feat/groups-redesign`)

**Did** — `/groups` has a view switch (`GroupViewToggle`, saved under `groups-view`, a synced
preference): **Covers** (`GroupAlbumCard`: the first games as a banner, a progress ring, completed /
in-progress counts) or **Shelves** (`GroupShelfRow`: progress, "closest to done", and the first five
games each with its own bar and link). An empty group asks for games; a last tile (`GroupNewTile`)
makes a new group while any fit. The old 1/2/3-column control is gone from the list. `listGroups`
now returns five covers with title and progress, `completed_count`, `started_count` and `next_up`.
`GroupPlatformLogos` was split out of `GroupCard` (still used on public profiles).
**Why** — The user found the list plain. Mock-ups (canvas "Rediseño de Grupos", options E and F)
were drawn first; the user picked both, with a switch between them.
**Decisions** — Per-game progress in the list is the group's stored `num_awarded`/`max_possible`
(what the old card's bar already used), not the live library values the group page reads. The
"Add games" and "+N more" tiles open the group instead of the add modal on the list page.
**Open** — The group page redesign (option C: banner, ring, one filter bar, cover grid) is chosen
but not built. Reordering groups by drag is not offered (it never was).

---

## 2026-10-21 — Library detail scrolls, modals above the heatmap, home ends at the screen (`fix/library-scroll-heatmap-layers`)

**Did** — The list view's detail panel (`LibraryEntryDetail`) is `grow shrink-0` instead of `flex-1`,
so it no longer shrinks to its sticky column and the column scrolls. `AchievementModal` and
`AchievementDetailModal` render through `createPortal` into `document.body`.
**Why** — The user could not scroll the right panel of the library lists (a long RA game cut off at
the bottom), and an achievement opened from "Recently played" on the home was covered by the
heatmap below it.
**Decisions** — `flex-1` (basis 0, shrinkable) plus the card's `overflow-hidden` (which drops its
min-height to 0) squeezed the card to the column and clipped the rest. The modals were trapped in a
transformed ancestor's stacking context (framer-motion sections), so their `z-50` only counted
inside it; a portal fixes it for every place they open from, as `CommonModal` already did.
**Also** — On the home's one-screen Overview (`home-fit`, ≥1024×1000), the profile column never
shrinks, so a profile a little taller than its share made the page ~20 px longer than the screen and
the end of the stats panel sat below the fold (the user wants the first view to end exactly at the
panel's bottom, footer just below). `homeFit` (`src/lib/homeFit.ts`, a ref callback on the home's
`<main>`) measures how far the box runs past the screen and takes it off the daily chart through
`--home-fit-trim` (at most 100 px, the chart never under 160 px; the heatmap follows the chart's box).
Rejected: letting the profile scroll again (that was the cut-off fixed before) and a smaller fixed chart
height (only right for one profile and one screen).
**Watch out** — Other hand-made modals (day/week/period achievements, showcase picker) still render
in place; if one is ever opened from inside a transformed section and something later covers it,
portal it the same way.

---

## 2026-10-21 — An error card for a platform profile that does not load (`feat/platform-load-error`)

**Did** — `MainPageProfileError` (`main-page-profile/main-page-profile-error/`): the error screens'
`StatusBadge` (danger, a cloud-off icon, the platform's logo on its corner), the message and the
platform's reason, and a Retry button (`STATUS_BUTTON.secondary`). Fills the profile column. Used by
the Steam, PSN and Xbox profiles on the home in place of their red line and small pill.
**Why** — The user saw the Xbox profile fail ("limited right now") as a bare line of red text and
asked for a proper component for when a platform cannot load.
**Decisions** — No new strings: each platform's `profileError`, reason (`errors.*`, Steam's private
hint) and `retry` are reused. RA's profile on the home has no error state of its own, so it is untouched.

---

## 2026-10-21 — The worklog and the version no longer conflict on merge (`chore/worklog-union-merge`)

**Did** — `.gitattributes`: `docs/worklog.md merge=union`. A rule for it in CLAUDE.md
(Documentation) and a note in this file's instructions.
**Why** — Every branch adds its entry at the top, so bringing any branch up to date with
`develop` conflicted here (it happened twice on 2026-10-21, PR #41 among them).
**Decisions** — Git's built-in `union` driver: no config, no script, works for every clone.
Tested on a toy repo: both entries kept, the `---` between them lost (cosmetic). The version
files (`package.json`, `version.ts`) get their own driver, `scripts/merge-version.js`: it
sets both sides to the higher version, then lets git merge the rest of the file, so a real
conflict elsewhere in `package.json` still shows. Registered by `npm run prepare` (a custom
driver lives in `.git/config`, not in the repo). Tried on a real merge with
`feat/platform-load-error`: no conflicts at all.
**Watch out** — Run `npm run prepare` once in each clone, or the version still conflicts.
GitHub's "Update branch" button does not run the version driver: merge locally.

---

## 2026-10-21 — PS3 and PS Vita always in the PSN consoles preference (`fix/psn-consoles-preference`)

**Did** — `PsnGamesDataContext` lists PS3, PS Vita, PS4 and PS5 in the consoles preference always
(`PSN_CONSOLES`, through a new `always` argument of `consoleOptions`), with 0 for a console the
library does not have. Tests: `consoleFilter.test.ts`, `PsnGamesDataContext.test.tsx`.
**Why** — The user wanted PS3 and Vita in the PSN tab to show or hide, like PS4/PS5 and Xbox's.
**Decisions** — The list was already built from the library, so PS3/Vita showed only when the
library had them; now the four are fixed. Nothing listed while the library is empty (loading).
**Open** — Could not read the cache to check whether the user's library has PS3/Vita games at all
(the `.env.local` database password was refused).

---

## 2026-10-20 — Xbox shelf cards with sharp art (`fix/xbox-shelf-art`)

**Did** — `LibraryShelfBanner` asks `/api/xbox/details` (through `useXboxGameDetails`) for an Xbox
game's IGDB `heroUrl` and shows it sharp, as RA's screenshots; the shelf detail backdrop follows,
since it draws the same banner. Test: `LibraryShelfBanner.test.tsx`.
**Why** — The user saw every Xbox card in the library shelves blurred: Xbox sends only a square
tile, and the banner blows a tile up and blurs it.
**Decisions** — Reused the game page's route (cached half a year on the server, `cachedJson` in the
browser) instead of a new art-only one. One request per visible card, so at most a shelf's worth.
**Open** — Cold, the route makes two IGDB searches per game (details and art) and `searchGames`
does not retry a 429, so a first load with many Xbox cards may leave a few blurred until the next
visit. Games IGDB does not match stay blurred.
**Also fixed** — The 360 MW3 showed the 2023 game: Xbox names it "Modern Warfare® 3" and lists it on
360, One and Series (backward compatible), so the IGDB search took the newer game. A game with
Xbox 360 among its consoles is now searched on 360 alone (`igdbXboxPlatforms`), and `bestMatch`
prefers a title that ends with the name ("Call of Duty: Modern Warfare 3") over IGDB's first hit,
which on 360 alone was a DLC pack. Affects the game page's details too. New cache keys (the
platform list is in them), so nothing to bump.

---

## 2026-10-20 — See who follows you (`feat/rankings-zone-and-personas`)

**Did** — `/following` has tabs (`FollowingTabs`): Following and Followers (`#followers`, read
when opened through `useFollowers` → `GET /api/follows/overview?who=followers`). The list, its
search and its states moved to `FollowingList`, shared by both tabs. The account page's
"Followers" count is now a link like "Following". Followers are counted and listed only when
their profile is public, as the people you follow already were. The privacy policy's follows
sentence changed in all nine languages: you see both lists, nobody else sees who follows whom.
**Why** — The user wanted to see who follows them and to change the policy for it.
**Decisions** — Only you see your followers; no follower list on public profiles. Added a
"Follows" section to CLAUDE.md so that stays true.

## 2026-10-20 — Following section: cards across the width (`chore/demo-personas`)

**Did** — In the home's Following section (`MainPageFriends`), "Who you follow" left the
leaderboard's column and spans the width (3 columns on xl); "Latest from who you follow" sits
beside the leaderboard, exactly as tall (out of the flow on xl, its list scrolling inside with a
thin scrollbar in the accent). The old sticky/stretched switch (`quiet`) is gone.
**Why** — With 11 follows the cards made the left column long and left a blank hole under the feed.

## 2026-10-20 — Rankings: 20 at a time, most active this week, 60 demo users (`chore/demo-personas`)

**Did** — The list pages 20 at a time. `/api/rankings` adds `hot`, the five who earned most this
week (global, every platform, whatever the view), shown under your level as `RankingsPageHot`
with a button to the weekly ranking (strings `hotTitle`, `hotSee`, nine languages). The demo seed
gives each persona a twin (`TWINS` in `demo-personas.mjs`: same tastes, another name and another
of its badges as picture) and multiplies demo points by `SCALE` = 30, so the user (116 k) ranks
about mid-table and "your zone" can be seen. Reseeded pre: 60 users, 24.7 MB of cache.
**Why** — The user asked for 20 at a time, to see their zone, twice the users and something to
fill the empty space under "Your level".
**Watch out** — The pre-commit hook rewrites `package.json`; once, the dev server read it half
written and kept failing with "Invalid package config" until restarted.

## 2026-10-20 — Rankings: top 30, your zone and a trend per row (`chore/demo-personas`)

**Did** — `/api/rankings` pages 30 at a time and returns `zone`/`zoneStart` (the viewer and who
stands around them; `above`/`below`, 2 by default, up to 50) and each row's `trend` (last 8
weeks, `weeklyTrend` in `src/lib/rankings.ts`); `near` is gone. The page shows `RankingsPageZone`
below the list when you are not in it (each other row says how far ahead or behind you they are;
"N more above/below" widen it through `useRankings().widen`, never past where it meets the list),
and the table a Trend column (`VaultSparkline`, from lg up). "Close rivals" (`RankingsPageNear`)
is removed; the pinned bar now shows only when you are not listed (it says why).
**Why** — The user picked option A of the canvas (top 30 plus your zone), kept the level panel as
it was and the rows as they were, plus the trend line of the third row design.
**Decisions** — The ranking is still computed in memory per request (cached 5 min): fine now; a
totals table indexed by points is the step for very many users (noted in `architecture.md`).
Strings: `near` became `zone` (+ `zoneOf`, `zoneUp`, `zoneDown`, `colTrend`, `trendA11y`) in all nine.
**Watch out** — Checked locally with the page size lowered to 5 for a moment (you rank #1 with
30 personas): the zone met the list and offered "4 more below".

## 2026-10-20 — Rankings entry animation (`chore/demo-personas`)

**Did** — `/rankings` comes in: the podium rises third, second, first, its steps grow and the
points count up (`CountUp`, which gained `locale` and `delay`); table and list rows stagger in
(capped after 14 rows); the side panel slides in, the level ring fills from empty
(`CircularProgress animateIn`, CSS `ring-in` in `globals.css`) and the level counts up; your
pinned bar rises from the bottom. Variants in `rankings-page/rankingsMotion.ts`;
`MotionConfig reducedMotion="user"` leaves only the fades under reduced motion. The jest mock of
framer-motion gained `MotionConfig` and drops `custom`.
**Why** — The user asked for an entry animation.
**Open** — Proposals for pagination at scale, "Tu zona" instead of "Rivales cercanos", the level
panel beside the podium, and the row design are on a canvas for the user to choose; nothing of
that is built yet.
**Watch out** — Playwright's window here renders at ~2 fps (in the background), so animations
cannot be judged from it; check them in a real browser.

## 2026-10-20 — Rankings avatars load gracefully (`chore/demo-personas`)

**Did** — `RankingsPageUser` draws pictures through `FadeImage` (a pulse in the circle while
loading, then a fade-in) and shows the user's initial, in the theme's accent, when there is no
picture or it fails. `FadeImage` gained a `fallback` prop for that.
**Why** — The user found the cold load cheap-looking: empty circles, then pictures popping in.
Signed out, uploaded avatars (`/api/avatar/…`, sign-in only) answered 401 and stayed empty.
**Open** — Other lists of users (Following, search, compare) still use a plain image; move them
to the same pattern if the user wants it everywhere.

## 2026-10-20 — Demo personas with full profiles (`chore/demo-personas`)

**Did** — The 45 `demo_*` users are now 30 hand-written personas (`scripts/demo-personas.mjs`:
name, country, bio, theme, gender, hours they play, weekends only, presence, showcase size, the
games they play and how far). `scripts/demo-rankings.mjs` builds their Steam and PSN libraries,
recent unlocks, year feeds, each game's list and the PSN summary, and writes them into pre's
`steam_cache` under their made-up accounts, never expiring; their Vault Points, weeks and
showcase come from the same lists through the real formula (`vaultScore.ts`, imported by Node).
Checked on localhost: spex_guy (Steam, 41-day streak, showcase, completed shelf), ratman (PSN,
platinums, hours, Spanish trophies), a PSN and a Steam game page, the rankings.
**Why** — The user wanted to review public profiles with data and the demo users to have personality.
**Decisions** — No "demo mode" in app code: the app reads its cache as for anyone. Games are
real ones whose definitions pre already had cached for real users (15 Steam, 27 PSN), so names,
badges and rarity are real; only who earned what and when is invented. No RA (the dev server
skips RA's DB cache; a made-up RA name may be a real person). PSN trophy lists in English and
Spanish only (a copy per language; 12 MB in all). Online personas have `last_seen_at` in 2100.
Monday's ranks are computed among real users too, so the arrows are right.
**Open** — Check dev.cheevovault.com once merged (same database, so it should already show them).
**Watch out** — "Ver en PSN" links to a PSN profile by the persona's name, which may be someone
real. If pre loses the cached games (reset from production, an unlink of the user's accounts),
re-seeding warns and leaves those games out. Steam game pages refetch the global schema from
Steam when it has expired (slow first load, then cached).

## 2026-10-20 — Demo users on the preview database (`feat/social-rankings`)

**Did** — The user created the Neon branch and set `PREVIEW_DATABASE_URL`; checked that local
work reads it (a marker written only on pre showed on localhost; production unchanged; marker
removed). Added `scripts/demo-rankings.mjs` (`seed` / `clear`, preview database only) and seeded
40 `demo_*` users with scores, weeks, Monday ranks, presence and follows; `ivanxmarine` follows
ten of them on pre. Checked the Following rankings in the browser.
**Open** — `dev.cheevovault.com` uses pre only once this branch reaches `develop`.

## 2026-10-20 — A database of its own for pre (`feat/social-rankings`)

**Did** — `src/lib/db.js` reads `PREVIEW_DATABASE_URL` before `DATABASE_URL`, except in production
(`VERCEL_ENV`), so `develop` and local work can use a Neon branch of production (`preview`).
Documented in `.env.example`, README and CLAUDE.md (Environments).
**Why** — The user wants a pre that does not touch production (and fake users to test the
rankings with). The Neon integration owns `DATABASE_URL` for all environments, and Vercel refused
a branch-scoped `DATABASE_URL` for `develop` ("already exists for production, preview, development").
**Open** — The user creates the Neon branch and sets `PREVIEW_DATABASE_URL` (Vercel: Preview →
develop; and `.env.local`), then redeploys develop. Until then nothing changes. Then: a seed
script for demo users, run only against the branch.

## 2026-10-20 — Fill stuck at 99 %, a history chart, the guide in nine languages (`feat/social-rankings`)

**Did** — The user's fill stayed at "Calculating 99 %": Steam answers HTTP 500 every time for two
games with no achievements (Pavlov VR, Lethal Company; checked live), so they were re-read each
pass and the fill never ended. A game that fails on its own is now *skipped* (`FillPlatform.skipped`;
it does not hold the fill up and is retried at the next refresh); if every read of a platform
fails, it is `unavailable`, not done. The per-platform progress was redrawn as small cards (four
in a row on the account page) instead of bars across the whole card; platform cards say how many
games counted and how many were skipped. Added the weekly history (`weeks` in
`/api/rankings/me`, `VaultWeeksChart`, plain SVG) to the rankings' level panel. "How Vault Points
work" now in all nine languages (`vaultGuideMore.ts`). The podium keeps first in the middle when
fewer than three people rank. Checked in the browser with the real account: guide, rankings,
account page, header level.
**Decisions** — No fake users in production: `/rankings` is public, so they would show to
everyone (and in search, Following, profiles). Proposed instead: a Neon branch for a test copy.
**Open** — Testing with many users needs that separate database.

## 2026-10-20 — Points at once when a platform is linked, and a guide (`feat/social-rankings`)

**Did** — The fill of a new account no longer waits for heartbeats: `onPlatformLinked` (in the
RA, Steam, PSN and Xbox link routes) marks the platform "calculating" and runs a pass right after
the answer; `useVaultFill` (`VaultFillProvider` in `MainProviders`) asks `POST /api/rankings/fill`
for pass after pass until it is complete, polling `GET` for progress. Each platform is read at a
measured pace (`PACE` in `scoreRefresh`; PSN gentle, with an app-wide `psn-score` budget in
`attemptLimit`), and errors are classified (`private`, `key`, `busy`, `unavailable`). Progress
shows in the header (a ring), each platform card (`VaultFillLine`), the account page and the
rankings panel (`VaultFillProgress`); the viewer's points carry "≈"; toasts when ready or when a
platform fails. Also fixed: the viewer's own rankings row is read fresh (it came from a 5-minute
cache). New public page `/rankings/how` ("How Vault Points work", EN/ES in
`src/translations/vaultGuide.ts`, numbers from the formula; examples shared with the balance
tests in `src/utils/vaultExamples.ts`); the rankings' "how points work" now links to it (the
modal is gone).
**Why** — The user disliked a fill that took an hour unseen ("if I sign up I expect to be in the
rankings at once"), asked to be careful with PSN, and wanted the explanation of the weighting
for users.
**Decisions** — Measured before choosing paces (numbers in the plan). Progress kept in
`steam_cache` rather than a migration. "Ready" toasts only for a fill that was pending, never a
6-hourly refresh. Xbox's estimate counts as settled. The guide follows the public pages' rule
(EN/ES outside `T`).
**Open** — Not tried in a browser. RA per-key vs per-IP limit unknown. If PSN starts answering
"too many requests" in production, lower `PACE.psn` or the `psn-score` budget.

## 2026-10-20 — Vault Points and the rankings, a beta (`feat/social-rankings`)

**Did** — Built the whole plan in `docs/rankings-plan.md`:
- Engine: `src/utils/vaultScore.ts` (formula, stacks, unlock-tool check), `vaultLevel.ts`
  (levels, tiers, weeks/months), `vaultScoreInputs.ts` (per platform); `src/lib/scoreRefresh.ts`
  (lists each library once, reads only games that moved, provisional scores meanwhile);
  `src/lib/rankings.ts`; `migrations/040_vault_points.sql` (`score_games`, `score_periods`,
  `score_snapshots`, `users.show_in_rankings`, `users.score_refreshed_at`).
- Triggers: `after()` in `/api/presence` (6 h freshness) and `/api/cron/scores` (daily 05:00,
  takes the Monday snapshot). Routes: `/api/rankings` (public), `/api/rankings/me`,
  `/api/admin/rankings` (balance per platform, review of flagged Steam games).
- UI: `/rankings` (public; design A with B's level panel and C's close rivals), "Beta" label,
  "how points work" modal; level badge in the header, Following cards, home friend cards,
  public profile hero and your account page; "Appear in the rankings" switch in Preferences;
  the Following teaser is now its link; rankings in the nav; admin "Rankings balance".
- 9 languages, `/privacy` paragraph (and its sitemap date), sitemap and proxy entry for `/rankings`.
**Why** — The user asked for an internal score where every platform is worth the same, levels,
and rankings of everyone and of whom you follow, all of it at once rather than in phases.
**Decisions** (the user's) — no ownership verification for now ("trust people"; an account
linked twice scores for both); periods all-time, month and week; public without a session;
hidden games and consoles do not score; 1.6.0 with only the rankings marked beta.
Mine: `show_in_rankings` kept out of the session so a missing migration breaks only the
rankings; levels on cards read through `vaultTotalsOrNone` for the same reason; RA and Steam
games read straight from the platform (their page caches can predate the unlock that moved
the game); no per-platform factor until real data asks for one.
**Open** — `migrations/040` applied to the shared database 2026-10-20 (with the user's OK).
Watch the first refreshes (Vercel logs `[scoreRefresh]`) and the admin balance table; the formula was only tested on
illustrative data. Not checked in a browser yet.
**Watch out** — A first fill reads 25 RA / 40 Steam / 15 PSN / 5 Xbox games per run and comes
back after 10 minutes while unfinished, so a big library takes a few visits (or days of cron)
to settle; until then games count provisionally. RA refreshes spend the user's own key.

## 2026-10-20 — Branch split, rankings designed (`feat/social-rankings`)

**Did** — `improvements_11` held two unrelated sets of work. The social one (Following
restyle, presence, achievement showcase: 7 commits) was cherry-picked onto `develop` as
`feat/social-rankings`; `improvements_11` was rebuilt on `develop` with the rest (progress
chart periods, 404/error screens, lazy modal suspense, PSN-only header) and force-pushed. The
code of every commit is byte-for-byte the original; only worklog, version and conflicts in
shared files were re-resolved. Added `docs/rankings-plan.md`: the Vault Points formula,
levels, the user's decisions and the verification analysis.
**Why** — The user wanted the friends/online work in its own PR, where the rankings will be
built too.
**Decisions** — The showcase went with the social branch: it changes `FollowingCard`, the
follows overview and the friends card, all on top of the Following and presence commits, and it
is what friends see. Older worklog entries keep saying `improvements_11`; read them as this
branch for Following, presence and the showcase.
**Open** — How ownership is verified (the user is weighing a return to sign-in per platform;
see the plan). Rankings not started.
**Watch out** — Both branches bumped the version from 1.5.18, so whichever merges second
conflicts on `version.ts`/`package.json`: keep the higher. A local backup of the old branch is
`backup/improvements_11-pre-split` (not pushed).

## 2026-10-20 — Showcase picker by game, multi-select (`improvements_11`)

**Did** — `ShowcasePickerModal` rebuilt as two views: the user's games with an achievement
earned (`useProfileLibrary`, played this year first, searchable), then one game's
achievements (`useShowcaseGameChoices` → RA `getGameProgression`, Steam `achievements`, PSN
`trophies`, Xbox `achievements`, mapped by `showcaseChoices`: earned first, newest first; the
rest greyed with a lock; hidden unearned ones concealed), with "back to the games". The
selection spans games: a game holding selected achievements gets a ring and "n selected";
selected achievements a ring and a tick; the footer says how many fit and adds them all at
once (`useShowcase.addMany`, one message). The old one-list row is gone.
**Why** — The user wanted to browse by game, see what is left, and pick from several games in
one go.
**Checked** — with the real account, nothing added: games list, a selection in one game and
its badge back in the list; RA, PSN, Steam and Xbox games all load.

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

## 2026-10-20 — Following, presence and showcase moved out (`improvements_11`)

**Did** — The Following restyle, presence ("online" / "last seen") and the achievement
showcase now live in `feat/social-rankings`, with their own PR, where the rankings will be
built. This branch keeps the progress chart periods, the 404/error screens, the lazy modal
suspense fix and the PSN-only header. One commit takes the social work back out, so the branch
did not need a force-push; its tree is the same as these four commits cherry-picked on
`develop` (tested: jest, lint, build).
**Watch out** — `migrations/038` and `039` are already applied to the shared database; this
branch no longer uses them, which is harmless. Their notes in CLAUDE.md are in the other branch.

## 2026-10-20 — Header for PSN-only accounts (`improvements_11`)

**Did** — `MainHeader` decided "has a platform" from RA or Steam only, so an account with only
PSN (or only Xbox, for an admin) got a bar with no search, no Library, Groups or Following.
It now counts PSN, and Xbox when `canUseXbox`. Tests for both.
**Watch out** — A new platform must be added to that check, or its users lose the bar.

## 2026-10-18 — New 404 and error screens (`improvements_11`)

**Did** — Three screens, sharing `StatusBadge` (an achievement tile with a corner badge and a
slow glow), `STATUS_BUTTON` and `useRise` (the landing hero's entrance) / `useGoBack` (back,
or home in a tab with no history):
- **404** (`NotFoundScreen`): a hidden achievement nobody has unlocked — "?" with a lock,
  "Hidden achievement · 404", "Explorer of the unknown", a card at 0 / 1 with 0.00 %
  rarity (`NotFoundProgress`), home and back. The root `not-found.tsx` shows it full screen.
- **404 inside the app** (`src/app/(main)/not-found.tsx`, new): a `notFound()` under `(main)`
  now keeps the header. On `/psnGame|steamGame|xboxGame/…` (`gameSourceFromPath`) it shows
  `NotFoundGame` (empty cover with the platform logo, "We could not find this game", library
  and back); elsewhere (e.g. `/foo`, caught by `[category]/layout`) the hidden achievement.
- **Errors** (`RouteError`, now also rendered by `global-error`): the 404's twin in red, an
  unlock cut short — alert tile with a retry badge, a card with the bar stopped at 62 % in the
  theme's colour and the `error.digest` with a copy button (`RouteErrorCard`), retry and home.
`T.errorBoundary` and `T.notFound` gained their keys in all 9 languages.
**Why** — The user wanted better 404 and error screens. Five variants were mocked up as an
artifact, then three error variants; they picked "hidden achievement" (404), "unlock
interrupted" (errors) and the in-app 404 with context.
**Decisions** — The game 404 says "could not find" rather than "not in your library": Steam
404s only on a malformed id (a game not owned still opens). An Xbox game URL gives a
non-admin the plain 404, with no word of Xbox. The second action is back, not search: the
search modal is local state of the header. Only the digest is shown, never the error message.
**Checked in the browser** (dev server, signed in and in a fresh signed-out context, desktop
and 390 px; temporary throwing pages, since deleted) and fixed what it showed:
- Retry used `reset()`, which never re-asks the server: a server error could not recover.
  Now `retry()` (Next 16.3, `error.tsx` props `{ error, retry }`); clicking it fetches anew.
- The screens sat at the top: the layout's `<main>` is a block, so `flex-1` did nothing.
  They now take `min-h-[calc(100dvh-7rem)]` (`STATUS_SCREEN`), measured header + footer.
- Two `<main>` landmarks (the layout's and the screen's): inside the app they are a `<div>`.
  `role="alert"` moved from the root to the message block (on a `<main>` it hid the landmark).
- Signed out, Next renders `(main)/not-found` too, with no layout: the screen was short and
  `<html>`'s darker background showed below. `(main)/not-found` is now a server component
  that reads the session (signed out → full screen); the client part is `NotFoundInApp`.
  The root layout's `<body>` got `min-h-screen`, so no short page shows that band.
- `/a/b/c` got the root 404, without header: `[category]/[consoleId]/[...missing]/page.tsx`
  now calls `notFound()`, so every unknown URL lands in `(main)/not-found` (checked: /a/b/c,
  /playing/3/x, /groups/x/y with header; /playing/3 still works).
- `global-error` (seen by making the root providers throw, since reverted) used the system
  font: it replaces the root layout and lost Inter's class. The font is now `src/lib/fonts.ts`,
  set by both.
**Decisions** — Not fixed, on purpose: game 404s (and /playing/3/x) answer HTTP 200 because
those routes stream (`loading.tsx`) and call `notFound()` on the client after the library
loads; a real 404 would need the library on the server before rendering (PSN/Xbox calls per
visit) or dropping the skeletons, for private pages no crawler sees. React's dev-only warning
"Encountered a script tag" on 404 pages comes from the theme script in the root layout (a 404
document is rendered on the client in dev); moving it to `next/script` risks a theme flash on
every page, for a warning production never shows.
**Watch out** — `global-error` is always dark (violet): it has no theme provider.

## 2026-10-18 — Clicking the "Achievements unlocked" chart lists that period (`improvements_11`)

**Did** — Clicking a point of a game's weekly/monthly chart (`GameAchievementsProgressChart`,
in every opened Recently played card and the library's opened cards) opens
`GameAchievementsProgressChartModal`: what was unlocked that week or month, newest first,
each a link to the achievement (rows from `LibraryDetailList`). The chart now takes
`InsightAchievement[]` (`fromRa`/`fromSteam`/`fromPsn`/`fromXbox`) instead of bare dates, and
`groupGameAchievementsByPeriod` returns each bucket's items and start.
**Why** — The user asked for it (the branch is for more improvements to come).
**Decisions** — The modal is lazy (`next/dynamic` + `LazyWhenOpened`) and portalled to
`<body>`, since the opened card animates. A point with no unlocks opens nothing.
**Watch out** — The buckets were labelled with `toISOString()` of a local midnight: east of
UTC the monthly view's last bucket was the previous month, and this month's unlocks fell in
no bucket. They are now local (`localDay`). Collection trophies are keyed `gameId:trophyId`
in the chart, since ids repeat across its games. The `fromX` links do not carry the profile
being viewed (`useSubject`), as in the library; on someone else's page they open the game
for the viewer.
**Fixed after** — The first click flashed the whole screen: a `next/dynamic` with no
`loading` has no Suspense boundary of its own, so downloading the modal suspended the home
page up to its `loading.tsx`. Every lazy modal (header, groups, pins, account page, login)
now passes `{ loading: () => null }`; the rule is in CLAUDE.md, "Performance rules".

---

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
