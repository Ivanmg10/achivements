# E — Admin, auth, landing, legal, public shell, modals, not-found, presence, vault, misc shared
Auditor notes: The area mostly works and most files are small, but much of it was written before the library (`Modal` with `title`/`hint`/`icon`/`footer`/`showClose`, `Field`, `Notice`, `Button loading`, `IconButton`, `ToggleButton`, `SearchInput`) and was never moved onto it. The same hand-drawn pieces show up in file after file: the modal head with a close ✕, the danger/success notice box, a spinner beside the button text, the platform brand colours, the auth form heading. Two components are dead, and one (`PlatformMark`) shows the PlayStation logo on Xbox games. The admin panel (English-only, by the rules) has the most copy-paste: four identical platform blocks, twice.

## Findings

### E-01 · HIGH · dead
- **Where:** `src/components/games-played-pie-chart/GamesPlayedPieChart.tsx:1-93` (+ its test), `src/components/main-start/MainStart.tsx:1-21` (+ its test)
- **What:** No file imports either component (grep of `src/` finds only their own tests). `GamesPlayedPieChart` is also misnamed: its default export is `ConsolesPieChart` and it draws a bar chart. Things only they use: `groupByConsole` in `src/utils/utils.tsx:59` (used by its test too), `T.pieChart`, `T.mainStart` (in all languages), and the `main-body-${theme}`/`main-header-${theme}` classes, which exist nowhere else.
- **Fix:** Delete both folders, `groupByConsole` and its test block, and the `pieChart`/`mainStart` keys in every translation.
- **Size:** 114 lines + 2 tests + translations → 0

### E-02 · HIGH · library
- **Where:** `avatar-modal/AvatarModal.tsx:59-72`, `forgot-password-modal/ForgotPasswordModal.tsx:78-87`, `hidden-games-modal/HiddenGamesModal.tsx:25-38`, `period-achievements-modal/PeriodAchievementsModal.tsx:43-52`, `week-achievements-modal/WeekAchievementsModal.tsx:47-61`, `showcase-picker-modal/ShowcasePickerModal.tsx:92-115`, `admin-panel/admin-panel-modal/AdminPanelModal.tsx:33-39`. Also headings drawn by hand in `ChangePasswordModal:71`, `DeleteAccountModal:57-58`, `EditProfileModal:93`, `GenderModal:34`, `LanguageModal:22`, `LocationModal:64`, `AdminCreateUserModal:58`, `HideGameButton:66-72`. And `common-modal/CommonModal.tsx`.
- **What:** Seven modals pass `showClose={false}` (or use `CommonModal`, which turns it off) and then draw their own `<h2>` and close ✕, each with its own classes. `Modal` already has `title`, `hint`, `icon` and `showClose`, and those also name the dialog (`aria-labelledby`). Two of these ✕ buttons have hard-coded English labels: `aria-label="Close"` at `ForgotPasswordModal.tsx:81` and `WeekAchievementsModal.tsx:56` (i18n rule). `HideGameButton:66-68` redraws the icon tile that `Modal`'s `icon` prop already draws. `CommonModal` (13 importers) only differs from `Modal` by `showClose=false` and `gap-5`, and its comment says "New code uses `Modal` directly".
- **Fix:** Pass `title`/`hint`/`icon` to `Modal` and drop the hand-drawn head and ✕ (`showClose` is on by default). `ShowcasePickerModal` can pass a ReactNode title holding its back button. When every importer has moved, delete `CommonModal`.
- **Size:** about 12–15 lines saved per modal, so ~120 lines; `CommonModal` −13

### E-03 · HIGH · library
- **Where:** `AvatarModal.tsx:126`, `ChangePasswordModal.tsx:100`, `EditProfileModal.tsx:166`, `LoginUserForm.tsx:73-81`, `RegisterUserForm.tsx:119-123`, `RegisterUserFormRa.tsx:71`, `ResetPasswordForm.tsx:67,71,77`, `MissableNotice.tsx:41-42`, `VaultFillLine.tsx:23`, `VaultFillProgress.tsx:74`. Outside the area: `steam-signup-form/SteamSignupForm.tsx:52`, `steam-signup-form-fields/SteamSignupFormFields.tsx:69`, `user-page/email-verification-notice/EmailVerificationNotice.tsx:22`.
- **What:** `Notice` (tinted box with its icon, plus `role="alert"`/`status`) is drawn by hand about 14 times, often as the exact string `bg-danger/10 ring-1 ring-inset ring-danger/30 rounded-control p-3`. The success boxes have drifted: `LoginUserForm:73` and `ResetPasswordForm:71` use `bg-success/20 border border-success/40 rounded-tile`, and the modals use a third version. None of them show the icon, so the tone rests on colour alone.
- **Fix:** Use `<Notice tone="danger|success|warning">` everywhere. `MissableNotice` fits `Notice`'s `title` and `action` props. It needs `role="status"` for danger, so add a `polite` prop or keep the warning tone.
- **Size:** ~45 lines of classes → 14 one-liners

### E-04 · HIGH · library / dead
- **Where:** `src/components/main-spinner/Spinner.tsx:1-112`. Callers: `AdminUnlock:88-92`, `AvatarModal:134`, `ForgotPasswordModal:119-126`, `LoginUserForm:110-115`, `RegisterUserForm:195-200`, `RegisterUserFormRa:123-130`, `ResetPasswordForm:119-124`, and outside the area `RaLoginModal`, `SteamSignupFormFields`.
- **What:** Every caller uses the spinner at 12–16 px inside a button, next to the button's text. That is what `Button loading` does (its own spinner, and it disables itself). Spinner's `size >= 20` branch (`ArcTrack`, the wave dots, the ★, about 85 lines) is reached only by `Spinner.test.tsx`. The folder `main-spinner` does not match the file `Spinner.tsx` (naming rule).
- **Fix:** Use `<Button loading={submitting}>` with the "…ing" text. Delete `main-spinner/` and its test. The visible change is the spinner's look (current colour instead of the accent top): check it with the user.
- **Size:** 112 → 0, and each caller loses 5–7 lines

