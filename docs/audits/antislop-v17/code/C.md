# C — Component library, design catalogue, welcome, header, search, layout and theme modals
Auditor notes: the library itself (`src/components/ui`) is small, well named and mostly reads tokens; its pieces are
the right size. The problem is around it: the library is **under-used** (IconButton, Field, Pill, SURFACE, Button are
each re-drawn by hand in many places, including inside `ui/` itself), a few patterns that repeat 10–100 times have no
piece at all (kicker, icon tile, tag, avatar, list row), and the two command-style overlays (search, phone menu) bypass
`Modal` and lose its focus handling. The welcome flow is clean per file but copies the same step boilerplate 6–8 times.

## Findings

### C-01 · HIGH · library
- **Where:** `src/components/search-modal/SearchModal.tsx:27-37,70-83,151-169`, `src/components/main-header/MobileNavModal.tsx:26-41,62-69,86-112`, guard allowlist `src/components/ui/uiGuard.test.ts:67-73`
- **What:** Both overlays are hand-made dialogs. `overlayVariants`/`contentVariants` are copied verbatim (only `exit.y` differs), each has its own Escape listener, neither traps focus nor returns it on close (what `Modal` does), and `MobileNavModal` has no `role="dialog"`/`aria-modal` at all. Its nav items are `<button onClick={router.push}>` instead of links, and it carries hard-coded "Menú"/"Close menu". The guard exempts both ("the phone menu drawer", "the search panel (PR 2 rebuilds it)") — the second note is stale: the panel was rebuilt and still bypasses `Modal`.
- **Fix:** give `Modal` a top-anchored placement (e.g. `placement="top"`, panel at ~12 % from the top, `rounded-sheet`, no head) and render both inside it; phone menu items become `<Link>` (`/authPage` when signed out, as today). Drop both allowlist entries.
- **Size:** MobileNavModal 191 → ~90; SearchModal 261 → ~215.

### C-02 · HIGH · duplication
- **Where:** prop type `{ onNext; onSkip; onBack; direction; focusTitle }` in `WelcomePageRa.tsx:22-34`, `WelcomePageSteam.tsx:17-29`, `WelcomePagePsn.tsx:18-30`, `WelcomePageProfile.tsx:30-42`, `WelcomePagePreferences.tsx:26-38`, `WelcomePagePrivacy.tsx:17-29` (+ `WelcomePageDone.tsx:21-35` without onSkip). "Next →" primary button (button + `IconArrowRight`) in RA:62-65, Steam:58-61, PSN:59-62, Profile:62-65, Preferences:117-120, Privacy:51-54, PreferencesDetail:99-102; "Not now"/"Skip this step" secondary in RA, Steam, PSN, Profile, Preferences, Privacy.
- **What:** every step re-declares the same nav props and the same two action buttons (~12 lines × 6).
- **Fix:** export `type WelcomeStepNav` from `useWelcomeSteps.ts` (`WelcomePage.tsx:57` already builds that object as `nav`); let `WelcomePageStep` take `onNext`/`onSkip`/`skipLabel` and draw the standard actions itself, with `actions` kept only for the RA/PSN submit and Steam link.
- **Size:** ~90 lines across 7 files → ~20.

### C-03 · HIGH · library
- **Where:** `src/components/welcome-page/welcomeArt.ts:29-37` (`PRIMARY_BUTTON`, `SECONDARY_BUTTON`, `QUIET_BUTTON`, `ICON_BUTTON`), used on raw `<button>` in 13 welcome files (~30 call sites); `WelcomePageDone.tsx:98` overrides it with `text-accent!`.
- **What:** constants wrapping `buttonClass()` so raw buttons can wear the library's look — CLAUDE.md reserves `buttonClass` for "the rare place that cannot render Button itself". `ICON_BUTTON` is a third icon-button look (`rounded-tile` + ring) beside `IconButton` and the header's. The `!` override fights the variant system for colour.
- **Fix:** `<Button variant="primary" size="lg">` etc. everywhere; keep `buttonClass('primary','lg')` only on the Steam `<a href={linkHref}>` (`WelcomePageSteam.tsx:64`, a full navigation to an API route, not a `next/link`). Arrows become `IconButton size="lg"` (add a `ring`/outline tone if the ring look must stay). For the Done row action use `variant="quiet"` and accept its colour, or add an `accent` tone to Button. Delete the four constants.
- **Size:** welcomeArt.ts 39 → ~25.

