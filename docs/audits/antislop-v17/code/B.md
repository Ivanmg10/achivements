# B — Groups, account page, rankings, following, streak, public profile, rankings guide

Auditor notes: The area is tidy file by file (small files, real doc comments, entrances and skeletons in place), but it was built one platform and one page at a time, and the same pieces were drawn again each time. Four group cards, four account cards, two link forms, six stat tiles, seven avatars and thirteen 22 px tags are written out by hand, often next to a `ui/` piece that already does the job (`PlatformLogo`, `StatCard`, `Notice`, `Pill`, `SearchInput`, `Button loading`, `Modal title/footer`, `dataTable`). Comments are mostly fine. The two real rule breaches are the `—` placeholders on the account cards and a statically imported modal.

## Findings

### B-01 · HIGH · duplication
- **Where:** `src/components/groups/sortable-item/SortableItem.tsx:78-195`, `steam-sortable-item/SteamSortableItem.tsx:66-183`, `psn-sortable-item/PsnSortableItem.tsx:58-167`, `xbox-sortable-item/XboxSortableItem.tsx:64-163`
- **What:** The four platform cards on a group page share the same shell, line for line: the spotlight card, the grip button, the cover link marked "kept out of the tab order", the title link, the console chip, the "x / y" line, the bar with its %, the "kept when there is nothing to show" spacer, "played · added", the remove button, the stretched ▼ expand button and the panel. They differ only in where the data comes from, which chip they show and which achievement grid sits in the panel. The copies have also drifted apart. The focus ring is in the platform colour on three of them (`ring-[#66c0f4]`, `ring-[#0070d1]`, `ring-success`) and in the accent on RA. RA's panel slides open (`inert` + grid rows) while the other three mount it with `{open && …}`. The completion ring uses `#a4d007`, `sky-300` or `success`.
- **Fix:** Build one `group-game-card/GroupGameCard.tsx` shell that takes `{ href, cover, chips, progressText, pct, softPct?, infoLine, lastPlayed, addedAt, panel }`. Each platform keeps a small adapter: a function in `src/utils/groupItems.ts` or a 25-line component that reads its context (`useSteamGamesData`…) and passes the view model. Pick one expand behaviour and one focus ring (the accent, as on the rest of the site). Use `IconChevronDown` instead of the "▼" glyph rotated by inline style.
- **Size:** 712 → ~250

### B-02 · HIGH · duplication
- **Where:** `groups/add-game-modal/AddGameModal.tsx:85-116,201-235`, `groups/group-modal-game-picker/GroupModalGamePicker.tsx:40-126`, `src/components/pin-game-modal/PinGameModal.tsx:50-136` (outside this area)
- **What:** The same game picker is written three times: the `directGameId` regex parse (verbatim ×3), the selection toggle, search versus suggestions, the "ID #n" direct button, the `GamePickerTile` grid and the chip row. The copies now behave differently. `GroupModalGamePicker.addById` shows an alert when the RA lookup fails, but `AddGameModal.addDirectById` just `return`s (`if (!c) return`). That is a silent failure, which CLAUDE.md → Toasts calls a bug.
- **Fix:** Add `parseRaGameId(query)` to `src/utils/gameCandidates.ts`. Add a `useGamePicker(candidates, { exclude, max })` hook in `src/hooks/` that owns the query, the direct id, the shown list and the lookup-failed state. Add a `game-picker/game-picker-results/GamePickerResults.tsx` that draws the direct button, the grid and the empty line. The three modals keep only their layout.
- **Size:** ~150 lines of repeated logic and JSX → ~60 shared

### B-03 · HIGH · library
- **Where:** `groups/GroupModal.tsx:86-93,119-138,190-215`, `groups/add-game-modal/AddGameModal.tsx:76-83,161-182,264-270`, `groups/delete-confirm-dialog/DeleteConfirmDialog.tsx:20-40`
- **What:**
  - `GroupModal` and `AddGameModal` wrap `Modal` in their own `createPortal(<AnimatePresence>{isOpen && …}</AnimatePresence>, document.body)`. They also add a `window` Escape listener and draw a header with a hand-made ✕ button. `Modal` already does all of that: it portals to `<body>`, has its own `AnimatePresence`, handles Escape on `document` with `stopPropagation()` (so the `window` listener never runs) and has `title`/`hint`/`footer`/`showClose`. The comment "On <body>, so an animated (transformed) page wrapper does not become its frame" restates what `Modal` does.
  - Both modals show `saving ? '…' : label` instead of `Button loading`.
  - `DeleteConfirmDialog` returns `null` when closed (no exit animation, unlike other modals), has no title, and is not `tone="danger"`. It confirms a deletion, which is exactly what `alertdialog` is for.
- **Fix:** Use `<Modal title hint footer size>`. Drop the portal, the `AnimatePresence`, the Escape effect and the ✕ buttons. Use `<Button loading={saving}>`. `DeleteConfirmDialog` becomes `<Modal tone="danger" title footer>`.
- **Size:** ~70 lines cut across the three

### B-04 · HIGH · duplication
- **Where:** `groups/group-icon/GroupIcon.tsx` (whole file), `groups/group-icon-display/GroupIconDisplay.tsx` (whole file), `groups/group-cover-mosaic/GroupCoverMosaic.tsx:6,31-39`. Wrappers: `GroupAlbumCard.tsx:45`, `GroupShelfRow.tsx:33`, `GroupDetailHero.tsx:96`, `GroupModalPreview.tsx:44`
- **What:**
  - A group's icon (emoji, image URL or folder) is drawn three different ways, with `isImageUrl`/`isUrl` copied three times. Each caller of `GroupIconDisplay` then resizes it from outside with `[&>span]:text-xl [&>img]:w-full [&>img]:h-full` (4 copies).
  - `coverSrc` is a util living in a component file and is imported by 8 files.
  - `(group.covers ?? []).map(coverSrc).filter(…).slice(0, 4)` is repeated in `GroupAlbumCard:19`, `GroupCoverMosaic:30` and `GroupModal:70`.