### E-05 · HIGH · library / duplication
- **Where:** In the area: `PlatformLogo.tsx:23-25`, `PlatformMark.tsx:50-52`, `AdminLinkedAccounts.tsx:119,155,191`, `AdminUserCard.tsx:77,83,89`, `AuthBrand.tsx:26,30`, `LandingBento.tsx:60,64`, `HiddenGamesModal.tsx:54-62`, `AdminPsnToken.tsx:47`, `CompletionDistribution.tsx:10-13`, `VaultPlatformSplit.tsx:9`. Across `src/` there are **116** occurrences of `#66c0f4`/`#0070d1`/`#107c10` in about 40 files.
- **What:** `PlatformLogo` is meant to be the one place that draws a platform's logo in its colour, but callers import `SteamLogo`/`PlaystationLogo`/`XboxLogo` and re-type the hex themselves (`HiddenGamesModal` rebuilds `PlatformLogo` as a ternary chain). Xbox is inconsistent: `#107c10` on logos, but `success` in `CompletionDistribution` and `PLATFORM_FILL`. The list of three platforms with logos is also written three times (`AuthBrand:21-32`, `LandingBento:55-66`, `MainFooter:8-12`).
- **Fix:** Put one map in `src/utils/` (e.g. `PLATFORM_HUE = { steam: { text: 'text-[#66c0f4]', bg: 'bg-[#66c0f4]' }, … }`, written out in full so Tailwind sees the class names). `PlatformLogo` and `PLATFORM_FILL` read it, and callers use `<PlatformLogo source=…>`. Tell the other auditors to check the other ~35 files.
- **Size:** in the area ~25 lines; site-wide ~100

### E-06 · HIGH · dead / bug in waiting
- **Where:** `src/components/platform-mark/PlatformMark.tsx:41-55`. Used by `CollectionTile.tsx:33` and `PerfectGameTile.tsx:54`.
- **What:** Any source other than RA and Steam falls into the `PlaystationLogo` branch, so an Xbox game (visible to admins) gets the PS mark. The component also re-implements `PlatformLogo`'s colours.
- **Fix:** Render `<PlatformLogo source={source} size={size} />` inside the round chip. That one line fixes Xbox and removes the duplication.
- **Size:** 25 → ~15

### E-07 · HIGH · duplication
- **Where:** `not-found-screen/NotFoundScreen.tsx:21-46`, `not-found-game/NotFoundGame.tsx:22-49`, `route-error/RouteError.tsx:37-66`. Cards: `not-found-progress/NotFoundProgress.tsx:9`, `route-error/route-error-card/RouteErrorCard.tsx:27`.
- **What:** Three status screens repeat the same shell: the root classes plus `STATUS_SCREEN`, the badge slot, the eyebrow/display-title/subtitle block (identical classes), a 360 px card and a row of two buttons. The two cards share the same 130-character class string. `STATUS_BUTTON` is `buttonClass` put on `<Link>`/`<button>`, but `Button` already takes `href`.
- **Fix:** Make one `StatusScreen` (props `badge`, `eyebrow`, `title`, `subtitle`, `tone`, `card`, `actions`, `fullScreen`) next to `statusScreen.ts`, and one card shell. The three screens then only pass content. Use `<Button href>`/`<Button variant="secondary">` and delete `STATUS_BUTTON`.
- **Size:** 167 → ~60 + a 35-line `StatusScreen`