### C-04 · HIGH · library
- **Where:** in this area: `welcomeArt.ts:39` (`SECTION_LABEL`) is re-typed by hand in `WelcomePageLibraryPreview.tsx:20`, `WelcomePageProfilePreview.tsx:26`, `WelcomePageRaGuide.tsx:22`, accent versions in `WelcomePageStep.tsx:86`, `WelcomePageIntroDetail.tsx:72`, `WelcomePagePreferencesDetail.tsx:76`; `StatPill.tsx:51`; `SectionFallback.tsx:24`; `SearchModalGroup.tsx:8`; `ThemeModalGroups.tsx:26`; `LayoutModalPreview.tsx:50`; `LayoutModalPreviewCoverHero.tsx:17`; `LayoutModalPreviewSampleProfile.tsx:15`; `DesignCatalog.tsx:37`, `DesignCatalogPiece.tsx:29,39,83`, `DesignCatalogSidebar.tsx:35`, `DesignCatalogData.tsx:88-89`, `DesignCatalogFoundations.tsx:56`. Site-wide: 116 lines in 95 files match `uppercase … tracking`.
- **What:** the "kicker" (small uppercase tracked label) is the most repeated hand-made pattern in the repo, in at least six spellings (`text-[10px] tracking-widest`, `0.6875rem tracking-[0.1/0.12/0.14/0.16em]`, `text-xs tracking-wider`…). The catalogue even documents it under Typography ("Kicker, uppercase, tracked") without a piece.
- **Fix:** `ui/Kicker.tsx` (or `kickerClass(tone: 'muted' | 'accent', size)`), one tracking value; replace in the files above first, then site-wide. Delete `SECTION_LABEL`.

### C-05 · HIGH · library
- **Where:** `rounded-card bg-bg-card ring-1 ring-ink/[0.06]` written by hand in 38 files instead of `SURFACE`; in this area: `WelcomePageIntroPerk.tsx:41`, `WelcomePageIntroArt.tsx:17` (`CARD`), `WelcomePageLibraryPreview.tsx:25`, `WelcomePagePlatformLinked.tsx:29`, `WelcomePageProfilePreview.tsx:27`, `WelcomePagePrivacy.tsx:61`, `WelcomePagePrivacySample.tsx:7` (`CARD`), `WelcomePageDone.tsx:78`, `WelcomePageRaGuide.tsx:20`, `DesignCatalogSkeleton.tsx:11`, and inside the library `GameCardSkeleton.tsx:6` (ring `/5`). Others: `following-card`, `rankings-page-*`, `streak-page/*`, `user-page/*`, three game pages under `app/(main)`.
- **What:** `SURFACE` exists precisely for this and has 19 importers; twice as many files spell it out, with drifting ring opacities (/5, /[0.06], /[0.08]).
- **Fix:** `${SURFACE}` everywhere (layout classes stay with the caller). Two `CARD` constants in welcome disappear.

### C-06 · HIGH · library / token
- **Where:** `MainHeader.tsx:130-145,172-178,202-208` (four copies of the same `inline-flex … w-9 h-9 rounded-icon … hover:bg-ink/[0.08]` string), `Modal.tsx:146-153` (its own close button = IconButton md), `WelcomePageIntroDetail.tsx:50-57`, `WelcomePagePreferencesDetail.tsx:54-61`, `WelcomePageStepsBar.tsx:96-104`, `MobileNavModal.tsx:105-111`, `PasswordInput.tsx:41-50`; `IconButton.tsx:29`.
- **What:** `IconButton` has 4 real users; at least 13 files draw their own. And the piece disagrees with the token table: `docs/design-system.md` assigns icon buttons `rounded-icon` (9 px slanted), the header uses it, but `IconButton` uses `rounded-button` (12 px) — two radii for the same control in the slanted design.
- **Fix:** `IconButton` → `rounded-icon`; give it `href` (as `Button` has) so the header's home link fits; replace the copies above (Modal's close included, it is inside the library).
- **Size:** MainHeader −~15 lines; each detail view −6.

### C-07 · MED · duplication
- **Where:** `WelcomePageIntroDetail.tsx:41-62,66-75,107-117` and `WelcomePagePreferencesDetail.tsx:45-66,71-83,91-104`
- **What:** the two "opened" views share the whole shell: `motion.section` with `layoutId` and the same spring (`stiffness: 260, damping: 32`, also in `WelcomePageIntroPerk.tsx:40`), Escape to close, the corner ✕, the focus-the-title effect, numbered accent tile + "n of total" kicker + display title, prev/next arrows and a primary button.
- **Fix:** `welcome-page-detail-frame/WelcomePageDetailFrame.tsx` taking `index/total/title/kicker/onClose/onGo/primary` and children; the spring as one exported constant.
- **Size:** 130 + 108 → ~60 + ~45 + ~65 frame.

### C-08 · MED · rule (i18n)
- **Where:** `MainHeader.tsx:132` "Home", `:141` "Go back", `:150` "Main navigation", `:174` "Menu", `:187,204` "Search games"; `MobileNavModal.tsx:104` "Menú", `:107` "Close menu"; `SearchModal.tsx:220` `Game ID ${id}`.
- **What:** user-facing (screen-reader and visible) strings outside `T`, one of them Spanish in an English-default app.
- **Fix:** `T.header.*` keys in all nine languages.

### C-09 · MED · duplication
- **Where:** `MainHeader.tsx:31` (`NavLink`), `StatusNavDropdown.tsx:30`, `ui/Tabs.tsx:16-21` (`tabClass`), `ui/Tabs.tsx:71,86,92-95`
- **What:** the slanted underline (`after:… h-[3px]/h-1 bg-accent rounded-(--bar-radius) skew-x-(--slant-line) origin-left …`) is spelled out three times with small drifts, and `Tabs` draws it a fourth way (a `<span>` instead of `after:`, `h-11` vs `h-10`). `Tabs` also re-types `TAB_ROW` inline (`:71`) instead of using its own constant.
- **Fix:** `Tabs` renders with `tabClass` + `TAB_ROW`; the header's link and status button use `tabClass` (or a `navLinkClass` exported from the same file).
- **Size:** ~15 lines.