- **Fix:** Make one `GroupIcon({ icon, size })` that sizes itself. Delete the other two (the main page uses `GroupIcon` too). Move `coverSrc` and a `groupCovers(group, n)` helper to `src/utils/groupItems.ts`.
- **Size:** 115 → ~40

### B-05 · HIGH · rule
- **Where:** `user-page/user-platforms/UserPlatforms.tsx:25-27,50,58`, `user-steam-card/UserSteamCard.tsx:14-16,30-36`, `user-psn-card/UserPsnCard.tsx:30,38`, `user-xbox-card/UserXboxCard.tsx:32,37,40`
- **What:** The account page's platform figures show `—` while they load, through a `pending()` helper (copied verbatim in two files) or a local `value()` helper. CLAUDE.md → Loading says "a figure on its way is `loading` on `StatPill` / `StatCard` / `PlatformStat`, never a `—`". `PlatformStat` already has `loading`, and the RA rank uses it two lines above.
- **Fix:** Pass `loading: libraryLoading` (or `isLoading`) on each stat and delete both helpers. Keep `—` only for a value that is truly absent.

### B-06 · HIGH · duplication
- **Where:** `user-psn-card/user-psn-card-form/UserPsnCardForm.tsx` and `user-xbox-card/user-xbox-card-form/UserXboxCardForm.tsx` (identical but for strings and logo). Identity block: `UserPlatforms.tsx:77-94`, `UserSteamCard.tsx:57-67`, `UserPsnCard.tsx:74-91`, `UserXboxCard.tsx:72-90`. RA card: `UserPlatforms.tsx:67-115` and `src/components/connect-accounts/ConnectAccounts.tsx:53-66`
- **What:**
  - The two link forms are the same component twice.
  - The "avatar or logo, name, id" identity block is written four times.
  - The unlink-and-toast handler is written four times.
  - Steam, PSN and Xbox each have a card file, but RA's card is inline in `UserPlatforms` and copied again (gradient, logos, button) in `ConnectAccounts`.
- **Fix:**
  - One `user-platform-link-form/UserPlatformLinkForm.tsx` (label, placeholder, maxLength, logo, error text, busy texts).
  - Change `UserPlatformCard`'s `identity` into data (`{ avatar, name, id, note }`) and draw the block once.
  - Extract `user-ra-card/UserRaCard.tsx` and use it in both places.
- **Size:** ~200 → ~110

### B-07 · HIGH · duplication
- **Where:** In this area:
  - `public-user-about/PublicUserAbout.tsx:23-28`
  - `public-user-platforms/PublicUserPlatforms.tsx:17-22`
  - `public-user-platform-chips/PublicUserPlatformChips.tsx:59-65`
  - `groups/group-platform-logos/GroupPlatformLogos.tsx:26-29`
  - `user-preferences-card/UserPreferencesCard.tsx:92-95`
  - `UserSteamCard.tsx:50-51`, `UserPsnCard.tsx:60-61`, `UserXboxCard.tsx:58-59`
  - `steam-sortable-item:81,108,113`, `psn-sortable-item:72,93`

  Repo-wide: `#66c0f4|#0070d1|#107c10` appears 114 times in 56 files.
- **What:** Platform logos are tinted by hand with hex classes, and four local `Record<GameSource, ReactNode>` maps rebuild what `src/components/platform-logo/PlatformLogo.tsx` already is. The platform chip with an account name is also drawn twice, in `PublicUserPlatformChips` and `following-card-platforms/FollowingCardPlatforms.tsx`.
- **Fix:** Use `<PlatformLogo source size />` everywhere. If the gradients on `UserPlatformCard` must stay, give the platform hues one map (for example `PLATFORM_HUE` next to `PLATFORM_NAME` in `utils/gameRef`). Merge the two chip lists into one `platform-account-chips/PlatformAccountChips.tsx` (optional external link per chip).

### B-08 · HIGH · duplication
- **Where:**
  - `public-user-hero/PublicUserHero.tsx:35-52`
  - `public-user-compare/PublicUserCompare.tsx:31-44`
  - `following-card/FollowingCard.tsx:45-55`
  - `following-hero/FollowingHero.tsx:66-75`
  - `following-rankings-teaser/FollowingRankingsTeaser.tsx:64-70`
  - `rankings-page-user/RankingsPageUser.tsx:49-63`
  - `user-identity-card/UserIdentityCard.tsx:84-97`

  `IconUser` is imported for this in 19 files repo-wide.
- **What:** "Another user's round picture, a fallback when there is none, and a `PresenceDot`" is drawn seven times in this area. The fallbacks disagree: `IconUser`, the initial, or a `?`. Only `RankingsPageUser` handles a picture that fails to load (`FadeImage` with a fallback).
- **Fix:** Add one `user-avatar/UserAvatar.tsx({ src, name, size, online?, ring? })`, built from the picture half of `RankingsPageUser` (it has `FadeImage` and the initial). It covers the CLAUDE.md "wherever another user's picture shows, so does the dot" rule in one place.

### B-09 · HIGH · library
- **Where:**
  - `src/components/ui/StatPill.tsx:64` (`StatCard`)
  - `user-vault-stat/UserVaultStat.tsx`
  - `user-platform-card/UserPlatformCard.tsx:99-114`
  - `rankings-page-level-panel/RankingsPageLevelPanel.tsx:93-104`
  - `streak-quick-stats/StreakQuickStats.tsx:5-7,38-44`
  - `public-user-platforms/PublicUserPlatforms.tsx:56-69`