### E-08 · HIGH · duplication
- **Where:** `period-achievements-modal/PeriodAchievementsModal.tsx:16-82`, `week-achievements-modal/WeekAchievementsModal.tsx:16-91`
- **What:** The two files are about 80 % the same: the `hasPoints` rule, grouping by day, the day header, the 2-column grid of `RecentAchievementRow`, and the totals footer. The only real differences are how days are chosen (all days vs the 7 of one week) and the head. Both have i18n problems: a hard-coded `pts` (also in `RecentAchievementRow.tsx:37`), `toLocaleDateString('default', …)` and `toLocaleString()` without `lang` (CLAUDE.md: numbers and dates in the reader's language).
- **Fix:** Keep `PeriodAchievementsModal` and add a `kicker` prop. The week modal becomes a caller that filters to the week first (a `groupByDay`-style util, which already exists in `utils.tsx`), so `WeekAchievementsModal` can go. Move `pts` into `T` and pass `lang`.
- **Size:** 175 → ~85

### E-09 · MED · library
- **Where:** `src/components/auth-form-field/AuthFormField.tsx:15-63`. Six users: Login, Register, RegisterRa, ResetPassword, ForgotPassword, SteamSignupFormFields.
- **What:** It re-implements `ui/Input.tsx`'s `Field` (label, hint or error wired by `useId`/`aria-describedby`). The only extra is the icon. Its error line is missing `role="alert"`, which `Field` has.
- **Fix:** Make it `<Field label hint error>{(c) => <div className="relative">{icon}<Input {...c} icon invalid …/></div>}</Field>`, or add an `icon` slot to `Field`/`Input`.
- **Size:** 63 → ~25

### E-10 · MED · duplication
- **Where:** `admin-panel/admin-linked-accounts/AdminLinkedAccounts.tsx:79-223`, `admin-panel/admin-user-card/AdminUserCard.tsx:69-94`
- **What:** `AdminLinkedAccounts` writes the same 36-line block four times (logo, linked name or "Not linked", Unlink, input(s), Link, error), only changing field names. `AdminUserCard` writes the same row four times too. The Unlink button is a local `BUTTON` class string instead of `<Button variant="danger" size="sm">`, and Link is `buttonClass` on a `<button>`.
- **Fix:** Use a `PLATFORMS` array (`source`, `linked(user)`, `name(user)`, `inputs`, `clear`) and map it. RA's two inputs are the only special case. Use `PlatformLogo` and `Button`.
- **Size:** 226 → ~110; card rows 26 → 8

### E-11 · MED · size / rule
- **Where:** `src/components/admin-panel/AdminEditUserModal.tsx:28-259`
- **What:**
  - `values: Record<string, string | boolean>` forces about 15 `as string`/`as boolean` casts. A typed object, or one `useState` per field, would remove them.
  - `FieldRow`'s label is a `<span>`, so none of the inputs has a label. Admin is exempt from i18n, not from a11y.
  - Two props do the same job: `onUpdated(id, field, value)` is `onChanged(id, {[field]: value})` (`AdminPanel.tsx:117`).
  - Section comments label the obvious: `{/* Username */}`, `{/* Email */}`, `{/* Avatar */}`, `{/* Location */}`, `{/* Admin toggle */}`.
  - Dead code: `onError={() => {}}` (l.138). `text-danger hover:text-danger` (l.166) is redundant.
  - The country search filter (l.63-66) is a copy of `LocationModal.tsx:25-29`.
  - The Close button is drawn by hand.
- **Fix:** Use typed state, and `Field`+`Input` in `FieldRow`. Keep only `onChanged`. Put `searchCountries(q)` in `utils/countries.ts` for both pickers. Use `Button variant="secondary"`.
- **Size:** 259 → ~170

### E-12 · MED · library
- **Where:** `AdminCreateUserModal.tsx:60-105`, `EditProfileModal.tsx:97-157`
- **What:** Label, input and error are written by hand (`text-xs … uppercase tracking-wider` labels) instead of `Field`/`Input`. Password fields have a hand-made show/hide toggle (`AdminCreateUserModal:74-84`) or none (`EditProfileModal:147`), while `PasswordInput` exists. `EditProfileModal:99` has a `<label>` with no `htmlFor` and no control. The comments `{/* Current value */}`, `{/* New value */}`, `{/* Confirm value */}`, `{/* Error */}`, `{/* Success */}`, `{/* Actions */}` restate the code. The Cancel button at `AdminCreateUserModal:98` is drawn by hand.
- **Fix:** Use `Field`+`Input` and `PasswordInput`. Make the "current" value a `<p>`, not a label. Delete the comments.
- **Size:** 190 → ~140; 108 → ~80

### E-13 · MED · duplication / library
- **Where:** `location-modal/LocationModal.tsx:31-54`, `location-modal/LocationModal.tsx:87-104`, `language-modal/LanguageModal.tsx:30-46`
- **What:** `LocationModal.handleSelect` is a line-for-line copy of `useSaveProfileField.save` (same fetch, same `update()`, same toast), except that its `res.json()` has no `.catch`. Its country buttons and `LanguageModal`'s language buttons share one hand-made class string (`flex items-center gap-2 px-3 py-3 rounded-tile transition-all … bg-accent text-bg-main : bg-bg-main hover:bg-bg-card`). `GenderModal`, a sibling, already uses the library's `choiceClass` for the same job.
- **Fix:** Call `useSaveProfileField().save('location', code)`. Use `choiceClass(selected, …)` in both pickers.
- **Size:** 109 → ~75; 50 → ~40

### E-14 · MED · abstraction
- **Where:** `ForgotPasswordModal.tsx:38-45,75-76`, `ShowcasePickerModal.tsx:47-54,89-90`, `AdminPanelModal.tsx:24-27,44-46`, `FavoriteGameModal.tsx:50-54`, `PinGameModal.tsx:43-47`
- **What:** These wrap `Modal` in work it already does:
  - Their own Escape listeners. `Modal` closes on Escape, and only for the top dialog. A window-level listener can cut across that.
  - `<AnimatePresence>{isOpen && <Modal isOpen>}`. `Modal` already has an `AnimatePresence` inside.
  - `AdminPanelModal` also adds its own `createPortal`. `Modal` already portals to `<body>`, so the doc comment's reason ("Rendered in a portal…") is stale.
  - A 50 ms `setTimeout` to focus the search field. `Modal` already focuses `[autofocus]`.
- **Fix:** Render `<Modal isOpen={isOpen}>` alone and pass `autoFocus` to `SearchInput`. Check the exit animation in Firefox after the change.
- **Size:** ~40 lines

### E-15 · MED · rule / duplication
- **Where:** `src/components/auth-page/AuthPage.tsx:32-89`
- **What:**
  - Mobile (`lg:hidden`) and desktop (`hidden lg:flex`) are both mounted, so two `LoginUserForm`/`RegisterUserForm` exist at once, each with its own state and its own `<h1>`. CSS only hides one of them.
  - `{steam ? <SteamSignupForm …/> : <LoginUserForm …/>}` is written twice.
  - The section comments are decorative (`{/* ── Mobile: … ── */}`), and two are in Spanish (`Desktop izquierda`, `Desktop derecha`). Code comments are English.
  - `useState` and the framer imports come after the component imports (file-order rule).
- **Fix:** Store the form element in a `const form = …` built once. Better: switch the layout with one media query hook so only one tree mounts. Then clean the comments and the import order.
- **Size:** 99 → ~75

### E-16 · MED · size / comments
- **Where:** `src/components/auth-collage-panel/AuthCollagePanel.tsx:7-211`, `landing-page/landing-bento/LandingBento.tsx:12-18`
- **What:** About 200 of 348 lines are data. Each RA entry repeats the full `https://media.retroachievements.org/Images/` URL. Half the RA list has per-line game comments and half has none. One comment is a changelog: `// Added from game ids sent by the user; art fetched from the RA API.` `LandingBento` copies five of the same URLs by hand. Other small issues: comments that restate the next line (`{/* subtle accent glow behind images */}`, `{/* blend edges into form bg */}`), and the column animation set through 5 inline style keys next to the existing `marquee-column` class.
- **Fix:** Move the pools to `src/utils/collageArt.ts` as RA image ids plus Steam app ids, with one comment style. `LandingBento` imports its five covers from there.
- **Size:** 348 → ~140 (+ a ~130-line data file)

### E-17 · MED · duplication
- **Where:** heading `LoginUserForm.tsx:67-70`, `RegisterUserForm.tsx:114-117`, `ResetPasswordForm.tsx:61-64`, `steam-signup-form/SteamSignupForm.tsx:43` (outside the area); text-link buttons `LoginUserForm:141`, `RegisterUserForm:239`, `ResetPasswordForm:138`, `RegisterUserFormRa:62,139`; hand-made buttons `RegisterUserForm.tsx:212-219`, `RegisterUserFormRa.tsx:118-131`
- **What:** The auth form heading (`h1` plus the accent underline `h-0.5 w-10 bg-accent mx-auto rounded-full`) is copied four times. The same 150-character "accent underline link" class is copied four times. "Create with RetroAchievements" and "Check" are hand-drawn bordered buttons instead of `Button variant="secondary"` (with `loading`).
- **Fix:** Add an `AuthFormHeading` (or a `title` prop on `AuthFormCard`), and one `TEXT_LINK` class in `auth-form-card` or `ui/`. Use `Button`.
- **Size:** ~40 lines

### E-18 · MED · rule
- **Where:** `pin-toggle-button/PinToggleButton.tsx:47-60`, `showcase-toggle-button/ShowcaseToggleButton.tsx:24-35`. Icon-only buttons: `HiddenGamesModal.tsx:66-73`, `HideGameButton.tsx:52-60`, `ShowcaseTile.tsx:36-43`, `AdminUserCard.tsx:112-130`.
- **What:** CLAUDE.md says "a pin star or any on/off icon is a `ToggleButton` (`aria-pressed`)". The pin and the showcase trophy are hand-made toggles instead. There is a tension: `ToggleButton` paints itself `text-hardcore`, and these want the accent (the pin also has an error colour). The other icon-only buttons repeat `IconButton`'s classes by hand.
- **Fix:** Add a `tone` prop to `ToggleButton` (accent/hardcore) and use it in both toggles. Use `IconButton` for the rest.
- **Size:** ~30 lines

### E-19 · MED · duplication / abstraction
- **Where:** `AdminLinkedAccounts.tsx:14`, `AdminRankings.tsx:9`, `NotFoundGame.tsx:11`, `VaultPlatformSplit.tsx:6-9,37`. Outside the area: `hooks/useVaultFill.ts:16`, `utils/vaultFill.ts:32`, `utils/aiExport.ts:65`.
- **What:** `PLATFORM_NAME` already exists in `utils/gameRef.ts:44`, yet seven files declare their own name map. `VaultPlatformSplit` is a component file that also exports `PLATFORM_FILL`, `PLATFORM_NAMES` and `PLATFORM_ORDER` (the last two through an alias at the end of the file). Four files import those constants from it.
- **Fix:** Use `PLATFORM_NAME` (plus a `PLATFORM_SHORT` next to it for "RA"/"PSN"). Move `PLATFORM_ORDER`/`PLATFORM_FILL` to the utils map proposed in E-05.
- **Size:** ~15 lines; cleaner imports

### E-20 · MED · rule
- **Where:** `pin-game-modal/PinGameModal.tsx:138,154,107,125-147`; `pin-achievement-modal/PinAchievementModal.tsx:82,63`
- **What:**
  - Hard-coded English, against the i18n rule: `<p>Game ID</p>` (l.138) and `removeLabel={\`Remove ${c.title}\`}` (l.154).
  - The pin-by-id row (l.126-146) is a hand copy of `GamePickerRow`'s look.
  - `PinAchievementModal` builds the RA badge URL by hand. That URL is built in 15 files across `src/` (see Cross-area).
  - A pin failure shows `T.gameExpanded.loadError`, a load message.
- **Fix:** Move the strings to `T`. Render the direct id as a `GamePickerRow` candidate (`fetchRaCandidateById` already returns a `GameCandidate`). Add an RA badge URL helper in `utils.tsx` next to `achievementBadgeUrl`.

### E-21 · MED · duplication
- **Where:** `seo-page/SeoPage.tsx:21-50`, `public-shell/PublicShell.tsx:9-16`
- **What:** `SeoPage` re-implements `PublicShell` (same root classes, `LandingNav`, `<main>`, `PublicFooter current`). It only adds the footer's `note`.
- **Fix:** Add a `note` prop to `PublicShell` and wrap `SeoPage`'s content in it.
- **Size:** 52 → ~42

### E-22 · MED · duplication / library
- **Where:** `AdminPsnToken.tsx:45-58`, `AdminRankings.tsx:28-40,86-92`, `AdminXbox.tsx:37-40`, `AdminXboxGame.tsx:60-66`, `AdminPanel.tsx:163-194`
- **What:** The admin sections repeat one card (`bg-bg-card rounded-card p-4 flex flex-col gap-3` with an icon `h3`) and one "Could not load … Retry" line (`<p role="alert">…<button underline>`), 3 times each. Controls are drawn by hand:
  - the Lock button (`AdminPanel:188`),
  - the count pill (`AdminPanel:163`),
  - the review button (`AdminRankings:86`),
  - a raw search `<input>` with an icon (`AdminPanel:170-182`), where `SearchInput` exists.
- **Fix:** Add an `AdminSection({ icon, title })` and an `AdminRetry({ text, onRetry })` in `admin-panel/`. Use `Button variant="secondary" size="sm"` and `SearchInput`.
- **Size:** ~35 lines

### E-23 · MED · dead
- **Where:** `src/components/completion-distribution/CompletionDistribution.tsx:10,28-29,45-53,57`
- **What:** The only caller (`CollectionNumbers.tsx:106-116`) always passes `showTitle={false}`, never passes `isLoading`, and never uses `tone="ra"`. So the title branch, the skeleton branch and the `ra` tone row only run in the test.
- **Fix:** Delete them, or confirm that a caller is planned.
- **Size:** 90 → ~65

### E-24 · MED · comments (stale)
- **Where:** `connect-accounts/ConnectAccounts.tsx:69`, `connect-accounts/ConnectAccounts.tsx:72`, `landing-page/landing-bento/LandingBento.tsx:24`, `admin-panel/admin-panel-modal/AdminPanelModal.tsx:13-14`
- **What:** These comments say the opposite of the code:
  - `{/* The account page's own Steam card: the name is typed right here. */}`. Since 2026-10-21 Steam links only through Steam (`UserSteamCardLink`).
  - The PSN comment beside it says the same thing and needs a reread.
  - `LandingBento`'s doc says "PlayStation as still coming", but PlayStation shipped long ago.
  - `AdminPanelModal`'s comment about the portal is stale (see E-14).
- **Fix:** Rewrite or delete them. The ConnectAccounts comments add nothing once corrected.

### E-25 · MED · library
- **Where:** `profile-teaser/ProfileTeaser.tsx:52-57`, `landing-page/landing-nav/LandingNav.tsx:25-30`, `recent-games-list/RecentGamesList.tsx:51-60`, `connect-accounts/ConnectAccounts.tsx:61`, `cookie-banner/CookieBanner.tsx:33-38`, `avatar-modal/AvatarModal.tsx:133-140,171`
- **What:** Buttons and link pills are drawn by hand (`px-4 py-2 rounded-full bg-ink/10`, `px-4 py-1.5 rounded-full … ring-1`, `text-xs bg-bg-main px-3 py-1 rounded-full`). Elsewhere `buttonClass(...)` is put on a `<button>`, which the library reserves for "the rare place that cannot render `Button`".
- **Fix:** Use `<Button variant="secondary|quiet" size="sm" href=…>` and `<Button loading>`.

### E-26 · MED · duplication
- **Where:** `playstation-logo/PlaystationLogo.tsx:6-28`, `steam-logo/SteamLogo.tsx` and `xbox-logo/XboxLogo.tsx` (outside the area), `platform-logo/PlatformLogo.tsx`, `platform-mark/PlatformMark.tsx`
- **What:** The three brand logos are the same 20-line `<svg>` wrapper (size, `currentColor`, aria-hidden vs `role="img"`). Only the `viewBox` and path(s) differ. `SteamLogo` declares an `aria-hidden` prop and never reads it. Together with `PlatformLogo` and `PlatformMark` that makes five logo components, where two would do: a mark (data) and `PlatformLogo` (colour and label). `RaLogo` is an image and stays separate.
- **Fix:** Use one `BrandMark({ source })` with a `PATHS` map (or keep the three files as data only). `PlatformLogo` becomes the only public entry, and `PlatformMark` follows E-06.
- **Size:** ~85 → ~45

### E-27 · MED · library / rule
- **Where:** `ChangePasswordModal.tsx:105-120`, `DeleteAccountModal.tsx:56-84`, `EditProfileModal.tsx:172-187`, `AdminCreateUserModal.tsx:97-105`, `HideGameButton.tsx:73-87`
- **What:** The "Cancel / Save" row (`flex gap-3 mt-2`, two `flex-1 lg` buttons) is drawn in the body four times. `Modal`'s `footer` slot does this under a hairline. `DeleteAccountModal` destroys the account but is a plain dialog. CLAUDE.md says such a confirmation is `tone="danger"` (`alertdialog`, icon in red).
- **Fix:** Pass the buttons as `footer={…}`. Use `tone="danger"` with `title`/`hint` on the delete modal.

### E-28 · LOW · rule
- **Where:** `console-filter/ConsoleFilter.tsx:9-25,67-73`
- **What:** The component file exports `buildConsolePills`, a pure transform (CLAUDE.md: pure transforms go in `src/utils/utils.tsx`). The clear button is hand-drawn with a text "✕". There is a double blank line at l.10-11.
- **Fix:** Move the function to utils. Use `Button variant="quiet" size="sm"` with `IconX`.

### E-29 · LOW · comments
- **Where:** `main-spinner/Spinner.tsx:26,59,62,94` (goes with E-04), `auth-collage-panel/AuthCollagePanel.tsx:47,285,288`, `auth-page/AuthPage.tsx:31,57,74`, `edit-profile-modal/EditProfileModal.tsx:97-171`, `admin-panel/AdminEditUserModal.tsx:89-200`, `admin-panel/admin-xbox/admin-xbox-game/AdminXboxGame.tsx:10`, `common-modal/CommonModal.tsx:6`, `expand-panel/ExpandPanel.tsx:10-11`, `welcome-curtain/WelcomeCurtain.module.css:11`, `recent-achievement-row/RecentAchievementRow.tsx:16`
- **What:**
  - Labels that restate the code: `{/* Wave dots */}`, `{/* Track arc hint */}`, `{/* Username */}`, `{/* Actions */}`.
  - An orphan doc comment at `AdminXboxGame:10`: `/** Admin panel text is English (exempt from i18n). */` attached to nothing.
  - Changelog phrasing: "The older modal API, now the library's `Modal`", "like the `{open && …}` it replaces", "The user found the first version, 18 % in and out with a sharp curve, too abrupt".
  - `RecentAchievementRow:16` repeats its own docstring.
- **Fix:** Delete them. Keep the "why" sentences around them.

### E-30 · LOW · naming
- **Where:** `recent-achievement-row/RecentAchievementRow.tsx:17`, `main-spinner/`, `completed-filter/CompletedFilter.tsx:18`, `pin-achievement-modal/PinAchievementModal.tsx:11`, `pin-toggle-button/PinToggleButton.tsx:11`, `main-view-toggle/MainViewToggle.tsx:21`, `main-providers/MainProviders.tsx:20`
- **What:**
  - `isSteam` means "Steam, PSN or Xbox: no points". `hasPoints` would say what it means.
  - The `main-spinner/Spinner` folder and file names do not match.
  - `LABELS` is ALL_CAPS but built inside the component (ALL_CAPS is for module constants).
  - Four components are named exports where the rest of the area uses default exports.
- **Fix:** Rename. Make them default exports when they are next touched.

### E-31 · LOW · rule
- **Where:** `src/components/no-main-header/NoMainHeader.tsx:3-15` (used by `app/(main)/allGames`)
- **What:** Double quotes and semicolons (Style: single quotes, no semicolons). A hard-coded English `aria-label="Go back"` (i18n). A `w-[95%]` layout. The button is drawn by hand.
- **Fix:** Use `IconButton aria-label={T…}` and match the house style. `useGoBack` (used by the 404s) may be the right handler.

### E-32 · LOW · dead
- **Where:** `auth-form-skeleton/AuthFormSkeleton.tsx:7` (`fields`), `category-search/CategorySearch.tsx:14-19` (`id`), `presence-dot/PresenceDot.tsx:21,28` (`ring`), `steam-logo/SteamLogo.tsx` (`'aria-hidden'` prop type)
- **What:** No caller passes these props (grep across `src/`). Their docstrings describe cases that never happen.
- **Fix:** Delete them.

### E-33 · LOW · abstraction
- **Where:** `privacy-policy/PrivacyPolicy.tsx`, `terms-of-use/TermsOfUse.tsx`
- **What:** Two 10-line client wrappers whose only job is `<LegalDocument doc={T.privacy|T.terms} />`. They exist because the page is a server component.
- **Fix:** Let `LegalDocument` take `kind: 'privacy' | 'terms'` and read `T[kind]` itself. Both wrappers go.
- **Size:** 20 → 0 (+2 lines in `LegalDocument`)

### E-34 · LOW · library
- **Where:** `main-view-toggle/MainViewToggle.tsx:45-82`, `admin-panel/admin-action-log/AdminActionLog.tsx:73-81`, `avatar-modal/AvatarModal.tsx:145-157`, `register-user-form/register-user-form-ra/RegisterUserFormRa.tsx:99-117`
- **What:** A hand-built tablist (roving tabindex, arrow keys and a module-level focus flag), where `ui/Tabs` exists. It is probably on purpose (the title doubles as the switch): confirm with the user. Three hand-made disclosures use their own chevron and `aria-expanded`, where `Accordion`/`ShowMore` exist.
- **Fix:** Try `Tabs` and `AccordionItem` first. Keep the hand version only if the look cannot be had through a prop.

### E-35 · LOW · rule (tension)
- **Where:** `src/components/view-entrance/ViewEntrance.module.css:20,24,28`
- **What:** The keyframes run with `both`, while CLAUDE.md → Entrances says "`backwards`, never `both`". `ViewEntrance` is documented as keeping its own keyframes, but nothing exempts it from the fill rule. The end state is `transform: none`, so the trap is unlikely. Still, it is the one entrance that breaks the written rule.
- **Fix:** Change to `backwards` (no visual change, since the end state equals the element's own), or write the exception into CLAUDE.md.

### E-36 · LOW · duplication
- **Where:** `legal-links/LegalLinks.tsx:13,16`, `cookie-settings-button/CookieSettingsButton.tsx:17`, `public-page-links/PublicPageLinks.tsx:19`
- **What:** The footer link class (`text-text-secondary hover:text-accent underline-offset-2 hover:underline transition-colors rounded focus-visible:…`) is copied four times.
- **Fix:** Use one `FOOTER_LINK` constant, exported from `LegalLinks`.

### E-37 · LOW · library
- **Where:** `showcase-picker-modal/showcase-picker-modal-games/ShowcasePickerModalGames.tsx:38-51`, `location-modal/LocationModal.tsx:66-74`, `admin-panel/AdminEditUserModal.tsx:171-177`, `admin-panel/AdminPanel.tsx:170-182`
- **What:** Search fields are built from `fieldClass` plus a hand-placed magnifier and an `sr-only` label. `SearchInput` does exactly this.
- **Fix:** Use `<SearchInput aria-label=…>`.

## Cross-area notes
- **Platform brand colours:** 116 hard-coded `#66c0f4`/`#0070d1`/`#107c10` in about 40 files (main-page profiles, groups, steam/psn items, user-page cards, public profile, welcome steps bar…). Every auditor should flag them toward one map plus `PlatformLogo` (E-05).
- **RA badge URL** `media.retroachievements.org/Badge/…` is built by hand in 15 files (`AchievementGrid`, `AchievementModal`, `GameInfoAchievementCard`, `GamePinnedAchievements`, `MainPageRarest`, `MainPageProfileRaAchievements`, `useShowcaseGameChoices`, `gameCompare`, `gameInsights`, `pinnedView`, `showcase`…).
- **Redundant Escape listeners around `Modal`** also appear in `GameAchievementsProgressChartModal`, `groups/AddGameModal`, `groups/GroupModal`, `main-header/MobileNavModal`, `SearchModal`, and `welcome-page-intro-detail`/`-preferences-detail`. Check whether each one wraps `Modal`.
- **Hand-drawn `Notice`** outside the area: `SteamSignupForm`, `SteamSignupFormFields`, `EmailVerificationNotice`. `SteamSignupForm` also copies the auth heading (E-17).
- **Feed item dispatch** (`psn` / `psnCollection` / `xbox` / `steam` → item component) is written in both `RecentGamesList.tsx:66-81` and `ra-recently-played/RARecentlyPlayed.tsx:125-155`. One `RecentFeedItem` would do.
- **Avatar with an `IconUser` fallback** is drawn in about 19 files (`IconUser` in components). A `UserAvatar` piece may be due.
- **Numbers and dates without `lang`** (`toLocaleString()`, `toLocaleDateString('default')`) and hard-coded `pts`: worth a site-wide grep.
- **`CommonModal` users outside the area:** `PerfectGamesOrderModal`, `RaLoginModal` (E-02).

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/components/admin-panel/AdminCreateUserModal.tsx` | 108 | E-02, E-12, E-27 |
| `src/components/admin-panel/AdminEditUserModal.tsx` | 259 | E-02, E-11, E-29, E-37 |
| `src/components/admin-panel/AdminPanel.tsx` | 268 | E-22, E-37 |
| `src/components/admin-panel/admin-action-log/AdminActionLog.tsx` | 110 | E-34 |
| `src/components/admin-panel/admin-linked-accounts/AdminLinkedAccounts.tsx` | 226 | E-10, E-05, E-19 |
| `src/components/admin-panel/admin-panel-modal/AdminPanelModal.tsx` | 47 | E-14, E-02, E-24 |
| `src/components/admin-panel/admin-psn-token/AdminPsnToken.tsx` | 115 | E-22, E-05 |
| `src/components/admin-panel/admin-rankings/AdminRankings.tsx` | 102 | E-22, E-19 |
| `src/components/admin-panel/admin-unlock-recovery/AdminUnlockRecovery.tsx` | 16 | ok |
| `src/components/admin-panel/admin-unlock-totp/AdminUnlockTotp.tsx` | 37 | ok |
| `src/components/admin-panel/admin-unlock/AdminUnlock.tsx` | 99 | E-04 |
| `src/components/admin-panel/admin-user-card/AdminUserCard.tsx` | 134 | E-10, E-05, E-18 |
| `src/components/admin-panel/admin-users-skeleton/AdminUsersSkeleton.tsx` | 28 | ok |
| `src/components/admin-panel/admin-xbox/AdminXbox.tsx` | 98 | E-22 |
| `src/components/admin-panel/admin-xbox/admin-xbox-game/AdminXboxGame.tsx` | 94 | E-22, E-29 |
| `src/components/all-games-skeleton/AllGamesSkeleton.tsx` | 34 | ok |
| `src/components/auth-brand/AuthBrand.tsx` | 36 | E-05 |
| `src/components/auth-collage-panel/AuthCollagePanel.tsx` | 348 | E-16, E-29 |
| `src/components/auth-desktop-form-panel/AuthDesktopFormPanel.tsx` | 22 | ok |
| `src/components/auth-form-card/AuthFormCard.tsx` | 14 | ok |
| `src/components/auth-form-field/AuthFormField.tsx` | 63 | E-09 |
| `src/components/auth-form-skeleton/AuthFormSkeleton.tsx` | 21 | E-32 |
| `src/components/auth-page/AuthPage.tsx` | 99 | E-15, E-29 |
| `src/components/avatar-modal/AvatarModal.tsx` | 181 | E-02, E-03, E-04, E-25, E-34 |
| `src/components/category-search/CategorySearch.tsx` | 42 | E-32 |
| `src/components/change-password-modal/ChangePasswordModal.tsx` | 123 | E-02, E-03, E-27 |
| `src/components/common-modal/CommonModal.tsx` | 13 | E-02, E-29 |
| `src/components/completed-filter/CompletedFilter.tsx` | 38 | E-30 |
| `src/components/completion-distribution/CompletionDistribution.tsx` | 90 | E-23, E-05 |
| `src/components/concealed-badge/ConcealedBadge.tsx` | 14 | ok |
| `src/components/connect-accounts/ConnectAccounts.tsx` | 99 | E-24, E-25 |
| `src/components/console-filter/ConsoleFilter.tsx` | 77 | E-28 |
| `src/components/cookie-banner/CookieBanner.tsx` | 43 | E-25 |
| `src/components/cookie-settings-button/CookieSettingsButton.tsx` | 22 | E-36 |
| `src/components/delete-account-modal/DeleteAccountModal.tsx` | 87 | E-02, E-27 |
| `src/components/edit-profile-modal/EditProfileModal.tsx` | 190 | E-02, E-03, E-12, E-27, E-29 |
| `src/components/empty-state/EmptyState.tsx` | 38 | ok |
| `src/components/expand-panel/ExpandPanel.tsx` | 48 | E-29 |
| `src/components/faq-list/FaqList.tsx` | 22 | ok |
| `src/components/faq-list/faq-list-item/FaqListItem.tsx` | 13 | ok |
| `src/components/favorite-game-modal/FavoriteGameModal.tsx` | 144 | E-14 |
| `src/components/forgot-password-modal/ForgotPasswordModal.tsx` | 135 | E-02, E-04, E-14 |
| `src/components/games-played-pie-chart/GamesPlayedPieChart.tsx` | 93 | E-01 |
| `src/components/gender-modal/GenderModal.tsx` | 55 | E-02 |
| `src/components/google-analytics/GoogleAnalytics.tsx` | 36 | ok |
| `src/components/hidden-games-modal/HiddenGamesModal.tsx` | 81 | E-02, E-05, E-18 |
| `src/components/hide-game-button/HideGameButton.tsx` | 93 | E-02, E-18, E-27 |
| `src/components/landing-page/LandingPage.tsx` | 43 | ok |
| `src/components/landing-page/landing-bento/LandingBento.tsx` | 74 | E-05, E-16, E-24 |
| `src/components/landing-page/landing-closing/LandingClosing.tsx` | 25 | ok |
| `src/components/landing-page/landing-feature/LandingFeature.tsx` | 37 | ok |
| `src/components/landing-page/landing-hero/LandingHero.tsx` | 45 | ok (`rounded-[2rem]` is on the guard's allowed list) |
| `src/components/landing-page/landing-nav/LandingNav.tsx` | 34 | E-25 |
| `src/components/language-modal/LanguageModal.tsx` | 50 | E-02, E-13 |
| `src/components/lazy-when-opened/LazyWhenOpened.tsx` | 16 | ok |
| `src/components/legal-document/LegalDocument.tsx` | 58 | E-33 |
| `src/components/legal-links/LegalLinks.tsx` | 22 | E-36 |
| `src/components/location-modal/LocationModal.tsx` | 109 | E-02, E-13, E-11, E-37 |
| `src/components/login-user-form/LoginUserForm.tsx` | 152 | E-03, E-04, E-17 |
| `src/components/main-footer/MainFooter.tsx` | 48 | E-05 (platform list) |
| `src/components/main-providers/MainProviders.tsx` | 53 | E-30 |
| `src/components/main-spinner/Spinner.tsx` | 112 | E-04, E-29, E-30 |
| `src/components/main-start/MainStart.tsx` | 21 | E-01 |
| `src/components/main-view-toggle/MainViewToggle.tsx` | 84 | E-34, E-30 |
| `src/components/missable-notice/MissableNotice.tsx` | 51 | E-03 |
| `src/components/navigation-progress/NavigationProgress.tsx` | 24 | ok |
| `src/components/no-main-header/NoMainHeader.tsx` | 16 | E-31 |
| `src/components/not-found-game/NotFoundGame.tsx` | 51 | E-07, E-19 |
| `src/components/not-found-in-app/NotFoundInApp.tsx` | 21 | ok |
| `src/components/not-found-progress/NotFoundProgress.tsx` | 21 | E-07 |
| `src/components/not-found-screen/NotFoundScreen.tsx` | 48 | E-07 |
| `src/components/period-achievements-modal/PeriodAchievementsModal.tsx` | 83 | E-08, E-02 |
| `src/components/pin-achievement-modal/PinAchievementModal.tsx` | 103 | E-20, E-30 |
| `src/components/pin-game-modal/PinGameModal.tsx` | 166 | E-20, E-14 |
| `src/components/pin-toggle-button/PinToggleButton.tsx` | 68 | E-18, E-30 |
| `src/components/platform-logo/PlatformLogo.tsx` | 31 | E-05, E-26 |
| `src/components/platform-mark/PlatformMark.tsx` | 25 | E-06, E-26 |
| `src/components/playstation-logo/PlaystationLogo.tsx` | 28 | E-26 |
| `src/components/preferences-sync/PreferencesSync.tsx` | 9 | ok (a null component keeps the hook's re-renders off the provider tree) |
| `src/components/presence-dot/PresenceDot.tsx` | 38 | E-32 |
| `src/components/presence-heartbeat/PresenceHeartbeat.tsx` | 9 | ok (same reason as PreferencesSync) |
| `src/components/presence-label/PresenceLabel.tsx` | 37 | ok |
| `src/components/privacy-policy/PrivacyPolicy.tsx` | 10 | E-33 |
| `src/components/profile-teaser/ProfileTeaser.tsx` | 62 | E-25 |
| `src/components/public-footer/PublicFooter.tsx` | 19 | ok |
| `src/components/public-page-links/PublicPageLinks.tsx` | 26 | E-36 |
| `src/components/public-shell/PublicShell.tsx` | 17 | E-21 |
| `src/components/rankings-guide-skeleton/RankingsGuideSkeleton.tsx` | 36 | ok |
| `src/components/recent-achievement-row/RecentAchievementRow.tsx` | 42 | E-30, E-08 (`pts`), E-29 |
| `src/components/recent-games-list/RecentGamesList.tsx` | 86 | E-25 (and the cross-area dispatch note) |
| `src/components/register-user-form/RegisterUserForm.tsx` | 246 | E-03, E-04, E-17 |
| `src/components/register-user-form/register-user-form-ra/RegisterUserFormRa.tsx` | 145 | E-03, E-04, E-17, E-34 |
| `src/components/reset-password-form/ResetPasswordForm.tsx` | 145 | E-03, E-04, E-17 |
| `src/components/route-error/RouteError.tsx` | 68 | E-07 |
| `src/components/route-error/route-error-card/RouteErrorCard.tsx` | 55 | E-07 |
| `src/components/seo-page/SeoPage.tsx` | 52 | E-21 |
| `src/components/seo-page/seo-page-route/SeoPageRoute.tsx` | 20 | ok |
| `src/components/shape-sync/ShapeSync.tsx` | 57 | ok |
| `src/components/show-all-button/ShowAllButton.tsx` | 17 | ok |
| `src/components/show-rest-button/ShowRestButton.tsx` | 8 | ok |
| `src/components/showcase-picker-modal/ShowcasePickerModal.tsx` | 154 | E-02, E-14 |
| `src/components/showcase-picker-modal/showcase-picker-modal-achievement/ShowcasePickerModalAchievement.tsx` | 98 | ok |
| `src/components/showcase-picker-modal/showcase-picker-modal-game-row/ShowcasePickerModalGameRow.tsx` | 50 | ok |
| `src/components/showcase-picker-modal/showcase-picker-modal-game/ShowcasePickerModalGame.tsx` | 74 | ok |
| `src/components/showcase-picker-modal/showcase-picker-modal-games/ShowcasePickerModalGames.tsx` | 75 | E-37 |
| `src/components/showcase-tile/ShowcaseTile.tsx` | 66 | E-18 |
| `src/components/showcase-toggle-button/ShowcaseToggleButton.tsx` | 37 | E-18 |
| `src/components/subject-providers/SubjectProviders.tsx` | 87 | ok |
| `src/components/terms-of-use/TermsOfUse.tsx` | 10 | E-33 |
| `src/components/theme-preview/ThemePreview.tsx` | 31 | ok |
| `src/components/toaster/Toaster.tsx` | 28 | ok |
| `src/components/toaster/toast-item/ToastItem.tsx` | 76 | ok |
| `src/components/user-summary/UserSummary.tsx` | 57 | ok |
| `src/components/vault-fill-line/VaultFillLine.tsx` | 47 | E-03 |
| `src/components/vault-fill-progress/VaultFillProgress.tsx` | 82 | E-03, E-19 |
| `src/components/vault-level-badge/VaultLevelBadge.tsx` | 64 | ok |
| `src/components/vault-platform-split/VaultPlatformSplit.tsx` | 37 | E-19, E-05 |
| `src/components/vault-sparkline/VaultSparkline.tsx` | 36 | ok |
| `src/components/vault-weeks-chart/VaultWeeksChart.tsx` | 42 | ok |
| `src/components/version-badge/VersionBadge.tsx` | 9 | ok |
| `src/components/view-entrance/ViewEntrance.tsx` | 37 | ok |
| `src/components/view-entrance/ViewEntrance.module.css` | 29 | E-35 |
| `src/components/week-achievements-modal/WeekAchievementsModal.tsx` | 92 | E-08, E-02 |
| `src/components/welcome-curtain/WelcomeCurtain.tsx` | 98 | ok (the fixed px and hex are the documented decorative exception) |
| `src/components/welcome-curtain/WelcomeCurtain.module.css` | 77 | E-29 |
| `src/components/welcome-entry-curtain/WelcomeEntryCurtain.tsx` | 25 | ok (a preset of `WelcomeCurtain`, not a duplicate) |

Tests: proportionate. `GamesPlayedPieChart.test.tsx` and `MainStart.test.tsx` test dead code (E-01). `Spinner.test.tsx` mostly tests the dead large variant (E-04). `CompletionDistribution.test.tsx` covers only branches no caller reaches (E-23).