### C-10 · MED · library
- **Where:** `WelcomePageRa.tsx:79-111`, `WelcomePagePsn.tsx:76-96`; `Field` real users: only `admin-unlock-totp/AdminUnlockTotp.tsx` (21 files use `htmlFor` by hand).
- **What:** label + `fieldClass` input + error `role="alert"` + help, with ids and `aria-describedby` wired by hand — exactly what `Field` + `Input` do.
- **Fix:** `<Field label hint={keyNote} error={error}>{(c) => <Input {...c} … />}</Field>`.
- **Size:** RA form 33 → ~16, PSN 21 → ~10.

### C-11 · MED · library
- **Where:** `pillClass` on a raw `<button aria-pressed>` in `following-toolbar/FollowingToolbar.tsx:64`, `rankings-page-toolbar/RankingsPageToolbar.tsx:52`, `completed-filter/CompletedFilter.tsx:31`, `console-filter/ConsoleFilter.tsx:50`, `groups/add-game-modal-platforms/AddGameModalPlatforms.tsx:28`, `browse-search-chips/BrowseSearchChips.tsx:15`, `psn-trophy-group-tabs/PsnTrophyGroupTabs.tsx:85`; identity wrapper `const chipClass = (on) => pillClass(on)` in `game-compare-table/GameCompareTable.tsx:17`, `main-page-friends-leaderboard/MainPageFriendsLeaderboard.tsx:14`, `public-user-games/PublicUserGames.tsx:21`.
- **What:** `Pill` (the component) has one real caller (`LibraryQuickFilters`); everywhere else rebuilds it from the class and wires `aria-pressed` by hand.
- **Fix:** `<Pill pressed onClick>`; delete the three `chipClass` wrappers. `pillClass` stays for links/labels as documented.

### C-12 · MED · dead
- **Where:** `RarityBadge.tsx:4` `rarityTone` exported (only its test imports it); `FadeImage.tsx:21` `placeholderClassName` (0 callers); `Notice.tsx:26-29` `title` / `action` (catalogue only); `StreakTag.tsx:13` `size="lg"` (catalogue only); `Tabs.tsx:53` `size` (no caller passes it); `IconButton.tsx:6` `tone: 'accent'` (catalogue only); `Skeleton.tsx:4,6` `line` and `tag` map to the same class; `LayoutModalPreviewSampleGameCard.tsx:30` passes `height="h-1.5"` (the default).
- **What:** flexibility nobody uses; each one is a branch to read and test.
- **Fix:** un-export `rarityTone`; drop `placeholderClassName`, `Tabs.size`, the `accent` tone, the redundant prop; merge `line`/`tag` (keep one name). `Notice.title/action` and `StreakTag lg` are cheap and plausible for planned pages: keep them only if the library plan wants them, else drop.

### C-13 · MED · rule (bug in waiting)
- **Where:** `WelcomePageStepsBar.tsx:113` (`grid grid-cols-8`), doc comment `:24` ("eight segments")
- **What:** the phone progress grid hard-codes 8 columns while `WELCOME_STEPS.length` grows with every platform (CLAUDE.md: each new platform adds its step, Xbox included). A ninth step wraps onto a second row.
- **Fix:** `style={{ gridTemplateColumns: \`repeat(${WELCOME_STEPS.length}, minmax(0, 1fr))\` }}` or `flex` with `flex-1` segments; reword the comment.

### C-14 · MED · duplication
- **Where:** `GENDER_KEYS` in `WelcomePageProfile.tsx:21`, `WelcomePageProfilePreview.tsx:9`, `public-user-page/public-user-about/PublicUserAbout.tsx:21`, `user-page/user-preferences-general/UserPreferencesGeneral.tsx:16`
- **What:** the same map and `T.userData[GENDER_KEYS[g]]` lookup, four times.
- **Fix:** `genderLabel(T, gender)` in `src/utils/utils.tsx`.

### C-15 · MED · duplication
- **Where:** `MainHeader.tsx:104-113` and `MobileNavModal.tsx:47-56`
- **What:** the status and nav item lists (hrefs + labels) are defined twice; adding a section means editing both.
- **Fix:** one `NAV_STATUS` / `NAV_MAIN` list (hrefs, label keys, icons) beside the header; both read it.