- **What:** The same "label on top, big figure under it, on a `bg-bg-main rounded-tile`" tile is drawn six ways, with slightly different paddings and type sizes. `UserVaultStat` is `StatCard` plus `icon`, `sub` and `CountUp`.
- **Fix:** Give `StatCard` `icon`, `sub` and `count` (CountUp) props and a `size`. Delete `UserVaultStat` and render the other four lists through `StatCard`. CLAUDE.md asks for a variant on the piece, never a copy.

### B-10 · HIGH · duplication
- **Where:**
  - "≈" mark: `RankingsPagePodium.tsx:66`, `RankingsPageTable.tsx:76`, `RankingsPageList.tsx:49`, `RankingsPageMeBar.tsx:52-56`, `RankingsPageLevelPanel.tsx:54`, `UserVaultLevel.tsx:44-48`
  - `T.rankings.toLevel.replace(…).replace(…)`: `RankingsPageLevelPanel.tsx:70,87`, `RankingsPageMeBar.tsx:37,62`, `UserVaultLevel.tsx:24`, `main-page-portada-side-level/MainPagePortadaSideLevel.tsx:42,56`
  - ahead/behind: `RankingsPageTable.tsx:67`, `RankingsPageList.tsx:43`
  - "n VP": `RankingsPagePodium:67-68`, `Table:77`, `List:50`, `MeBar:57`, `Hot:27`, `RankingsGuide:99`, `RankingsGuideExample:37`
- **What:**
  - The approximate mark `<span className="text-warning" title={T.rankings.fillApprox}>≈ </span>` is written six times.
  - The "to the next level" sentence is built seven times.
  - The "ahead/behind" gap is built twice.
  - A number with a small "VP" after it is written seven times.
- **Fix:** Add `toNextLevel(progress, T, n)` (and `gapText`) to `src/utils/vaultLevel.ts`, and a `vault-points/VaultPoints.tsx({ value, approx?, size })` that draws the ≈, the number and the unit.

### B-11 · HIGH · library
- **Where:** `h-[1.375rem] px-2 rounded-tag` appears 13 times in 10 files. In this area:
  - `RankingsPage.tsx:64`, `RankingsRouteSkeleton.tsx:18`, `RankingsGuide.tsx:47`, `FollowingRankingsTeaser.tsx:45` (the Beta tag, identical ×4)
  - `RankingsPageLevelPanel.tsx:81`, `RankingsPageDelta.tsx:7` ("The design's 22 px tag")
  - `GroupAlbumCard.tsx:54,65,77,80`, `GroupDetailHero.tsx:87,105-107`, `UserIdentityCard.tsx:110`
- **What:** A design token tag with no library piece behind it, so every page restates its classes. The Beta tag alone is four copies of one string.
- **Fix:** Add a `ui/Tag.tsx({ tone: 'accent'|'success'|'info'|'warning'|'danger'|'neutral' })` with its specimen and guard rule, and a `BetaTag` (or `<Tag tone="accent">{T.rankings.beta}</Tag>`).

### B-12 · MED · library
- **Where:**
  - Follow, share and edit-profile buttons: `public-user-follow-button/PublicUserFollowButton.tsx:14-25`, `public-user-share-button/PublicUserShareButton.tsx:22-29`, `PublicUserHero.tsx:79-85` (the same class string ×3)
  - Error + retry block: `following-list/FollowingList.tsx:56-67`, `RankingsPage.tsx:80-86`, `public-user-error/PublicUserError.tsx:15-19`
  - "More" buttons: `RankingsPage.tsx:109-117`, `PublicUserGames.tsx:127-135`
  - `RankingsPageZone.tsx:13,64,78` (raw `<button className={buttonClass(…)}>`)
  - `RankingsPageHot.tsx:33-38`, `UserIdentityCard.tsx:156-161`, `AddGameModal.tsx:256-262`
- **What:** Controls drawn by hand next to `Button`, `ShowMore` and `SectionFallback`. The error-with-retry block is the same 8 lines in three files.
- **Fix:** Use `<Button variant="secondary|quiet" size="sm">` (`href` for the edit link) and `ShowMore`/`Button` for "more". Add one `retry-notice` piece, or a `SectionFallback` with a message prop, for load errors.

### B-13 · MED · library
- **Where:** `user-identity-card/UserIdentityCard.tsx:150-164`, `email-verification-notice/EmailVerificationNotice.tsx:22-25,38-53`
- **What:** Three warning and success notices are drawn by hand (tint, ring, icon, title, link button). That is `ui/Notice` with `tone`, `title` and `action`.
- **Fix:** `<Notice tone="warning" title action={<Button variant="quiet" size="sm">…}>`.
- **Size:** ~45 → ~18

### B-14 · MED · library
- **Where:**
  - Chips: `add-game-modal-platforms/AddGameModalPlatforms.tsx:23-32`, `PublicUserGames.tsx:21,98,106`, `FollowingToolbar.tsx:64`, `RankingsPageToolbar.tsx:52`, `GroupModalIconPicker.tsx:18,36-44`
  - Search fields: `AddGameModal.tsx:184-195`, `GroupModalGamePicker.tsx:78-91`, `PublicUserGames.tsx:67-78`, `FollowingToolbar.tsx:49-60`
- **What:**
  - `<button aria-pressed className={pillClass(on)}>` is exactly `<Pill pressed>`. `PublicUserGames` even wraps it as `const chipClass = (on) => pillClass(on)`, which adds nothing.
  - `GroupModalIconPicker`'s category `TAB` is a hand-made `rounded-full` pill, so it does not follow the design choice.
  - Four search fields hand-build "icon + `fieldClass({ icon: true })`", which is `ui/SearchInput`.