### C-16 · MED · token
- **Where:** motion: `Accordion.tsx:39,43,60` (`duration-300`) and `:35` (0.35 s), `ProgressBar.tsx:57,64` (`duration-500`), `CircularProgress.tsx:64` (`duration-700`), `FadeImage.tsx:53` (`duration-300`), `Modal.tsx:117,142` (0.2/0.22 s); sunken field shadow: `Input.tsx:22` (0.22), `Switch.tsx:29` (0.25), `Checkbox.tsx:26` (1px 2px 0.25), `MainHeader.tsx:188` (0.22); finished glow `drop-shadow(0 0 6px rgb(var(--progress)/0.6))`: `ProgressBar.tsx:51`, `CircularProgress.tsx:46`; hairline `shadow-[inset_0_±1px_0_rgb(var(--ink)/0.08–0.1)]`: `Tabs.tsx:25,71`, `dataTable.ts:10`, `Modal.tsx:176`, `SearchModal.tsx:171,252`, `DesignCatalogPiece.tsx:26`; radius: `Checkbox.tsx:26` `rounded-[5px]`.
- **What:** the library reads tokens for colour, slant and radius but hard-codes durations, the sunken shadow, the done-glow and the hairline, each with drifting values. A future design (CLAUDE.md: "a future site-wide design changes tokens, not components") cannot reach them.
- **Fix:** add `--shadow-sunken`, `--glow-done`, `--hairline` (and use `--motion-open`/`--motion-indicator` for the durations) in `globals.css`; the checkbox takes `rounded-badge` or a `--r-check`.

### C-17 · MED · library (catalogue drift)
- **Where:** `design-catalog/catalogue.ts`, `DesignCatalogControls.tsx:138-154`, `DesignCatalogPiece.tsx:78-96`
- **What:** `docs/design-system.md` says every `ui/` piece has a specimen, but `ChartCard`, `SectionFallback`, `FadeImage`, `GameListRow`, `dataTable` (`TABLE`/`TH`/`badgeClass`/`TYPE_TAG`), `GameCardSkeleton`, `SkeletonRow`/`SkeletonGameList` and `CountUp` (only inside Entrances) have none; the test only checks catalogue → card, not `ui/` → catalogue. Entry text is stale: Modal sizes omit `2xl`, backdrop omits `dim`, Skeleton radii omit `none`. Fields and Select are drawn once in `Panel` though `rounded-field` becomes a pill in the round design (should be `Compare`). `Compare` and `Panel` repeat the same class string.
- **Fix:** add the missing entries/specimens; make the test also walk `src/components/ui/*.tsx` exports; Fields/Select into `Compare`; `Compare` renders `Panel`.

### C-18 · LOW · duplication
- **Where:** `ThemeModal.tsx:28-36,50-54`, `WelcomePagePreferencesThemes.tsx:13-17,21-23`
- **What:** the same pick handler (bounding box → `spreadFrom(centre)`) and the same save-error paragraph.
- **Fix:** `spreadFromElement(el)` in `src/utils/lookTransition.ts`; the error line inside `ThemeModalGroups` (it already receives the theme).

### C-19 · LOW · token
- **Where:** `ToggleButton.tsx:39` (`text-hardcore` for "pinned"); RA gold `#e5b53f` in `WelcomePageIntroArt.tsx:46,140`, `WelcomePageRaGuide.tsx:36,62,66`, `WelcomePage.module.css:81,94-96`, `welcomeArt.ts:13`
- **What:** the generic on/off toggle borrows the RA-hardcore colour as its "on" state; RA's gold hex is retyped in 8 places.
- **Fix:** give ToggleButton `text-warning` or a `--pin` token (or an accent default with a tone prop); one `RA_GOLD` constant beside `STEP_SKY` (platform hues are an allowed exception, but should live once).

### C-20 · LOW · rule (numbers in the reader's language)
- **Where:** `StatPill.tsx:39` (size `sm` prints a numeric `value` raw), `StatPill.tsx:81` (`StatCard` uses `value.toLocaleString()` without `lang`)
- **What:** latent: every current caller passes a pre-formatted string, but the numeric branches exist and would print "8,893" in Spanish.
- **Fix:** `value.toLocaleString(lang)` in both (the hook is already read in `StatPill`; add it to `StatCard`), or type `value` as `string` and drop the branches.

### C-21 · LOW · comments
- **Where:** `MainHeader.tsx:128` "Left: home + back + nav (desktop) / hamburguesa (mobile)", `:148` "Desktop nav - visible on md+", `:170` "Hamburger menu - mobile only", `:182` "Center: search bar - absolute only on lg+, hidden on smaller" (also wrong: nothing is absolute), `:197` "Right: search icon (mobile) + streak + user", `:200` "Search icon - mobile only, to the right"; `MobileNavModal.tsx:102` "Header", `:114` "Nav items"; `SearchModal.tsx:170` "The box"; `ProgressBar.tsx:36-37` two lines saying the same ("The design's slant… / The ends are the design's…") and `:50` "Only a finished bar glows."; `StreakTag.tsx:4` a doc line ("What a streak tag says in words…") stranded above `type Props`, and the component docblock repeats the prop docs.
- **Fix:** delete them; keep `MainHeader.tsx:119-121` (the 64 px reason) and `:243`.

### C-22 · LOW · abstraction
- **Where:** `ProgressBar.tsx:38-39,53,58,68`
- **What:** `BEVEL = 'var(--clip-3)'` + `borderRadius: 'var(--bar-radius)'` re-implements `slantStyle(3)` from `ui/shape.ts`.
- **Fix:** `style={slantStyle(3)}` on the track; `FILL_EDGE` can become a `slantStyle`-like helper or stay as one named constant.