- **Fix:** Use `Pill` (with `count` where they show one) and `SearchInput`. The icon picker's categories become `Pill`s or a `SegmentedControl`.

### B-15 · MED · duplication
- **Where:** `rankings-page-table/RankingsPageTable.tsx:12-13`, `rankings-guide-table/RankingsGuideTable.tsx:16-32`, `RankingsGuide.tsx:80-106`
- **What:**
  - `RankingsPageTable`'s `TH`/`TD` repeat `src/components/ui/dataTable.ts`'s `TH`/`TD` (TH is the same classes in another order).
  - The guide styles its headers a third way.
  - Its levels table is 27 lines inline in `RankingsGuide`, which the extraction rule says should be its own file.
- **Fix:** Import `TABLE`/`TH`/`TD` from `ui/dataTable`. Move the levels table to `rankings-guide-levels/RankingsGuideLevels.tsx`, on the same constants.

### B-16 · MED · duplication
- **Where:** `following-rankings-teaser/FollowingRankingsTeaser.tsx:11-16`, `rankings-page-podium/RankingsPagePodium.tsx:12-23`
- **What:** The podium's ring, step colours and order are defined twice (the teaser's comment says "as the rankings page draws it"). The gold `rgb(250_204_21)` is hard-coded in both, outside the theme tokens and the tier utils.
- **Fix:** Export one `PODIUM` description (place → ring, step) from `rankings-page-podium` with a size argument, and put the gold in a token (or the tier util) like the other tier hues.

### B-17 · MED · duplication
- **Where:** `streak-page/StreakPage.tsx:30`, `streak-year-heatmap/StreakYearHeatmap.tsx:13-15` (`isoDay`). Also outside the area: `src/utils/utils.tsx:109-111` (private `localDay`), `utils/utils.tsx:454`.
- **What:** The local `YYYY-MM-DD` formatter is written again, although `localDay` is exported from `src/utils/activityInsights.ts:20`. `isoDay` is also a misleading name: it is the local day, not the ISO (UTC) day.
- **Fix:** Import `localDay` (and have `utils.tsx` re-use it too).

### B-18 · MED · duplication
- **Where:**
  - `FollowingHero.tsx:29`, `RankingsGuide.tsx:35`, `FollowingRankingsTeaser.tsx:35` (inline `style={{ background: 'radial-gradient(…accent…)' }}`)
  - `RankingsPageJoin.tsx:12`, `user-profile-banner/UserProfileBanner.tsx:22` (as classes)
  - Page title: `RankingsPage.tsx:61-72`, `RankingsRouteSkeleton.tsx:15-21`
- **What:**
  - The accent wash behind a hero is written five ways, three of them as inline styles.
  - The rankings title with its Beta tag and intro is copied into the route skeleton.
- **Fix:** Add a class in `globals.css` (`.accent-wash` with a position variable) or a `HeroWash` piece. Extract `rankings-page-header/RankingsPageHeader.tsx` and use it in both.

### B-19 · MED · library
- **Where:** The `SURFACE` classes written out in full, 12 times in this area:
  - `UserIdentityCard:73`, `UserPreferencesCard:99`, `UserPageSkeleton:9`
  - `RankingsPageLevelPanel:15`, `RankingsPageTable:42`
  - `FollowingCard:40`, `FollowingPageSkeleton:13`
  - `StreakChart:37`, `StreakList:64`, `StreakPageSkeleton:5,14`, `StreakWeekdays:19`, `StreakYearHeatmap:62`
- **What:**
  - `src/components/ui/surface.ts` exports `SURFACE` for exactly this, and the guide pages use it.
  - Three files keep their own `CARD` constant instead.
  - `RankingsPageLevelPanel` exports `CARD` and `RankingsPageHot` imports a class string from a sibling component.
- **Fix:** Use `SURFACE` everywhere, and drop the exported `CARD`.

### B-20 · MED · library
- **Where:** `user-preferences-card/UserPreferencesCard.tsx:6,104-118`, `public-user-body/PublicUserBody.tsx:9,51-53`, `public-user-activity/PublicUserActivity.tsx:6,25-37`
- **What:** These three use `main-page/…/MainPageProfileTabs` (a home-page component whose own doc says "The RA / Steam switch at the top of the main page profile column") as general page tabs. `ui/Tabs` already provides a tablist with roving tabindex and `tabIds`. The site ends up with two tab implementations.
- **Fix:** Move these callers to `ui/Tabs` (with an icon slot and a `size` if needed). Retire `MainPageProfileTabs`, or keep it only as a thin wrapper (main-page auditor).

### B-21 · MED · naming
- **Where:**
  - `user-psn-preferences/psn-preference-switch/PsnPreferenceSwitch.tsx` (used by `UserXboxPreferences.tsx:5`)
  - `user-profile-switch/UserProfileSwitch.tsx:34-51`
  - `user-consoles-preference/UserConsolesPreference.tsx:28-41`
  - `rankings-page-skeleton/RankingsRouteSkeleton.tsx`
- **What:**
  - `PsnPreferenceSwitch` is a generic row now used for Xbox too.
  - It draws the same "icon, label, state in words, switch" row as `UserProfileSwitch`, with a different look: an icon chip with a background and a small label, against a bare icon and a bold label. Both looks appear in the same preferences card.
  - `UserConsolesPreference` repeats that head a third time.
  - `RankingsRouteSkeleton` sits in a folder named after another file, which breaks the `kebab-folder/PascalFile` rule.
- **Fix:** Move the generic row to `user-page/preference-switch-row/PreferenceSwitchRow.tsx` (one look). `UserProfileSwitch` wraps it with the save hook, and the consoles head reuses it. Give `RankingsRouteSkeleton` its own folder.