### C-23 · LOW · rule (file order)
- **Where:** `MainHeader.tsx:16-24`
- **What:** `const SearchModal = dynamic(…)` sits between imports; imports continue after it (and `next/image`, `next/link` are mixed below internal hooks).
- **Fix:** imports first, then the two `dynamic` constants.

### C-24 · LOW · library
- **Where:** `ui/SectionFallback.tsx:25-31` (12 importers)
- **What:** a hand-made retry button inside the library (no `type`, not `Button`), a `text-[10px]` kicker and `min-h-[80px]`.
- **Fix:** `<Button variant="secondary" size="sm">` + the kicker piece (C-04).

### C-25 · LOW · token
- **Where:** `ui/ChartCard.tsx:3` (8 importers)
- **What:** a card shell on `rounded-tile` with no ring, while the design-system rule is "every card shell is `rounded-card` on SURFACE"; it also bakes in `enter-card`.
- **Fix:** if it is a card, `${SURFACE} p-4 …`; if it is a tile inside a card, say so in a one-line doc comment. Leave the entrance to callers or document it.

### C-26 · LOW · library
- **Where:** `main-header-level/MainHeaderLevel.tsx:31-38`; `Button.tsx:33-35` (private `Spinner`) vs `components/main-spinner/Spinner.tsx`
- **What:** a third progress ring drawn by hand (20 px, plus an indeterminate spinner) beside `CircularProgress`; two spinner implementations.
- **Fix:** let `CircularProgress` render without label/centre at small sizes (or an `indeterminate` flag); export one `Spinner` from `ui/`.

### C-27 · LOW · rule (a11y)
- **Where:** `ThemeModalOption.tsx:12-18` + `ThemeModalGroups.tsx:23`; `PasswordInput.tsx:41-48`
- **What:** `role="radio"` buttons in a `role="radiogroup"` with no arrow-key roving (ARIA radios promise arrows; `choiceClass`'s note says this group must not choose on arrows, so it should not claim to be radios). The password eye toggle has `tabIndex={-1}` and no focus ring, so keyboard users cannot reveal the password.
- **Fix:** theme tiles as `aria-pressed` buttons in a labelled group; eye toggle as `IconButton size="sm"` without `tabIndex={-1}` (if kept out of the tab order on purpose, say why in one line).

### C-28 · LOW · naming
- **Where:** `Modal.tsx:149` `T.cards.close`; `WelcomePageIntroDetail.tsx:53`, `WelcomePagePreferencesDetail.tsx:57` `T.editProfileModal.close`; `WelcomePagePsn.tsx:45` `T.welcome.ra.linkedAs`
- **What:** strings borrowed from unrelated namespaces; `en.ts` has seven separate `close: 'Close'` keys.
- **Fix:** one `T.common.close`; a neutral `T.welcome.linkedAs`.

### C-29 · LOW · library
- **Where:** `ui/GameListRow.tsx:41,49,53-55,61`
- **What:** bare `rounded` on a painted image (the guard only scans outside `ui/`), a hand-drawn share bar with `rounded-full` instead of `--bar-radius`, `text-[9px]`/`text-[10px]`, no doc comment on an exported piece.
- **Fix:** `rounded-box-sm`, `rounded-(--bar-radius)`, token text sizes, one-line doc.

### C-30 · LOW · rule (entrances)
- **Where:** `welcome-page/WelcomePage.module.css:13,34`
- **What:** `animation: … both` on `.in`/`.card`; CLAUDE.md says "`backwards`, never `both`". `.card` sits on the sticky stage (`WelcomePageStep.tsx:101`). Harmless today (the last keyframe is `transform: none`), but it is the pattern the rule forbids. The welcome keeps its own keyframes by the user's choice; only the fill mode is in question.
- **Fix:** `backwards`.

### C-31 · LOW · library
- **Where:** `SearchModal.tsx:231-246`, `SearchModalUserResults.tsx:44-46`
- **What:** empty and error states drawn by hand while `EmptyState` (39 importers) exists.
- **Fix:** `EmptyState size="compact"` for "no results"; leave the inline error.

## Library gaps

Patterns repeated across `src/components` that should become `ui/` pieces (most-repeated first). Counts from grep on 2026-11-02.

| Piece | What it is | Repeated in |
|---|---|---|
| **`Kicker`** | small uppercase tracked label, muted or accent | 116 lines / 95 files (see C-04): welcome ×7, catalogue ×7, `StatPill`, `SectionFallback`, `SearchModalGroup`, `ThemeModalGroups`, `LayoutModalPreview*` ×3, and most pages |
| **`IconTile`** | a square accent-tinted tile holding an icon or a number (sizes 9/10/14) | `ui/Modal.tsx:159-164`, `WelcomePageIntroPerk.tsx:50`, `WelcomePageIntroDetail.tsx:78`, `WelcomePagePreferencesDetail.tsx:72`, `WelcomePagePrivacySample.tsx:36,48`, `WelcomePageDone.tsx:81-87`, `following-hero/FollowingHero.tsx`, `following-rankings-teaser/FollowingRankingsTeaser.tsx`, `rankings-page-user/RankingsPageUser.tsx` |
| **`Avatar`** | picture, or initial/icon fallback, round, sizes, optional `PresenceDot` slot | `rounded-full object-cover` in 18 files: `MainHeader.tsx:224-239` (with initial fallback), `SearchModalHome.tsx:88` (raw `<img>`), `WelcomePageProfilePreview.tsx:31-37`, `UserSummary`, `FollowingCard`, `FollowingHero`, `PublicUserHero`, `PublicUserCompare`, `MainPageFriendsLeaderboard`, `MainPageFriendsShared`, `UserIdentityCard`, `UserGamePageBanner`, `GameInfoComments`, `AchievementModal`, `RankingsPageUser` (initial fallback), admin ×2; there is no avatar component (only `avatar-modal`) |
| **`Tag`** (tones: neutral, accent, hardcore, success, info, danger) | `inline-flex h-5/h-6 px-2 rounded-tag text-xs font-bold` tinted chip | `ui/RarityBadge.tsx`, `ui/dataTable.ts` `TYPE_TAG`, `SearchModalGameResult.tsx:9-15,55`, `game-hero-chip/GameHeroChip.tsx`, `RaGameItem`, `PsnGameItem`, `SteamGameItem`, `XboxGameItem`, `PsnCollectionItem`, `GameInfoComments` (9 files); `RarityBadge` and `StreakTag` would sit on it |
| **`ListRow`** | media box + title + sub line + trailing slot, as button or link, with the accent hover/focus mark | `SearchModalRow` (+ `SEARCH_ROW` reused by `SearchModalUserResults`), `ui/GameListRow`, `ui/SkeletonList` `SkeletonRow` (its skeleton), `WelcomePageDone.tsx:76-103`, `WelcomePagePrivacySample.tsx:35-56`, `MobileNavModal` items; `SearchModalRow` is the best candidate to promote |
| **`SectionHead`** | title (+ hint) with an action on the right | `ui/Shelf.tsx:17-29` already draws it but only `LibraryShelf` uses Shelf; `SearchModalGroup.tsx`, `WelcomePageRaGuide.tsx:21-32`, `DesignCatalogPiece.tsx:15-21`; extract Shelf's head so a section can use it without the shelf |
| **Top-anchored overlay** | `Modal` placement for command panels/menus | `SearchModal`, `MobileNavModal` (C-01) |
| **`navLinkClass`** | the slanted-underline nav link | `MainHeader` `NavLink`, `StatusNavDropdown`, `tabClass` (C-09) |
| **`Spinner`** | one exported spinner | `Button` (private), `main-spinner/Spinner.tsx`, `MainHeaderLevel`, `MainPageHeatmap`, `MainPageProfileActionsRefresh` (`animate-spin` in 5 files) |
| **Tokens, not pieces** | `--shadow-sunken`, `--glow-done`, `--hairline`, a `FOCUS_RING` class constant | sunken shadow ×4, glow ×2, hairline ×7 (C-16); the focus ring string `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70` is typed 220 times in 162 files — a `@utility focus-ring` in `globals.css` would remove a whole category of drift |
| **Move into `ui/`** | `EmptyState`, `VaultLevelBadge`, `GameCardBackdrop` | already library-grade and in the catalogue, but outside `ui/`; `docs/design-system.md` lists them as "the library … plus" — fine to keep, but the guard and the catalogue test should cover them |

Library pieces whose API is right-sized: `Button`, `Input`/`Field`, `Select`, `Switch`, `Checkbox`, `SegmentedControl`, `ChoiceCards`, `Notice`, `Skeleton`, `ShowMore`, `DropSlot`, `CountUp`, `RememberedHeight`, `menu.ts`, `tooltip.ts`, `shape.ts`. `Modal` is right-sized; it only needs the placement option. `StatPill` (two looks under one component, 85 lines with four branches) could be split into `StatPill` and `StatFigure`, but it is not urgent.

## Cross-area notes
- **Under-use of the library is the main theme, and it is mostly outside area C:** 38 files spell out `SURFACE`, ~13 draw icon buttons, 9 rebuild `Pill`, 21 hand-wire labels instead of `Field`. Whoever audits pages should check each against `ui/`.
- `MainPageProfilePsnStats.tsx:32` passes `accent="text-sky-300"` to `StatCard`: a palette class through a prop. The guard only refuses red/green/yellow/amber/orange, so `sky-*` slips through. `StatPill`/`StatCard` `accent` takes any class, so the "className never colours" rule can be bypassed through it.
- `en.ts` has seven `close: 'Close'` keys (lines 279, 305, 445, 934, 1087, 1519, 1541): the translations auditor should look for a `common` namespace.
- `ShowAllButton` and `ShowRestButton` (outside area) are two thin wrappers over `ShowMore` that differ only in which `T` keys they read; consider one.
- `useSession` is still used for data reads in welcome (`WelcomePage`, `WelcomePageRa/Profile/ProfilePreview/Done/Privacy`), `MobileNavModal` and `SearchModal`. That is allowed (the rule only covers reading `status`), but whoever owns hooks may want `useAuthSession` everywhere for one convention.
- The three `MainPageProfile{Psn,St,Xbox}.tsx` files share one `rounded-3xl … hover:scale-[1.03]` button line and are allowlisted in the guard: probably one component.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/components/ui/Accordion.tsx` | 87 | C-16 |
| `src/components/ui/Button.tsx` | 79 | C-26 |
| `src/components/ui/ChartCard.tsx` | 7 | C-25 |
| `src/components/ui/ChartSkeleton.tsx` | 24 | ok (C-17: no specimen) |
| `src/components/ui/Checkbox.tsx` | 39 | C-16 |
| `src/components/ui/ChoiceCards.tsx` | 70 | ok |
| `src/components/ui/CircularProgress.tsx` | 83 | C-16, C-26 |
| `src/components/ui/CountUp.tsx` | 58 | ok |
| `src/components/ui/DropSlot.tsx` | 25 | ok |
| `src/components/ui/FadeImage.tsx` | 58 | C-12, C-16 |
| `src/components/ui/GameCardSkeleton.tsx` | 16 | C-05 |
| `src/components/ui/GameListRow.tsx` | 66 | C-29 |
| `src/components/ui/GameRowSkeleton.tsx` | 22 | ok |
| `src/components/ui/IconButton.tsx` | 35 | C-06, C-12 |
| `src/components/ui/Input.tsx` | 101 | C-16 |
| `src/components/ui/Modal.tsx` | 184 | C-01, C-06, C-16, C-28 |
| `src/components/ui/Notice.tsx` | 44 | C-12 |
| `src/components/ui/PasswordInput.tsx` | 55 | C-06, C-27 |
| `src/components/ui/Pill.tsx` | 30 | C-11 |
| `src/components/ui/ProgressBar.tsx` | 75 | C-16, C-21, C-22 |
| `src/components/ui/RarityBadge.tsx` | 23 | C-12 |
| `src/components/ui/RememberedHeight.tsx` | 48 | ok |
| `src/components/ui/SearchInput.tsx` | 19 | ok |
| `src/components/ui/SectionFallback.tsx` | 35 | C-04, C-24 |
| `src/components/ui/SegmentedControl.tsx` | 69 | ok |
| `src/components/ui/Select.tsx` | 183 | ok |
| `src/components/ui/Shelf.tsx` | 33 | ok (gap: SectionHead) |
| `src/components/ui/ShowMore.tsx` | 33 | ok |
| `src/components/ui/Skeleton.tsx` | 30 | C-12 |
| `src/components/ui/SkeletonList.tsx` | 37 | ok |
| `src/components/ui/StatPill.tsx` | 85 | C-04, C-20 |
| `src/components/ui/StreakTag.tsx` | 52 | C-12, C-21 |
| `src/components/ui/Switch.tsx` | 41 | C-16 |
| `src/components/ui/Tabs.tsx` | 101 | C-09, C-12, C-16 |
| `src/components/ui/ToggleButton.tsx` | 45 | C-19 |
| `src/components/ui/dataTable.ts` | 41 | C-16 |
| `src/components/ui/menu.ts` | 15 | ok |
| `src/components/ui/shape.ts` | 11 | ok |
| `src/components/ui/surface.ts` | 5 | ok |
| `src/components/ui/tooltip.ts` | 6 | ok |
| `src/components/design-catalog/DesignCatalog.tsx` | 73 | C-04 |
| `src/components/design-catalog/catalogue.ts` | 87 | C-17 |
| `src/components/design-catalog/design-catalog-controls/DesignCatalogControls.tsx` | 161 | C-17 |
| `src/components/design-catalog/design-catalog-data/DesignCatalogData.tsx` | 94 | C-04 |
| `src/components/design-catalog/design-catalog-disclosure/DesignCatalogDisclosure.tsx` | 71 | ok |
| `src/components/design-catalog/design-catalog-entrances/DesignCatalogEntrances.tsx` | 43 | ok |
| `src/components/design-catalog/design-catalog-feedback/DesignCatalogFeedback.tsx` | 107 | ok |
| `src/components/design-catalog/design-catalog-foundations/DesignCatalogFoundations.tsx` | 103 | C-04 |
| `src/components/design-catalog/design-catalog-piece/DesignCatalogPiece.tsx` | 96 | C-04, C-16, C-17 |
| `src/components/design-catalog/design-catalog-sidebar/DesignCatalogSidebar.tsx` | 60 | C-04 |
| `src/components/design-catalog/design-catalog-skeleton/DesignCatalogSkeleton.tsx` | 34 | C-05 |
| `src/components/design-catalog/useActiveSection.ts` | 35 | ok |
| `src/components/welcome-page/WelcomePage.tsx` | 101 | C-02 |
| `src/components/welcome-page/WelcomePage.module.css` | 104 | C-19, C-30 |
| `src/components/welcome-page/welcomeArt.ts` | 39 | C-03, C-04, C-19 |
| `src/components/welcome-page/welcomeNodes.tsx` | 34 | ok |
| `src/components/welcome-page/welcome-page-curtain/WelcomePageCurtain.tsx` | 19 | ok |
| `src/components/welcome-page/welcome-page-done/WelcomePageDone.tsx` | 116 | C-03, C-05 |
| `src/components/welcome-page/welcome-page-intro-art/WelcomePageIntroArt.tsx` | 187 | C-05, C-19 (decorative sketches; size justified) |
| `src/components/welcome-page/welcome-page-intro-detail/WelcomePageIntroDetail.tsx` | 130 | C-03, C-04, C-06, C-07, C-28 |
| `src/components/welcome-page/welcome-page-intro-perk/WelcomePageIntroPerk.tsx` | 65 | C-05, C-07 |
| `src/components/welcome-page/welcome-page-intro/WelcomePageIntro.tsx` | 75 | C-03 |
| `src/components/welcome-page/welcome-page-library-preview/WelcomePageLibraryPreview.tsx` | 40 | C-04, C-05 |
| `src/components/welcome-page/welcome-page-platform-linked/WelcomePagePlatformLinked.tsx` | 54 | C-05 |
| `src/components/welcome-page/welcome-page-preferences-choice/WelcomePagePreferencesChoice.tsx` | 27 | ok |
| `src/components/welcome-page/welcome-page-preferences-detail/WelcomePagePreferencesDetail.tsx` | 108 | C-03, C-04, C-06, C-07, C-28 |
| `src/components/welcome-page/welcome-page-preferences-themes/WelcomePagePreferencesThemes.tsx` | 27 | C-18 |
| `src/components/welcome-page/welcome-page-preferences/WelcomePagePreferences.tsx` | 130 | C-02, C-03 |
| `src/components/welcome-page/welcome-page-privacy-sample/WelcomePagePrivacySample.tsx` | 59 | C-05 |
| `src/components/welcome-page/welcome-page-privacy/WelcomePagePrivacy.tsx` | 90 | C-02, C-03, C-05 |
| `src/components/welcome-page/welcome-page-profile-preview/WelcomePageProfilePreview.tsx` | 49 | C-04, C-05, C-14 |
| `src/components/welcome-page/welcome-page-profile/WelcomePageProfile.tsx` | 120 | C-02, C-03, C-14 |
| `src/components/welcome-page/welcome-page-psn/WelcomePagePsn.tsx` | 100 | C-02, C-03, C-10, C-28 |
| `src/components/welcome-page/welcome-page-ra-guide/WelcomePageRaGuide.tsx` | 75 | C-04, C-05, C-19 |
| `src/components/welcome-page/welcome-page-ra/WelcomePageRa.tsx` | 115 | C-02, C-03, C-10 |
| `src/components/welcome-page/welcome-page-steam/WelcomePageSteam.tsx` | 76 | C-02, C-03 |
| `src/components/welcome-page/welcome-page-step/WelcomePageStep.tsx` | 110 | C-02, C-03, C-04 |
| `src/components/welcome-page/welcome-page-steps-bar/WelcomePageStepsBar.tsx` | 132 | C-03, C-06, C-13 |
| `src/components/main-header/MainHeader.tsx` | 265 | C-06, C-08, C-09, C-15, C-16, C-21, C-23 |
| `src/components/main-header/MobileNavModal.tsx` | 191 | C-01, C-06, C-08, C-15, C-21 |
| `src/components/main-header/main-header-level/MainHeaderLevel.tsx` | 47 | C-26 |
| `src/components/main-header/status-nav-dropdown/StatusNavDropdown.tsx` | 58 | C-09 |
| `src/components/search-modal/SearchModal.tsx` | 261 | C-01, C-08, C-16, C-21, C-31 |
| `src/components/search-modal/search-modal-game-result/SearchModalGameResult.tsx` | 63 | ok (gap: Tag) |
| `src/components/search-modal/search-modal-group/SearchModalGroup.tsx` | 14 | C-04 |
| `src/components/search-modal/search-modal-home/SearchModalHome.tsx` | 120 | ok (gap: Avatar, raw `<img>`) |
| `src/components/search-modal/search-modal-row/SearchModalRow.tsx` | 55 | ok (gap: ListRow candidate) |
| `src/components/search-modal/search-modal-user-results/SearchModalUserResults.tsx` | 60 | C-31 |
| `src/components/layout-modal/LayoutModal.tsx` | 106 | ok |
| `src/components/layout-modal/layout-modal-preview/LayoutModalPreview.tsx` | 68 | C-04 |
| `src/components/layout-modal/layout-modal-preview/layout-modal-preview-sample.ts` | 21 | ok |
| `src/components/layout-modal/layout-modal-preview/layout-modal-preview-header/LayoutModalPreviewHeader.tsx` | 20 | ok |
| `src/components/layout-modal/layout-modal-preview/layout-modal-preview-cover-hero/LayoutModalPreviewCoverHero.tsx` | 23 | C-04 |
| `src/components/layout-modal/layout-modal-preview/layout-modal-preview-sample-profile/LayoutModalPreviewSampleProfile.tsx` | 28 | C-04 |
| `src/components/layout-modal/layout-modal-preview/layout-modal-preview-sample-game-card/LayoutModalPreviewSampleGameCard.tsx` | 38 | C-12 |
| `src/components/theme-modal/ThemeModal.tsx` | 57 | C-18 |
| `src/components/theme-modal/theme-modal-groups/ThemeModalGroups.tsx` | 38 | C-04, C-27 |
| `src/components/theme-modal/theme-modal-option/ThemeModalOption.tsx` | 29 | C-27 |

Tests: not audited; none in this area looked duplicated or grossly oversized at a glance.