### B-22 · MED · duplication
- **Where:** `GroupModal.tsx:22`, `GroupModalGamePicker.tsx:72`, `GroupModalIconPicker.tsx:32`, `PublicUserAbout.tsx:61,77,106`, `PublicUserCompare.tsx:137`, `PublicUserPlatforms.tsx:31`, `PublicUserRecentUnlocks.tsx:21`, `FollowingCard.tsx:85`. Repo-wide: 43 copies in 39 files.
- **What:** The small kicker `text-[10px] uppercase tracking-widest text-text-secondary` is a design element with no name.
- **Fix:** A `KICKER` constant in `ui/` (or a `SectionLabel` component), the way `TOOLTIP_SURFACE` and `MENU_SURFACE` are done.

### B-23 · MED · duplication
- **Where:** `groups/group-cover-grid/GroupCoverGrid.tsx:31,49-61`, `groups/group-game-grid/GroupGameGrid.tsx:41,67-79`. Also `MainPagePinnedGames`, `MainPagePinnedSectionSortable` and `PerfectGamesOrderModal` (outside the area).
- **What:** The same dnd-kit wrapper is written five times: sensors with keyboard coordinates, `handleDragEnd` → `onReorder(Number(active.id), Number(over.id))`, and `DndContext` + `SortableContext` around a list that renders bare when not draggable.
- **Fix:** One `sortable-list/SortableList.tsx({ ids, strategy, enabled, onReorder, children })`.

### B-24 · MED · dead
- **Where:**
  - `groups/group-card/GroupCard.tsx`, `group-cover-mosaic/GroupCoverMosaic.tsx` (default export), `group-platform-logos/GroupPlatformLogos.tsx:8` (`platformCounts`)
  - `user-description-field/UserDescriptionField.tsx:10`
  - `public-user-duel-row/PublicUserDuelRow.tsx:12`
- **What:**
  - The groups list now uses `GroupAlbumCard`. `GroupCard` survives only for `PublicUserAbout:116`, and the mosaic and `platformCounts` exist only for `GroupCard`. That is two different cards for "a group".
  - `DESCRIPTION_MAX` is exported but used only in its own file, and duplicates the server's `280` in `app/api/updateUserProfile/route.ts:15` (one limit in two places, unlike groups, which share `utils/groupValidation`).
  - `PublicUserDuelRow`'s default `format = (n) => n.toLocaleString()` never runs (its one caller always passes `format`), and it has no locale anyway.
- **Fix:**
  - Ask the owner whether public profiles may show `GroupAlbumCard`. If yes, delete `GroupCard`, the mosaic's default export and `platformCounts` (~120 lines). It is a visible change, so it is the user's call.
  - Move the description limit to a shared util used by both sides.
  - Make `format` required.

### B-25 · LOW · rule
- **Where:**
  - Locale: `PublicUserPlatforms.tsx:59,63,67` (`toLocaleString()` with no `lang`); `GroupToolbar.tsx:111` (`` `${d.slice(0, 2)}'s` ``, an English-only decade label)
  - English text: `StreakCompletionCard.tsx:56` ("HC")
  - Images and colours: `StreakCompletionCard.tsx:28` (`alt={award.Title}` beside the visible title, so the name is read twice); `StreakCompletionCard.tsx:38-39` (`text-black`/`text-white` on a themed badge)
  - Dash: `ProfileField.tsx:37,74` (`'—'` as a fallback value on screen)
- **What:**
  - Numbers are not in the reader's language (CLAUDE.md → numbers).
  - The decade label and "HC" are hard-coded English text.
  - The award image's alt text repeats the visible title, and the badge uses fixed black and white instead of theme colours.
- **Fix:** Pass `lang`. Put the decade and "HC" labels in `T`. Use `alt=""`. Use theme ink tokens.

### B-26 · LOW · comments
- **Where:**
  - Repeated comments (gone once B-01 is fixed): "Same destination as the title link, so it is kept out of the tab order." ×5 (four sortable items and `GroupCoverTile:46`); "Kept when there is nothing to show, so every card is the same height." ×4; "The expand control: a real button, its hit area stretched over the whole header." ×4
  - Over-long: `FollowingPage.tsx:15-24` (a 10-line doc that walks through the card's contents and a stale "Beside the title, where the rankings will open from"); `EmailVerificationNotice.tsx:7-15` (a paragraph restating the CLAUDE.md policy; one line plus "see CLAUDE.md → Email verification" is enough); `UserPlatformCard.tsx:15-24`
  - Labels: `UserPageSkeleton.tsx:24,47,57,70` (`{/* Delete account */}`, `{/* Identity: … */}`, which only label the block that follows)
  - Signature echoes: `SteamSortableItem.tsx:21-29`, `PsnSortableItem.tsx:22-29`, `XboxSortableItem.tsx:23-30` ("X's counterpart: drag handle, icon, title…", a list of the JSX)
- **What:** Comments that repeat each other, run too long, label the obvious or list what the JSX already shows.
- **Fix:** Keep the one fact each holds (for example "Progress comes live from the shared library; the stored counts are the fallback") and cut the rest.

### B-27 · LOW · duplication
- **Where:**
  - pct: `GroupAlbumCard.tsx:20`, `GroupDetailHero.tsx:42`, `GroupProgressBar.tsx:9`, `GroupShelfRow.tsx:69`, `GroupCoverTile.tsx:34`
  - Privacy icon and label: `GroupAlbumCard:21,56`, `GroupCard:18,30`, `GroupShelfRow:23,43`, `GroupDetailHero:41,89`, `GroupModalPreview:31,52`
  - Rows: `PublicUserGameRow.tsx:11-26` and `PublicUserSharedGameRow.tsx:17-39`
- **What:**
  - `Math.min(100, Math.round(a / b * 100))` with its `> 0` guard is written five times.
  - The privacy icon and its label are chosen five times.
  - The two public game rows share the same link and icon shell.
- **Fix:** Add `pctOf(earned, total)` to `utils/groupItems` and a `GroupPrivacy` mini-component. The shared row shell is optional.

### B-28 · LOW · abstraction
- **Where:** `GroupToolbar.tsx:101-126`, `GroupViewToggle.tsx:24-32`, `UserPlatforms.tsx:45-46,62-63`
- **What:**
  - `GroupToolbar` wraps a single `Select` in a fragment and `GroupViewToggle` in a bare `<div>`.
  - `GroupViewToggle` is a pass-through to `SegmentedControl` that adds one label and `compact: !!o.icon`; the file is mostly a home for the view types.
  - `UserPlatforms` has stray double blank lines.
- **Fix:** Drop the wrappers. Keep the view types but call `SegmentedControl` directly, or keep the toggle, at the owner's taste.

## Cross-area notes
- **Platform hex colours** (`#66c0f4`, `#0070d1`, `#107c10`): 114 copies in 56 files. `PlatformLogo` and `PLATFORM_FILL` (`vault-platform-split`) already exist. Every auditor should check their area (B-07).
- **User avatars with presence**: drawn by hand in main-page friends, search, user-game-page banner, welcome and admin too (19 files import `IconUser`). One `UserAvatar` would serve them all (B-08).
- **The 22 px tag** (B-11) is also in `library-platform-badge`. **The kicker** (B-22) has 43 copies. **Literal `SURFACE`** strings are probably throughout main-page (B-19).
- **`MainPageProfileTabs` versus `ui/Tabs`** (B-20): two tab components. **dnd-kit wrapper** ×5 (B-23).
- **`PinGameModal`** has the same game picker as B-02.
- **`main-page-portada-side-level`** builds the same `toLevel` sentence (B-10).
- **`ConnectAccounts`** copies the RA card (B-06), and its comment "the name is typed right here" is stale for Steam, which now links through Steam.
- **`ui/SectionFallback`'s retry button** is itself hand-drawn rather than `Button` (ui auditor).
- **Modal usage**: other modals may also wrap `Modal` in their own portal, `AnimatePresence` and Escape handler (B-03). Grep `createPortal(` near `<Modal`.
- **Test files**: `groups/add-game-modal/AddGameModal.test.tsx` (163 lines) and `group-modal-game-picker/GroupModalGamePicker.test.tsx` (88) test the same picker behaviour twice, which follows from B-02. The four sortable-item tests will shrink with B-01. Otherwise proportionate.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/components/following-page/FollowingPage.tsx` | 74 | B-26 |
| `src/components/following-page/following-card/FollowingCard.tsx` | 108 | B-08, B-19, B-22 |
| `src/components/following-page/following-card-badges/FollowingCardBadges.tsx` | 72 | ok |
| `src/components/following-page/following-card-banner/FollowingCardBanner.tsx` | 60 | ok |
| `src/components/following-page/following-card-platforms/FollowingCardPlatforms.tsx` | 37 | B-07 |
| `src/components/following-page/following-hero/FollowingHero.tsx` | 94 | B-08, B-18 |
| `src/components/following-page/following-list/FollowingList.tsx` | 99 | B-12 |
| `src/components/following-page/following-page-skeleton/FollowingPageSkeleton.tsx` | 76 | B-19 |
| `src/components/following-page/following-rankings-teaser/FollowingRankingsTeaser.tsx` | 82 | B-08, B-11, B-16, B-18 |
| `src/components/following-page/following-tabs/FollowingTabs.tsx` | 33 | ok |
| `src/components/following-page/following-toolbar/FollowingToolbar.tsx` | 74 | B-14 |
| `src/components/groups/GroupModal.tsx` | 216 | B-03, B-04, B-22 |
| `src/components/groups/add-game-modal-platforms/AddGameModalPlatforms.tsx` | 36 | B-14 |
| `src/components/groups/add-game-modal/AddGameModal.tsx` | 278 | B-02, B-03, B-12, B-14 |
| `src/components/groups/delete-confirm-dialog/DeleteConfirmDialog.tsx` | 41 | B-03 |
| `src/components/groups/group-album-card/GroupAlbumCard.tsx` | 93 | B-04, B-11, B-27 |
| `src/components/groups/group-card/GroupCard.tsx` | 54 | B-24, B-27 |
| `src/components/groups/group-cover-grid/GroupCoverGrid.tsx` | 62 | B-23 |
| `src/components/groups/group-cover-mosaic/GroupCoverMosaic.tsx` | 61 | B-04, B-24 |
| `src/components/groups/group-cover-tile/GroupCoverTile.tsx` | 93 | B-26, B-27 |
| `src/components/groups/group-detail-hero/GroupDetailHero.tsx` | 131 | B-04, B-11, B-27 |
| `src/components/groups/group-detail-skeleton/GroupDetailSkeleton.tsx` | 25 | ok |
| `src/components/groups/group-game-grid/GroupGameGrid.tsx` | 80 | B-23 |
| `src/components/groups/group-icon-display/GroupIconDisplay.tsx` | 23 | B-04 |
| `src/components/groups/group-icon/GroupIcon.tsx` | 30 | B-04 |
| `src/components/groups/group-list-skeleton/GroupListSkeleton.tsx` | 24 | ok |
| `src/components/groups/group-list/GroupList.tsx` | 37 | ok |
| `src/components/groups/group-modal-game-picker/GroupModalGamePicker.tsx` | 135 | B-02, B-14, B-22 |
| `src/components/groups/group-modal-icon-picker/GroupModalIconPicker.tsx` | 82 | B-14, B-22 |
| `src/components/groups/group-modal-preview/GroupModalPreview.tsx` | 58 | B-04, B-27 |
| `src/components/groups/group-modal-visibility/GroupModalVisibility.tsx` | 14 | ok |
| `src/components/groups/group-new-tile/GroupNewTile.tsx` | 20 | ok |
| `src/components/groups/group-platform-logos/GroupPlatformLogos.tsx` | 32 | B-07, B-24 |
| `src/components/groups/group-progress-bar/GroupProgressBar.tsx` | 17 | B-27 |
| `src/components/groups/group-shelf-row/GroupShelfRow.tsx` | 102 | B-04, B-27 |
| `src/components/groups/group-toolbar/GroupToolbar.tsx` | 129 | B-25, B-28 |
| `src/components/groups/group-view-toggle/GroupViewToggle.tsx` | 33 | B-28 |
| `src/components/groups/psn-sortable-item/PsnSortableItem.tsx` | 168 | B-01, B-07, B-26 |
| `src/components/groups/sortable-item/SortableItem.tsx` | 196 | B-01, B-26 |
| `src/components/groups/steam-sortable-item/SteamSortableItem.tsx` | 184 | B-01, B-07, B-26 |
| `src/components/groups/xbox-sortable-item/XboxSortableItem.tsx` | 164 | B-01, B-26 |
| `src/components/public-user-page/PublicUserPage.tsx` | 65 | ok |
| `src/components/public-user-page/public-user-about/PublicUserAbout.tsx` | 124 | B-07, B-22, B-24 |
| `src/components/public-user-page/public-user-achievement-showcase/PublicUserAchievementShowcase.tsx` | 54 | ok |
| `src/components/public-user-page/public-user-activity/PublicUserActivity.tsx` | 44 | B-20 |
| `src/components/public-user-page/public-user-body/PublicUserBody.tsx` | 58 | B-20 |
| `src/components/public-user-page/public-user-compare/PublicUserCompare.tsx` | 165 | B-08, B-22 |
| `src/components/public-user-page/public-user-duel-row/PublicUserDuelRow.tsx` | 48 | B-24 |
| `src/components/public-user-page/public-user-error/PublicUserError.tsx` | 22 | B-12 |
| `src/components/public-user-page/public-user-follow-button/PublicUserFollowButton.tsx` | 27 | B-12 |
| `src/components/public-user-page/public-user-game-row/PublicUserGameRow.tsx` | 28 | B-27 |
| `src/components/public-user-page/public-user-games/PublicUserGames.tsx` | 140 | B-12, B-14 |
| `src/components/public-user-page/public-user-hero/PublicUserHero.tsx` | 110 | B-08, B-12 |
| `src/components/public-user-page/public-user-kpis/PublicUserKpis.tsx` | 64 | B-09 |
| `src/components/public-user-page/public-user-overview/PublicUserOverview.tsx` | 48 | ok |
| `src/components/public-user-page/public-user-platform-chips/PublicUserPlatformChips.tsx` | 69 | B-07 |
| `src/components/public-user-page/public-user-platforms/PublicUserPlatforms.tsx` | 82 | B-07, B-09, B-22, B-25 |
| `src/components/public-user-page/public-user-recent-unlocks/PublicUserRecentUnlocks.tsx` | 37 | B-22 |
| `src/components/public-user-page/public-user-share-button/PublicUserShareButton.tsx` | 31 | B-12 |
| `src/components/public-user-page/public-user-shared-game-row/PublicUserSharedGameRow.tsx` | 41 | B-27 |
| `src/components/public-user-page/public-user-showcase/PublicUserShowcase.tsx` | 46 | ok |
| `src/components/public-user-page/public-user-skeleton/PublicUserSkeleton.tsx` | 47 | ok |
| `src/components/rankings-guide/RankingsGuide.tsx` | 114 | B-10, B-11, B-15, B-18 |
| `src/components/rankings-guide/rankings-guide-block/RankingsGuideBlock.tsx` | 49 | ok |
| `src/components/rankings-guide/rankings-guide-example/RankingsGuideExample.tsx` | 45 | B-10 |
| `src/components/rankings-guide/rankings-guide-table/RankingsGuideTable.tsx` | 39 | B-15 |
| `src/components/rankings-page/RankingsPage.tsx` | 156 | B-11, B-12, B-18 |
| `src/components/rankings-page/rankings-page-delta/RankingsPageDelta.tsx` | 23 | B-11 |
| `src/components/rankings-page/rankings-page-hot/RankingsPageHot.tsx` | 42 | B-10, B-12, B-19 |
| `src/components/rankings-page/rankings-page-join/RankingsPageJoin.tsx` | 26 | B-18 |
| `src/components/rankings-page/rankings-page-level-panel/RankingsPageLevelPanel.tsx` | 134 | B-09, B-10, B-11, B-19 |
| `src/components/rankings-page/rankings-page-list/RankingsPageList.tsx` | 58 | B-10 |
| `src/components/rankings-page/rankings-page-me-bar/RankingsPageMeBar.tsx` | 67 | B-10 |
| `src/components/rankings-page/rankings-page-podium/RankingsPagePodium.tsx` | 79 | B-10, B-16 |
| `src/components/rankings-page/rankings-page-skeleton/RankingsPageSkeleton.tsx` | 56 | ok |
| `src/components/rankings-page/rankings-page-skeleton/RankingsRouteSkeleton.tsx` | 54 | B-11, B-18, B-21 |
| `src/components/rankings-page/rankings-page-streak/RankingsPageStreak.tsx` | 34 | ok |
| `src/components/rankings-page/rankings-page-table/RankingsPageTable.tsx` | 103 | B-10, B-15, B-19 |
| `src/components/rankings-page/rankings-page-toolbar/RankingsPageToolbar.tsx` | 77 | B-14 |
| `src/components/rankings-page/rankings-page-user/RankingsPageUser.tsx` | 80 | B-08 |
| `src/components/rankings-page/rankings-page-zone/RankingsPageZone.tsx` | 86 | B-12 |
| `src/components/streak-page/StreakPage.tsx` | 74 | B-17 |
| `src/components/streak-page/streak-chart/StreakChart.tsx` | 83 | B-19 |
| `src/components/streak-page/streak-completion-card/StreakCompletionCard.tsx` | 61 | B-25 |
| `src/components/streak-page/streak-day-row/StreakDayRow.tsx` | 107 | ok |
| `src/components/streak-page/streak-day-strip/StreakDayStrip.tsx` | 81 | ok |
| `src/components/streak-page/streak-list/StreakList.tsx` | 79 | B-19 |
| `src/components/streak-page/streak-page-skeleton/StreakPageSkeleton.tsx` | 60 | B-19 |
| `src/components/streak-page/streak-quick-stats/StreakQuickStats.tsx` | 47 | B-09 |
| `src/components/streak-page/streak-section-head/StreakSectionHead.tsx` | 11 | ok |
| `src/components/streak-page/streak-stats-banner/StreakStatsBanner.tsx` | 77 | ok |
| `src/components/streak-page/streak-weekdays/StreakWeekdays.tsx` | 43 | B-19 |
| `src/components/streak-page/streak-year-heatmap/StreakYearHeatmap.tsx` | 120 | B-17, B-19 |
| `src/components/user-page/delete-account-card/DeleteAccountCard.tsx` | 31 | ok |
| `src/components/user-page/email-verification-notice/EmailVerificationNotice.tsx` | 55 | B-13, B-26 |
| `src/components/user-page/profile-field/ProfileField.tsx` | 93 | B-25 |
| `src/components/user-page/user-consoles-preference/UserConsolesPreference.tsx` | 61 | B-21 |
| `src/components/user-page/user-description-field/UserDescriptionField.tsx` | 58 | B-24 |
| `src/components/user-page/user-follow-stats/UserFollowStats.tsx` | 30 | ok |
| `src/components/user-page/user-font-preference/UserFontPreference.tsx` | 27 | ok |
| `src/components/user-page/user-font-preference/user-font-preference-preview/UserFontPreferencePreview.tsx` | 14 | ok |
| `src/components/user-page/user-game-card-preference/UserGameCardPreference.tsx` | 24 | ok |
| `src/components/user-page/user-game-card-preference/user-game-card-preference-preview/UserGameCardPreferencePreview.tsx` | 22 | ok (fixed radius allowed by the guard) |
| `src/components/user-page/user-home-layout-preference/UserHomeLayoutPreference.tsx` | 29 | ok |
| `src/components/user-page/user-home-layout-preference/user-home-layout-preference-preview/UserHomeLayoutPreferencePreview.tsx` | 37 | ok (fixed radius allowed by the guard) |
| `src/components/user-page/user-identity-card/UserIdentityCard.tsx` | 241 | B-08, B-11, B-12, B-13, B-19 |
| `src/components/user-page/user-page-skeleton/UserPageSkeleton.tsx` | 87 | B-19, B-26 |
| `src/components/user-page/user-platform-card/UserPlatformCard.tsx` | 129 | B-06, B-09, B-26 |
| `src/components/user-page/user-platforms/UserPlatforms.tsx` | 126 | B-05, B-06, B-28; rule: `RaLoginModal` imported statically (must be `next/dynamic` + `LazyWhenOpened`) |
| `src/components/user-page/user-preferences-card/UserPreferencesCard.tsx` | 166 | B-07, B-19, B-20 |
| `src/components/user-page/user-preferences-general/UserPreferencesGeneral.tsx` | 126 | ok |
| `src/components/user-page/user-preferences-platform/UserPreferencesPlatform.tsx` | 54 | ok |
| `src/components/user-page/user-profile-banner/UserProfileBanner.tsx` | 44 | B-18 |
| `src/components/user-page/user-profile-switch/UserProfileSwitch.tsx` | 55 | B-21 |
| `src/components/user-page/user-psn-card/UserPsnCard.tsx` | 105 | B-05, B-06, B-07 |
| `src/components/user-page/user-psn-card/user-psn-card-form/UserPsnCardForm.tsx` | 63 | B-06 |
| `src/components/user-page/user-psn-preferences/UserPsnPreferences.tsx` | 39 | ok |
| `src/components/user-page/user-psn-preferences/psn-preference-switch/PsnPreferenceSwitch.tsx` | 38 | B-21 |
| `src/components/user-page/user-ra-preferences/UserRaPreferences.tsx` | 10 | ok |
| `src/components/user-page/user-shape-preference/UserShapePreference.tsx` | 25 | ok |
| `src/components/user-page/user-shape-preference/user-shape-preference-preview/UserShapePreferencePreview.tsx` | 27 | ok |
| `src/components/user-page/user-steam-card/UserSteamCard.tsx` | 82 | B-05, B-06, B-07 |
| `src/components/user-page/user-steam-card/user-steam-card-link/UserSteamCardLink.tsx` | 21 | B-06 (`<Button href>`) |
| `src/components/user-page/user-vault-level/UserVaultLevel.tsx` | 67 | B-10 |
| `src/components/user-page/user-vault-level/user-vault-level-skeleton/UserVaultLevelSkeleton.tsx` | 15 | ok |
| `src/components/user-page/user-vault-stat/UserVaultStat.tsx` | 42 | B-09 |
| `src/components/user-page/user-xbox-card/UserXboxCard.tsx` | 104 | B-05, B-06, B-07 |
| `src/components/user-page/user-xbox-card/user-xbox-card-form/UserXboxCardForm.tsx` | 62 | B-06 |
| `src/components/user-page/user-xbox-preferences/UserXboxPreferences.tsx` | 36 | B-21 |
