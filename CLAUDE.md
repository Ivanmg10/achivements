# CLAUDE.md — Achievements Tracker

## Project
Multi-user RetroAchievements companion. Public tracker with groups,
stats, and personalization. Next.js 16 App Router + PostgreSQL + Tailwind v4.

## Stack
- Framework: Next.js 16 (App Router; the auth gate is `src/proxy.ts`, the old middleware)
- Auth: NextAuth.js
- DB: PostgreSQL via `pg` pool
- Styles: Tailwind CSS v4
- Animations: Framer Motion
- Data: RetroAchievements API

## Code structure

### Folder / naming
- Component: `kebab-case/PascalCase.tsx`
  e.g. `main-side-panel/MainSidePanel.tsx`
- Sub-component: `parent-name-sub-name/ParentNameSubName.tsx`
- Hooks: `src/hooks/useXxx.ts` — never inline in component
- Pure transforms: `src/utils/utils.tsx` (NOT apiCallsUtils)

### File internal order
1. `'use client'` (if needed)
2. External imports (react, next, next-auth)
3. Internal: types → hooks → utils → components
4. Constants (ALL_CAPS)
5. Inline helpers (only if <15 lines + presentational + single use)
6. Default export component
7. Inside component: state → refs → hooks → useEffect → derived → handlers → return

### Custom hooks
- All hooks in `src/hooks/`
- Hooks own: session check, hasFetched guard, fetch, state
- `hasFetched = useRef(false)` pattern lives in hook, not component

### Sub-component extraction — MANDATORY
**Goal: pages and components as independent and self-contained as possible.**

Extract to its own file+folder when:
- Used in 2+ places, OR
- Has complex or independent meaning (card, grid, list, section, modal content), OR
- Adds meaningful visual/logical separation to the parent

Keep inline ONLY if: <15 lines + purely presentational + single file.

**Any JSX block added in a session that qualifies MUST be extracted before the task is considered done.**
When in doubt, extract. Prefer more files over bloated components.

## State and effects

`react-hooks/set-state-in-effect` is an **error**: an effect must not call
setState in its body (nor through a function it calls before its first await).
What to use instead:

- **State that starts over when something changes** (a modal opening, a session
  ending, another game): `useWhenChanged(deps, () => { setX(…) })`
  (`src/hooks/useWhenChanged.ts`). It runs while rendering, the React-endorsed
  alternative. Only setState of that component goes in it; timers, focus and
  fetches stay in an effect.
- **What the browser holds** (localStorage, sessionStorage): `useStorageValue`
  (`undefined` on the server and while hydrating, so there is no mismatch).
  `useStoredChoice`, `useCookieConsent` and the language sit on it.
- **"Only in the browser"**: `useIsClient` (a portal into `document.body`, a
  random hand), `useLocationHash` (the `#fragment`).
- **A fetch**: the effect only starts it; the answer is applied in the `.then`.
  Loading is derived (`answered !== wanted`) or reset in `useWhenChanged`, not
  set at the start of the effect. A request function that returns its outcome
  and a separate `settle` is what the compiler accepts for an `async` load.
- A retry button is a handler, so it can set state before it asks again.

## Telling the user how an action went — toasts

`notify.success(T.toast.x)` / `notify.error(T.toast.y)` from `src/lib/notify.ts`,
callable from components, hooks or contexts; `<Toaster />` (root layout) draws
them bottom right: a dark card with the tone on its edge and icon (a check for success, an
alert for an error) and a line that runs out with the time, gone after 4 s
(errors 7 s), never while hovered or focused.

- **Use a toast** for actions that happen outside a form — pin/unpin, reorder,
  delete, unlink — and for the success of a modal that closes on save.
- **Do not** for an error inside a modal that stays open: show it inline, next
  to what needs fixing. And never both for the same outcome.
- A silent failure is a bug: an optimistic update that rolls back must say so.
- Texts live in `T.toast` (all languages). The admin panel's are in English.

## Public pages — what search engines and chat AIs read

`/compare/<slug>` and `/track/<slug>` are public pages written to answer what
people ask Google or a chat AI ("a PSNProfiles alternative that also tracks
Steam"); the landing has a FAQ for the same reason. Added 2026-10-17.

- **One list**: `SEO_PAGES` in `src/translations/seoPages.ts`. A new page is a new
  entry there (with `updated`); the routes, the sitemap, the footer links and the
  proxy prefixes (`src/proxy.ts`) already follow it. A new *section* (another prefix)
  needs its route folder and a prefix in the proxy.
- Its prose is **English and Spanish only**, outside `T` on purpose (every page
  downloads `T`); other languages fall back to English. The shared bits (FAQ title,
  the landing FAQ) are in `T`, in all 9 languages.
- **Honest**: each comparison says where the other site is better. Do not claim
  anything about another site that cannot be checked.
- **No Xbox** in any of it while Xbox is admin-only; a test fails if it appears
  (except as a platform Exophase has). Update these pages when Xbox opens.
- The `FAQPage` JSON-LD (pages and landing) is built from the same English items
  the server renders; keep them one list so the markup matches what is shown.

## How UI work is done — idea → design → iterations → development (2026-10-23)

**Every new page, section or visual rework follows `docs/design-process.md`**, the way the
welcome was made (the user's standing preference): study the reference, several clickable
concepts on a claude.ai design canvas (the user calls it "Figma"; they mean the canvas), iterate with the user one
version at a time (changing only what they asked), a plan doc, then build and fix in short rounds
from their screenshots (they use a 2560 px screen). The welcome's visual language (display
italic titles, kickers, floating pill bar, curtain, cards that grow into their detail) is the
one the user likes; an internal component library to make the whole site match it was designed
and agreed on 2026-10-24 and is being built in three PRs (`docs/ui-library-and-designs-plan.md`
→ Build plan; components only, never page structure). **Every design made (canvas) gets an entry in `docs/designs.md`**
with its link, versions and what was built, so it can always be found again.

## Welcome after sign-up (`/welcome`, 2026-10-22)

A new account (form, form with RetroAchievements, or Steam) is signed in and sent to `/welcome`, not to the login form:
intro, RetroAchievements, Steam, PlayStation, profile, preferences, done. Design and the
reasoning behind it: `docs/welcome-plan.md` (and the design canvas linked there).

- **Never blocks.** Every step has "Not now" / "Skip this step", "Skip all" is always in
  the bar, and back works on every step, the browser's back and forward too (each move is a
  history entry, its step in `history.state` under Next's own state, which must be spread in,
  never replaced). Do not add a required step.
- **No Xbox** in it while Xbox is admin-only (a new account is not an admin).
- **No app header** until the person leaves it: it lives in `src/app/welcome/`, outside
  `(main)`, on purpose (the user's call).
- **Linking reuses the account page's logic** (`useRaLink`, `useSteamLink`, `usePsnLink`);
  do not add a second way to link. RA's step is a page of its own with the guide to the
  Web API key, not the modal.
- **No achievements** for linking (no unlock toasts, no "first achievement"): CheevoVault's
  own achievements are a future idea, written down in the plan. Linking toasts the usual
  `notify.success`.
- The curtain between steps is decorative (`aria-hidden`); with reduced motion it is not
  shown at all. The bar's pills say each step's state in words. It lasts 2.2 s
  (`CURTAIN_MS`; 1.1 s felt rushed to the user) and also carries a new account in from
  sign-up: the sign-up page plays it until covered and holds, the welcome finishes it
  (`useWelcomeEntry` / `useWelcomeArrival`, flag `welcome-entry` in sessionStorage).
- On big screens the welcome is scaled as a whole by raising the root font size while it is
  open (120 % from 1536 px, 140 % from 2200 px; a 2560 px screen showed it tiny). So **sizes in
  it are in rem** (`text-[0.8125rem]`, not `text-[13px]`). **Never CSS `zoom`**: it throws Framer
  Motion's layout animations off (the intro's cards grow into their detail with `layoutId`).
- The avatar is edited in `AvatarModal` (account page and welcome), not `EditProfileModal`,
  which is only for the username and email now.
- **The Vault Points fill runs in the welcome** (`VaultFillProvider` in `src/app/welcome/page.tsx`,
  since the app's providers are not mounted there): an account that came linked (signed up with
  Steam or RetroAchievements) or links a platform on the way is read while the person goes
  through the steps, so "your games are on their way" is true. Each linked platform step shows
  its `VaultFillLine` (games counted, or why not: a private profile and how to fix it), and the
  Steam card shows the Steam picture (`useSteamProfile`). Checked end to end 2026-10-23 with a
  Steam sign-up: linked in the bar, the step, the profile's avatar and the done summary.

### The welcome follows the app — keep it current (the user's standing rule, 2026-10-22)

More platforms will come. **Every platform a user can link must have its step in the welcome**,
in the same change that makes it available to users (Xbox included, the day `XBOX_ADMIN_ONLY`
turns false). A new platform touches:
- `PLATFORM_STEPS` and `WELCOME_STEPS` (`src/hooks/useWelcomeSteps.ts`): its place in the order.
  The "Platforms · n of total" count follows on its own.
- Its step component in `src/components/welcome-page/welcome-page-<platform>/`, linking with the
  platform's own hook (as RA, Steam and PSN do), with its `VaultFillLine` when linked, and its tests.
- `STEP_SKY` (`welcomeArt.ts`), its mark in `welcomeNodes.tsx` (curtain) and in the bar's
  `PLATFORM_MARK`, its row in `WelcomePageDone`, and its session field in `WelcomePage`'s `linked`.
- `T.welcome.steps` / `words` and its own texts, in all nine languages; the intro's first perk
  ("RetroAchievements, Steam and PlayStation together") names the platforms.
- `LINK_RETURNS` (`src/lib/steamLogin.ts`) if it links through a round trip, like Steam.

The same goes for the rest of the site: **when a change adds or renames a feature, a profile
field or a preference, check whether the welcome shows it** (intro perks, the profile and
preferences steps, the done summary) and update it in the same change. The intro's five
points open over the whole step (`WelcomePageIntroDetail`: `detail`, `highlights` and a drawn
sketch per point in `WelcomePageIntroArt`): keep their text and sketches true to the features.

## Language — the browser's until the person picks one (2026-10-22)

`LanguageContext`: the saved choice, else the first of `navigator.languages` the app has
(`pickLanguage` in `src/utils/languages.ts`: `es-MX` → es), else English. **The detected
language is never saved**: only a person's pick is (`setLang`), so a browser that changes
its language changes the app. `fromBrowser` says when the language shown is the detected one
(the welcome says so). The language list with native names is `LANGUAGES` there; do not keep another.

- **The first paint is already in the person's language on the app's pages (2026-10-23).** A
  pick is also written to the `app-language` cookie (a year, `languageCookie`; a choice saved
  before the cookie existed is copied into it). `(main)/layout.tsx`, which is dynamic anyway (it
  reads the session), calls `serverLanguage()` (`src/lib/serverLanguage.ts`: the cookie, else
  `Accept-Language`) and wraps the page in a `LanguageProvider initial={…}`, which renders that
  language on the server and while hydrating, so they match. That covers the landing and the
  whole signed-in app.
- **Each language is its own chunk (2026-10-30, audit PERF-02):** `loadMessages`
  (`src/translations/load.ts`) imports it on demand; only English is in every page. A language
  must stay plain data, as `(main)/layout.tsx` sends the active one to the client as `messages`
  so hydration needs no fetch (`load.test.ts` fails on a function). Never import `es`, `pt`… into
  client code.
- **Do not call `serverLanguage()` (or `headers()`/`cookies()`) in the root layout**: it would
  make every page dynamic, the static ones too (`/privacy`, `/terms`, `/compare`, `/track`,
  `/welcome`). `/authPage` is dynamic on purpose: it reads `searchParams` on the server, because
  `useSearchParams` would send it empty. Those still paint English until they hydrate; reached by a client
  navigation (the usual way) they are already in the right language.
- `/privacy` lists the cookie among the necessary ones, in all nine languages.

## The design system — read `docs/design-system.md` before any UI (2026-10-25)

Three layers: **tokens** (`globals.css`: a theme's colours, a *design's* shapes), **the library**
(`src/components/ui` and friends) and **pages built from it**. The catalogue of every piece is at
**`/design`, admins only** (the flag is read from the database; others get the 404).

- **Two designs, two look preferences:** `shape-style` = `slanted` (default) or `round`, and
  `font-style` = `barlow` (default), `sofia` or `fira` (Preferences → Layout), as
  `data-shape` and `data-font` on `<html>`; any element can carry either one to show a look inside
  another (the catalogue, the choice cards and the Layout chooser's sample do; `data-font` swaps `--font-face` and `--font-face-display`, and such an element takes the family itself) (`ShapeSync`; a
  script in the root layout paints the last choices before the first frame). A component never
  reads the choice: it reads tokens. A bar's cut ends are `slantStyle(px)`
  (`ui/shape.ts`), a mark's lean `skew-y-(--slant-mark)`, a control's `skew-x-(--slant-button)`.
  **Never a literal `polygon(...)` or `skew-*-[..]`** (`uiGuard.test.ts` fails on it). The round
  design may override the shape tokens; no theme may (`designTokens.test.ts`). The welcome curtain's
  fixed clip paths are the documented decorative exception and do not follow the shape choice.
- **The round design must always be rounder than the slanted one (2026-11-01, #78):** every surface a step
  softer (`--r-card`, `-sheet`, `-pane`, `-tile`, `-control`, `-area`, `-box*`; `designTokens.test.ts` fails if one
  is not), and every one-line control a pill or a circle (`--r-button`, `-field`, `-icon`, `-tag`, `-tag-sm`, `-badge`,
  `-chip`). It started as a copy of the site before the slant, and the slanted design then grew past it, so it looked
  square with nothing failing. **Choose by what the thing is:** a card `rounded-card`, a floating panel `rounded-sheet`,
  an inner tile `rounded-tile`, a thumbnail, row or small box `rounded-box` (`-md`, `-sm`), a heatmap cell `rounded-cell`, a
  button `rounded-button`, an icon button `rounded-icon` or `rounded-chip`, one line of input `rounded-field`, several lines
  `rounded-area` (`multiline: true` on `fieldClass`, which the guard requires on a raw `<textarea>`; a round corner cuts its grip,
  so `[resize:var(--area-resize)]`). A `Modal` draws the frame: never a card inside it. **`rounded-control` is a soft surface, despite its name** (notices, menus,
  tooltips): it must never be a pill, and a real control does not use it. A value new to the slanted block restates what
  that design drew, so it does not move. Outside `ui/`, `uiGuard.test.ts` refuses `rounded-lg`, `-md`, `-sm`, `-xl`, `-2xl`,
  `-3xl` and arbitrary values, on any side, but for its short list of exceptions; a bare `rounded` is only a focus ring's corner.
  A `rounded-full` chip is a pill in both designs: left so on purpose, since moving it would change the slanted design.
- **Disclosure:** `Accordion` (`AccordionItem`), `ShowMore`, `Shelf`, `DropSlot` and `ToggleButton`
  are in `ui/`; a pin star or any on/off icon is a `ToggleButton` (`aria-pressed`), never a hand-made `role="switch"`.
- **Game cards:** `game-card-style` = `tinted` (default, the colour of the game's art) or `flat`;
  `GameCardBackdrop` is the one place that draws it, so every game card follows it.
- **The Layout modal moves on every change (2026-11-01, #78):** all its options in view, no tabs. The theme stays in its own dialog (`ThemeModal`, which stays open on a pick and says what is on and saved), by the user's choice after trying it inside. The first game's card grows into
  the cover (Framer `layoutId`), the flat style wipes across the cards, and the rest goes through `lookTransition`
  (`src/utils/lookTransition.ts`, the browser's view transition): a font fades (in the sample: the page takes it when the modal closes, so it never changes behind; the user's call), a theme spreads from its tile, and a shape sweeps
  across the window behind a band of the accent shaped like it (`sweepEdge`). Do not ease a shape with CSS: the bars' `clip-path` cannot, so half the
  page jumped (the user turned that down). A browser without view transitions, or reduced motion, just changes. **Over a blurred backdrop a transition must be kept to the dialog** (`lookTransition(…, within)`): Firefox leaves `backdrop-filter` out of its capture of the page, so a whole-page transition shows the page sharp behind the dialog until it ends. A dialog's ring and shadow are outside its box, so a fade draws them twice and a sweep's `clip-path` cuts them: the `look-panel` pair clips the looks and draws them itself. **The change goes in after `ready`, two frames in, never in the transition's callback:** Firefox shows the element itself on a transition's first frame, a flash of the new look; the new look is live, so it takes the change behind the animation. Test motion in Firefox too, on the real screen.
- **Streaks are coloured by tier** (`streakTier`: 0, 5, 10, 20, 30, 40, 50+ days; `StreakTag`, the best streaks' bars, the
  streak hero and its live bar, the cover's streak card, the home's stats tile, the rankings' streak column). This replaces "streaks in the accent" for those places.
- **Adding a piece:** library first (`ui/`, props for layout only, a test), then its specimen in the
  catalogue, then its rule in `uiGuard.test.ts`, then the page. A page that needs a one-off look asks
  for a prop or a variant, never a copy.

### Entrances — a class, never a new animation (2026-10-31, #61)

`docs/design-system.md` → Entrances has the table. **A new page or list brings its entrance in the same
change:** `.enter-rows` on a list, `tbody` or a hero's text; `.enter-cards` on a grid; `.enter-card` /
`.enter-rise` on one piece (`[--i:n]` orders them); `.enter-grow-x` / `-y` on a bar, `animateIn` on a ring,
`CountUp` on a big number. A `ProgressBar` inside any of them grows by itself.

- **CSS keyframes, never Framer's `x`/`y`/`initial` on what appears on a load** (`uiGuard.test.ts` fails on it;
  what opens on a click may stay in Framer), and never hide an element until a frame, idle callback or observer.
- `backwards`, never `both`: a fill that stays keeps a transform, which traps `position: fixed` and breaks dragging.
- The library's shelves keep their own cascade (`.enter-shelves`), and the home its own keyframes: the user prefers them
  that way (2026-10-31). Do not fold them into the general families.
- A block that waits for a fetch holds its exact room, measured, or the same element unseen: the account page's level
  and rankings switch did not, and the page jumped 118 px when they landed. `useVaultMe`'s `isLoading` covers the session read.
- A list plays once: `useEntrancesOnce` sets `data-entered`, as a reorder would restart it. Keep a skeleton out of
  the element that has the class.
- Reduced motion restates the `--enter-*` tokens, so nothing else is needed for it. Entrance-only: no scroll
  triggers, no loops. Overlays and page transitions stay as they are.

## The component library — draw with it (`src/components/ui`, 2026-10-24)

The site's controls come from the library, in the design agreed on the canvas
(`docs/ui-library-and-designs-plan.md` → Build plan). **Never draw one by hand**; a
guard test (`src/components/ui/uiGuard.test.ts`) fails when one appears outside `ui/`:

- **Buttons**: `Button` (`primary` slanted, `secondary`, `quiet`, `danger` (tinted, not solid); `size`; `loading`;
  `href` for a link) and `IconButton` (needs `aria-label`). Where an element cannot be one,
  `buttonClass(variant, size, layout)`.
- **Fields**: `Input`, `Textarea`, `SearchInput`, `PasswordInput`, wrapped in `Field` (label,
  aside, hint or error wired by id); or `fieldClass({ invalid, icon, size })` on a native input.
- **`Select`** (own listbox, never a native `<select>`), **`Switch`** (slanted; say the state in
  words beside it), **`Checkbox`**, **`ChoiceCards`** / `choiceClass`.
- **`Tabs`** (slanted line, roving tabindex; the panel is the caller's, `tabIds`),
  **`SegmentedControl`** (sliding slanted pill), **`Pill`** / `pillClass` for filter chips.
- `className` on them is for layout only (margin, width, flex), never colours.
- **The look lives in tokens** in `globals.css` (`--slant-*`, `--r-*`, `--h-*`, `--motion-*`,
  `--hardcore`/`--softcore`), defined once for every theme (`designTokens.test.ts`): a future
  site-wide design changes them, not the components.
- **Loading**: `Skeleton` (`ui/Skeleton.tsx`: `radius` from the tokens, colour `bg-skeleton`, pulse, still under reduced motion, always hidden), `SkeletonRow` / `SkeletonGameList`, `GameRowSkeleton`, `GameCardSkeleton`; an image's own placeholder uses `SKELETON_PULSE`. **Each screen and view has its own composed skeleton, on the real boxes and gutters** (2026-10-31, #70): a new screen, section or fetch brings its own in the same change, and a figure on its way is `loading` on `StatPill` / `StatCard` / `PlatformStat`, never a `—`. The guard refuses a hand-made `animate-pulse`; only `StatusBadge`'s glow is exempt. Spinners stay for actions (inside a button), not for content. **The home's profile skeleton takes the height the real one had last time** (`homeFit` keeps it, `HOME_PROFILE_KEY`): that height sets the top of the home, and a fixed guess made the skeleton taller than the page (2026-11-01). **With profile tabs the home's profile column keeps one height (`min-height`, globals.css, the tallest platform's):** that height sets `--home-fit-trim`, so a shorter profile resized the charts and the heatmap on every switch (2026-11-01). **A chart in a skeleton is the real chart with `isLoading`**, never a second drawing of it. **`(home)/loading.tsx` also renders signed out, without `MainProviders`**: a skeleton there reads `useOptionalMainView`, never a context that throws. **A section lands whole (the user's preference, 2026-10-31):** the home's Friends and both Following lists hold their skeleton until `detailsLoading` is false, even if that takes longer; no row pops in or re-sorts, and a failed read still ends the wait. Do not add a timeout or a progressive reveal without asking. **A skeleton draws every variant and `<html>` picks one**, so a full load paints the right one before React can read a preference: `data-home-layout`, `data-library-layout` and `data-session` (`in` or `tabs`, nothing signed out; `sessionLook`, no account data) are set by `LOOK_SCRIPT` before the first frame, then kept by `ShapeSync`, and read in `globals.css` (`.if-*`, `.home-if-*`). A block sized by the person's data is a `RememberedHeight` (`ui/`): it keeps in this browser how tall it ended up and holds that room while it loads; the first visit has nothing to go by.
- **Dialogs**: `Modal` (head with icon, title and hint; `footer`; `tone="danger"` is an
  `alertdialog`; sizes `sm`–`xl`; a sheet on phones; Escape, outside click, focus kept inside and
  given back; only the top dialog answers Escape). `CommonModal` is a thin wrapper over it (no
  corner close by default). A modal names itself by its first heading, or `aria-label` /
  `aria-labelledby`.
- **Feedback**: `Notice` (tinted inline notice, `role="alert"` for errors), `TOOLTIP_SURFACE`
  (`ui/tooltip.ts`), `MENU_SURFACE` / `menuItemClass` (`ui/menu.ts`); the toasts are the dark card.
- **Surfaces and data**: `SURFACE` (`ui/surface.ts`; cards use `rounded-card`), `StatPill`'s
  large size has no box, `RarityBadge` (a tinted figure, never a bar), `ProgressBar` bevelled and
  glowing only when finished, `GameCardBackdrop` = a flat tint of the game's colour behind the
  same neutral hairline as a flat card (`useImageTint`; never the blurred art again, the user's
  choice). The art is read through
  `/api/image-proxy` (only the platforms' image hosts, images only, 3 MB, a week's cache) so a canvas
  may read it; do not widen its host list to anything a user can type (it would be an open proxy).
- **Colours with a meaning come from the theme**: danger, success, warning, `hardcore`,
  `softcore`; the guard refuses red / green / yellow / amber / orange palette classes. Tier and
  platform hues are the exception.
- **Streaks are in the accent**; amber (`warning`) only in the streak page's hero.
- **Fonts:** Barlow + Barlow Condensed is the default pair; Sofia Sans and Fira Sans are optional
  preferences, each with its condensed italic display face. All six are loaded in the root layout
  (`src/lib/fonts.ts`); only Barlow preloads. A page title, a big figure or a rank is
  `font-display italic`.
- **Numbers a reader sees are in their language:** `toLocaleString(lang)`, `decimal(n, lang)` for a
  fixed count of decimals, `formatRarity(pct, lang)`; never `toFixed` on screen ("0,8", not "0.8").
- **A game page's top is `GameHero`** (chips, title, facts, actions, tiles, media) and its tables use
  `ui/dataTable.ts` and `AchievementTableToolbar`; the four platforms share them.
- **The home layout is the person's choice** (`useHomeLayout`, synced key `home-layout`):
  `classic` (default) or `cover` (`MainPagePortada`, the game played last in big on top). It is in
  Preferences → General and in the welcome's preferences step.
- **The cover's art** (source order in `HomeHero.art`, `src/utils/homeHero.ts`) shows only once it has loaded
  and been judged for its box (`artVerdict`: at most 2× stretch, aspect 8:7 to 4:1). Each source is tried once;
  if none fits, the first too small for the box is the background anyway. **The big cover is never just a box
  art while a wide picture exists (the user's call, 2026-10-31):** the poster is for a game with no wide picture
  at all, or only portrait ones, then the game's colour alone. Xbox and RA take IGDB's first (`heroUrl`, `coverUrl`
  in `/api/xbox/details` and `/api/getGameArt`); RA then its own screenshots and box art, Xbox its tile. Hacks and
  subsets never ask IGDB (`igdbRaArt`). **IGDB pictures go through `pictureUrl`**: `t_1080p` stretches a
  smaller original (measured 2026-10-31), which hides a blurred picture from that check.

## Progress bars — in the theme's colours

Every progress bar is `ProgressBar` (`src/components/ui/ProgressBar.tsx`) or
`CircularProgress`: the theme's `--progress` (its accent), RA softcore a darker
step of it (`bg-progress-soft`) under hardcore. A finished bar stays in the
theme's colour and glows (only a finished bar glows; its ends are cut on the design's slant);
**the green is only in the percentage beside it**
(`text-success` at 100%), never on the bar — the user tried a green ring and
did not like it. Do not paint a bar in a platform's colour; those stay only in
charts that compare platforms (CompletionDistribution, the line
chart).

## AI export (`src/utils/aiExport.ts`)

The "Ask an AI" button on the three game pages builds a file for a chat AI:
English instructions plus "Reply in <language>", pending in game order,
earned oldest first. **Never put account data in it** (username, ids, keys):
only the game and its achievements. The UI says so. Change the prompt there,
with its tests; it is the part that decides whether the answers are any good.

## API calls — error handling MANDATORY
Every API call added or modified must have its own error handling. No exceptions.

- `fetch` calls: check `response.ok`, handle non-2xx explicitly
- Catch network/unexpected errors with `try/catch`
- Set appropriate error state so the UI can reflect failure (error message, empty state, retry)
- Do not let errors propagate silently or swallow them with empty catch blocks
- API route handlers (`route.ts`): always return structured error responses with correct HTTP status codes

## Testing — MANDATORY
Every new feature, hook, or utility must include tests. Tests live alongside the code they cover.

- Hooks: test with `renderHook` from `@testing-library/react`
- Components: test with `@testing-library/react` — cover render, interactions, edge cases
- Utils: plain unit tests (input → output)
- API routes: test happy path + error cases
- Run `npm test` before marking any task done
- Do not leave untested code — if it's complex enough to extract, it's complex enough to test

## Documentation — MANDATORY (every session and agent)

The next agent starts with no memory of this one. What is not written down is
lost. Index of the docs: `docs/README.md`.

- **Start of a session:** read the top entries of `docs/worklog.md` to pick up
  what was done last, what was decided, and what was left open.
- **End of every task that changes the repo** (code, config, migrations, docs):
  add an entry at the top of `docs/worklog.md` — did / why / decisions / open /
  watch out, as its template says. It goes in the same branch and PR as the work,
  before the last commit. A task is not done without it.
- **The worklog never conflicts**: `.gitattributes` merges `docs/worklog.md` with
  git's `union` driver (both sides kept). Do not remove it. After a merge, glance
  at the top entries: a `---` between two may be missing.
- **A rule or invariant changed or was learned** (a "never do X", how a
  platform must be called, a new env var, a migration that must run, a release
  gate) → update the matching section of this file in the same change. Do not
  leave a section that says the opposite of the code.
- **The layout changed** (new folder, route area, cache, data path) → update
  `docs/architecture.md`.
- **User-visible features, setup or env vars changed** → update `README.md`
  (and `.env.example` for a variable).
- Write for someone who has not seen the conversation: name files, say why,
  give absolute dates (not "yesterday"). No secrets, keys or user data in any doc.
- If the user said not to, or the task touched nothing, skip it and say so.

## Non-negotiable standards (apply to ALL work)

### 1. Responsive
Mobile-first. Tailwind sm/md/lg prefixes. No fixed widths that break mobile.

### 2. Accessible (WCAG 2.1)
- Interactive = `<button>` or `<a>`, never `<div onClick>`
- Icon-only buttons → `aria-label`
- Decorative icons → `aria-hidden="true"`
- Inputs → `<label htmlFor>` + `id`
- Toggles → `role="switch"` + `aria-checked`
- Errors → `role="alert"`, success → `role="status"`
- Selected states must not rely on color alone

### 3. i18n
- All user-facing strings via `T.*` from `useLanguage()` hook
- **Gender-neutral wording** in every language: nothing that assumes the reader's gender
  ("Bienvenido", "Bem-vindo", "Benvenuto", a Polish "zostawiłeś"…). Say "Hola", "Esta es tu
  bóveda", or rephrase (the user's rule, 2026-10-22). The opt-in gender is for others' profiles,
  not for addressing the reader.
- New strings → add to both `src/translations/en.ts` and `src/translations/es.ts`
- Admin panel exempt

## Versioning

Single source of truth: `src/lib/version.ts` → `APP_VERSION`.

**Scheme (semver):**
- `x.0.0` — major: huge integrations or platform shifts (e.g. Steam)
- `0.x.0` — minor: new pages, sections, significant feature changes
- `0.0.x` — patch: small fixes, optimizations, tweaks

**Pre-release suffixes** (optional, for WIP features):
- `0.9.0-beta` — feature in progress
- `0.9.0-rc.1` — release candidate, near-final

**Auto-bump via git hook (`.githooks/pre-commit`):**
- Every commit auto-bumps patch (`0.8.0` → `0.8.1`)
- To do a minor/major bump: edit `src/lib/version.ts` manually before committing — hook detects the change, skips auto-bump, and syncs `package.json`
- Hook is activated via `npm run prepare` (already wired in `package.json`)
- Two branches never conflict on the version: see "Environments" in Git below

**Milestones:**
- `0.8.x` — login/register polish + optimizations
- `0.9.x` — stats page reorganization, Steam, email, analytics
- `1.0.0` — released 2026-10-02: Steam integration, every release gate below
  closed, privacy policy and account deletion
- `1.x.0` — new sections (see Roadmap); `1.x.y` — fixes
- `1.3.0` — a loading state on every route (its own skeleton, and a thin line
  along the top while a page is on its way) and the functions in `fra1`, next
  to the database. Never reached `main` on its own; it shipped inside 1.4.0
- `1.4.0` — released to `main` 2026-10-14: public profiles rebuilt
  (hero with tabs, opt-in gender, open and compare a user's game), follows and
  the Following section, theme accents reworked, "Ask an AI" export, internal
  docs and the PR description check
- `1.5.0` — current on `develop` (not yet on `main`): Xbox through OpenXBL, 1:1 with
  PSN but **admin-only** (see the Xbox section), a preference per platform to choose
  which consoles show, preferences that follow the account (`migrations/033`–`036`),
  account preferences in tabs, the library layout remembered, total play time, and
  a stricter reading of private profiles and refused keys on every platform. On
  `improvements_10`: `migrations/037_pinned_achievements_position.sql` (order of
  pinned achievements), applied 2026-10-17; any other database needs it before that
  code runs, or every pins read answers 500. On `feat/social-rankings` (split out of
  `improvements_11` on 2026-10-20):
  `migrations/038_user_presence.sql` (presence), applied 2026-10-19; same warning,
  but worse: without it every signed-in request fails (see Presence). And
  `migrations/039_showcase_achievements.sql` (the achievement showcase), applied
  2026-10-20; without it the showcase, the follows overview and Following answer 500
- `1.6.0` — on `feat/social-rankings`: the Following restyle, presence and the showcase
  (038, 039 above) and the **rankings, a beta** (Vault Points, see below), with
  `migrations/040_vault_points.sql`, applied 2026-10-20; any other database needs it before
  this code runs, or the rankings, the header's level and the score refresh answer 500
  (Following and profiles still load, without levels)

## Release gates — what had to be true before 1.0 (all closed)

All of these have been closed since 1.0.0 (2026-10-02). **Warn the user,
unprompted, if one stops being true** (a variable removed from Vercel, the
domain unverified in Resend) while they talk about a release or 'going live'.
They asked for this reminder on purpose, because it is easy to forget.

- [x] **`cheevovault.com` verified in Resend, with `EMAIL_FROM` set on it**
      (2026-10-02). Password recovery reaches every user, not only the Resend
      account owner.
- [x] `NEXTAUTH_URL` set to `https://www.cheevovault.com` in Vercel. **www, not
      the apex**: the apex 308-redirects to www, so that is the host visitors
      are on. Reset links are built from it, and NextAuth compares it against
      the real host when signing in.
- [x] `migrations/018_unique_username_email.sql` run (2026-10-02). Two
      sign-ups racing each other can no longer take the same username or
      address, in any case.
- [x] `NEXT_PUBLIC_CONTACT_EMAIL` set in Vercel (2026-10-02). `/privacy`
      shows it, with the data controller from `src/lib/siteUrl.ts`, as the
      address for data requests; the GDPR wants both on a public site.
- [x] Email verification decided: shipped, soft. A banner on the account page
      for an unconfirmed address, with a resend button. Nothing is ever
      blocked — not sign-in, not a feature. See Email below.
- [x] `migrations/011_drop_sourceless_game_keys.sql` run (2026-09-28). The
      sourceless unique keys are gone, so an RA game and a Steam app with the
      same number can both be pinned and both sit in one group. Code older
      than the Steam work can no longer pin against this database: its
      `ON CONFLICT (…, game_id)` has no constraint left to name.

## Email — read before touching anything that sends one

Password recovery goes out through Resend (`src/lib/email.ts`, REST API, no SDK).
How far it reaches depends only on the environment:

- **No `RESEND_API_KEY`** → `emailConfigured()` is false, `POST /api/auth/forgotPassword`
  returns `503 { error: 'email-not-configured' }`, and the UI tells the user plainly.
  **Do not "fix" this by pretending the mail was sent.**
- **Key only** → sends from Resend's shared address, which delivers **only to the
  Resend account owner**. That is the state until `cheevovault.com` is verified
  in Resend, which is DNS and dashboard work, not code.
- **Key + `EMAIL_FROM` on a verified domain** → reaches everyone. Configuration
  only; no code change.

Other things to keep true:

- Reset links are built from `NEXTAUTH_URL`.
- Tokens: random 32 bytes, only their SHA-256 stored, one hour, single use
  (`src/lib/passwordReset.ts`, table from `migrations/016_password_resets.sql`).
- `/api/auth/forgotPassword` answers the same whether or not the address has an
  account. Keep it that way: it is what stops the endpoint being used to find users.
- Never add a second mail provider or an SMTP fallback without asking.

### Email verification (soft, and it stays soft)

A link goes out on sign-up and can be resent from the account page. Following
it sets `users.email_verified_at` (`migrations/017_email_verification.sql`).

- **Nothing is ever gated on it.** Sign-in, RA, Steam, groups — all work with an
  unconfirmed address. The only effect is a banner
  (`email-verification-notice/EmailVerificationNotice.tsx`). Do not add a check
  that blocks a feature on `emailVerified` without asking: the point of the
  address is recovery, and locking someone out of an achievement tracker over a
  mail that landed in spam costs more than it saves.
- Tokens are **signed, not stored** (`src/lib/emailVerification.ts`): verifying
  is idempotent, so there is nothing to spend. They last a week, and carry the
  address, so a link dies when the account's email changes.
- `POST /api/auth/resendVerification` mails the address **on the account**,
  never one from the request body, and is rate limited like the reset flow.
- The session exposes `emailVerified`; the column is read in
  `src/lib/userRecord.ts`, so it follows the same fresh-from-the-row rule as
  everything else in Sessions.

## Sessions — read before touching auth

- The session is rebuilt from the `users` row on every read (`jwt` callback in
  `src/lib/authOptions.ts`, cached ~60 s per instance in `src/lib/userRecord.ts`).
  **Never copy data from `update()`'s payload into the token**: the browser
  controls it. To change a session field, save it in the DB, then call `update()`
  with no arguments.
- Changing the password (hash) ends every session, this one included. A deleted
  user's session ends too.
- The RA API key (`raid`) is server-only: `getServerSession(authOptions)` has it,
  the browser's session (`authHandlerOptions`) does not. Client code uses `raLinked`.
- **Do not hand the session to a second `SessionProvider`** (2026-10-31): next-auth keeps module-level state, so a nested
  one leaves the root's reading `unauthenticated`, and the root layout must not read the session (see Language). A page whose
  shape depends on the session holds its skeleton while `status === 'loading' && !session`, as the home and `/user` do.
  `getServerSession(authOptions)` carries `raid`: never pass that object to a client component.
- Admin checks read the DB (`loadUser(id, { fresh: true })`), not the session.
  See Admin panel below for the rest.
- Sign-in, current-password checks, sign-up and reset requests are rate limited
  in the DB (`src/lib/attemptLimit.ts`). Password rules: `PASSWORD_MIN` and
  `BCRYPT_COST` in `src/utils/authValidation.ts`.
- Changing the email asks for the current password; it is the recovery address.
  It also clears `email_verified_at` and mails a link to the new address.
- Deleting the account (`DELETE /api/account`, from the account page) asks for
  the current password too, and refuses to remove the last admin. Everything
  the user owns cascades from the `users` row.

## Admin panel — read before touching `/api/admin/*`

Everything lives in `src/lib/adminAuth.ts`; every admin route starts with
`requireAdmin(req)`.

- **Two locks.** The admin flag is read fresh from the DB, and the panel must be
  **unlocked with the admin's own password and a one-time code** (`POST /api/admin/unlock`,
  `src/lib/adminTotp.ts`, `migrations/044_admin_totp.sql`, applied to pre 2026-10-31; any other database
  needs it first, or the unlock answers 500).
  An admin with no authenticator enrols on their next unlock, after the password. Recovery codes are
  shown once and stored hashed. Lost both: `DELETE FROM admin_totp WHERE user_id = <id>`. The
  unlock is a signed, httpOnly cookie scoped to `/api/admin`, valid 15 minutes,
  bound to the admin and to their password hash (a password change ends it).
  Without it the endpoints answer `403 reauth-required` and the panel shows the
  password form, so a stolen or unattended session reads no one's data.
  Do not add an admin endpoint that skips `requireAdmin(req)`.
- **Everything is logged** in `admin_actions` (`migrations/020_admin_actions.sql`,
  run 2026-10-02): who, what, to whom, when, with names copied in. Kept a year.
  New admin actions must call `logAdminAction`. Readable from the panel.
- **Changing an email notifies the old address** (`src/lib/emailChangedNotice.ts`),
  whether the user or an admin did it. It is what stops a quiet takeover: change
  the address, then reset the password.
- Admins can create users (for odd cases; sign-up is open), edit, delete, and
  link/unlink RA (checked against RA with the user's key) and Steam (checked to
  exist through the Steam API). Neither proves ownership (users now link Steam
  through Steam, which does), so the log records who linked what.
- The privacy policy (`/privacy`) says all of this; `/terms` says when an
  account may be suspended or deleted. Change the policy if the panel changes.

## RetroAchievements (RA) — read before touching its calls

- **The cache already lives in Postgres.** `withCache` (`src/lib/raCache.ts`)
  keeps memory as a first level and `steam_cache` as the second, under `ra:`
  keys, so a cold start or another instance does not ask RA again. Skipped in
  development, where memory is cleared on purpose. Bump a key's `_vN` when the
  shape of what it returns changes.
- **A 429 waits.** `fetchRA` honours `Retry-After` up to `MAX_RETRY_AFTER`
  (5 s) and retries; a longer ask is thrown. Other 4xx are never retried.
- **Keys are sealed at rest** (`src/lib/raKey.ts`, `migrations/043_ra_key_sealed.sql`, applied to pre
  2026-10-31; any other database needs it first, or linking answers 500; reads still work). `users.raid` is read through `readRaKey`, never directly: a key from
  before sealing reads as it is, until it is linked again. `raid_hash` keeps one key to one account.
  Changing `NEXTAUTH_SECRET` makes every key unreadable and everyone links RA again.
- **Whose key.** Never a shared app key (see the roadmap). On the user's own
  page the call uses their `raid`; `requireViewerApiKey` never falls back to
  another key. On someone else's page `dataOwner` (`src/lib/apiAuth.ts`) signs
  with the **viewer's** key when they have one, and otherwise with the **page
  owner's**, so a viewer with no RA account still sees it. That last case
  spends one user's key on other people's visits; it is an open question for RA,
  not something settled. `raid` stays server-only either way.
- The user search (`/api/users/search`) only reads our database; it never calls RA.

## Xbox (OpenXBL) — admin-only for now, read before touching it

Read through OpenXBL (xbl.io, an unofficial proxy over Xbox Live), all in
`src/lib/xboxClient.ts`. It is a 1:1 of PSN's integration (link by gamertag,
summary, library and categories, `/xboxGame/[id]`, feeds, pins, favorites,
groups, collection, friends, public profiles, admin linking) **but only admins
see or use it**. Migrations 033–035 (xbox columns, `'xbox'` game source, pinned
achievements) were applied 2026-10-15. Plan and measured findings:
`docs/xbox-integration-plan.md`.

- **Xbox stays admin-only on purpose (decided 2026-10-16), and the reason is money.**
  OpenXBL's free plan is 150 calls an hour for the whole app, and one new user costs
  ~4 calls (library, play time, summary, the first game's achievements) plus 2 per
  Xbox 360 game opened. The user does not want to pay for a plan yet, so **do not set
  `XBOX_ADMIN_ONLY` to `false`, and do not suggest it as a next step**, until they
  say they will pay for a plan (or accept limiting cold loads). When it does open:
  upgrade the plan, then update the landing text, site title and meta description
  (they still list three platforms), the public pages and landing FAQ (see Public
  pages) and the terms.
- **The gate is one switch**: `XBOX_ADMIN_ONLY` in `src/utils/xboxAccess.ts`
  (`canUseXbox(admin)`, `sourceAllowed(source, admin)`). To open Xbox to everyone,
  set it to `false`; nothing else needs to change. It is enforced in three
  places and all three must keep holding: the routes (`requireXboxUser` /
  `requireXboxSession` answer 401/403; every pin, hide, favorite, group and
  order route calls `sourceAllowed`), the UI (`useXboxEnabled`), and the paths
  that show *other* people's data (public profile, follows, search, groups,
  favorites) which drop Xbox rows and fields for a non-admin viewer. A new
  place that lists games or accounts must filter Xbox the same way.
- `users.xboxxuid`/`xboxgamertag` are in the session (`xboxxuid`); users link by
  typing a gamertag, which nothing proves is theirs (like PSN), so no uniqueness.
- Secret achievements stay concealed until the viewer reveals them
  (`useRevealedAchievements`); the Ask-an-AI export uses gamerscore.

- **One app key, not the user's** (`OPENXBL_API_KEY`, server-only, never
  `NEXT_PUBLIC_`), like PSN's NPSSO. Without it the routes answer
  `503 not-configured`; a refused key answers `503 unauthorized`.
- **150 calls an hour for the whole app** on the free plan. Everything is cached
  in `steam_cache` under `xbox:` keys. The ~3-call figure covers only search,
  library and one game's achievements, not a home with activity/year scans.
  `xboxCall` also enforces a PostgreSQL-backed 150-attempt hourly budget per
  environment: refused attempts are removed and a database failure refuses the
  call. OpenXBL headers remain authoritative across environments sharing the key.
  Bump a key's `_vN` when its value's shape changes.
- **OpenXBL answers errors with HTTP 200** and the real status in the body
  (`{ code: 400 }`): `xboxCall` checks both. It also refuses
  `Accept-Language: *`, which Node's fetch sends by default, so a language is
  always sent.
- **Data shape:** gamerscore, not trophy grades; no DLC groups. Newer games report
  `totalAchievements: 0` while their gamerscore total is real, so progress goes
  by gamerscore and the achievement total may be `null`. Xbox 360 games use
  another endpoint and shape (`is360`: Xbox's `mediaItemType` is `Xbox360Game`
  or `XboxArcadeGame`; **not** "devices is only Xbox 360", because backward-
  compatible games list newer consoles too and the modern endpoint answers them
  with no achievements), and take **two calls**: the title's whole
  list (`achievements/player/{xuid}/title/{titleId}`, all locked) and what the
  account unlocked (`achievements/x360/…`), joined by `merge360Achievements`
  (measured 2026-10-15; the x360 one alone lists only the unlocked). If a list
  still comes up short, `XboxPartialListNote` says so. Their icons are not URLs: they are built from `titleId`
  and `imageId` in hex (`xbox360Icon`).
- **Image hosts:** `images-eds.xboxlive.com` and `image.xboxlive.com` have no
  certificate for https; `xboxMappers.https()` swaps them for the `-ssl` twins.
  Keep every Xbox image going through it. `titleId` is a decimal string; the largest
  seen is under 2^31 (the `game_id` columns are INTEGER), but check before storing it.
- **Play time** comes from one `POST player/stats` (`MinutesPlayed`, up to 150
  titles per call) made inside the cached library load (`xbox:titles:v7`); a
  backward-compatible 360 game is asked under its `modernTitleId`
  (`xboxStatsTitleId`). A failure leaves the library whole, without hours, and
  `playtimeComplete: false` keeps `X-Xbox-Partial: playtime` on later cache hits.
  Many games simply have none.
- **Twin titles:** Xbox can list a game twice under one name, the game and a title with no
  achievements that launches it (Minecraft: Xbox 360 Edition, measured 2026-10-21).
  `foldTwinTitles` drops the empty twin in the library load and gives its session and play time
  to the game; a game with no achievements and no twin stays.
- **Backdrop:** a game page's wide picture is IGDB's (`heroUrl` in
  `/api/xbox/details`), fetched when the page opens. The library's shelf cards
  (`LibraryShelfBanner`) ask for the same, one card at a time as RA's screenshots,
  so at most a shelf's worth (`SHELF_CAP`); until it arrives, or with no match, they
  show the blurred tile. Lists and icons keep Xbox's own tile.
  Do not enrich the whole library from IGDB at load (135 searches).
- **Measured 2026-10-16:** an unknown gamertag answers HTTP 200 with `code: 404` in
  the body (→ `not-found`). A library the viewer cannot read answers like a
  nonexistent xuid, `titles: []` with **no `achievementSummary`**, while a public
  account with no games has the summary: that is how `xboxLibraryData` tells
  `private` from empty. A public non-friend's library and achievements read fine
  (one was 1000 titles, 1 MB), so play time is only asked for the 300 most recently
  played games.
- `/privacy` says what Xbox keeps and who receives it (gamertag, XUID, OpenXBL, Microsoft)
  in all 9 languages; the landing text, site title and meta description still say
  "RetroAchievements, Steam and PlayStation" on purpose: change them when Xbox opens to everyone.
- Admin explorer lookups and linking are logged (`xbox-lookup`, `link-xbox`,
  `unlink-xbox`). Do not add a second Xbox provider without asking.
- **Quota/failure hardening (2026-10-30, #87):** `xboxCall` has a 5 s timeout
  (504 `timeout`), a per-instance 429 cooldown and feed scans stop scheduling
  games on 429. `steam_cache` can serve the last success stale only for
  `failed`/`timeout`/`rate-limited`, never for private/not-found/disabled keys;
  nested stale is never rewritten fresh and in-flight/backoff callers recheck
  their own failure policy. Expired Xbox successes stay 30 days. Responses and
  logs use `xboxTelemetry.ts`: sanitized operations, request ids, real upstream
  counts, cache outcomes, `X-Xbox-Stale` and `X-Xbox-Partial`, never XUIDs or
  gamertags. Assembled feeds are `xbox:feed:v2:`; home derives 60-day Xbox
  activity from the shared year instead of requesting it twice. Following reads
  one detailed friend at a time and Xbox score reads two games per pass. Full
  contract: `docs/87-xbox-quota-hardening-spec.md`.

## PlayStation (PSN) — read before touching it

Read through `psn-api` (Sony's unofficial mobile API), all in `src/lib/psnClient.ts`.

- **One app account, not the user's.** Every call is made as the PSN account
  whose NPSSO the app holds; it can read any profile with public trophies.
  Users link by typing their online ID — nothing proves it is theirs, so
  `psnaccountid` is deliberately **not unique** (a squatter must not lock the
  owner out). `/privacy` and `/terms` say so.
- **The NPSSO dies 60 days after sign-in, and nothing extends it** (measured:
  refreshing returns the same 10-day refresh token; psn-api issue #171; Sony's
  sign-in has a captcha). It lives encrypted in `psn_credentials`
  (`migrations/026`, `src/lib/psnCredentials.ts`, `secretBox`), is renewed by
  pasting a new one in the admin panel, and `/api/cron/psnToken` mails the
  admins from 7 days before. `PSN_NPSSO` only seeds the first setup.
  **Do not** try to automate Sony's sign-in.
- **Games are keyed like RA and Steam**: source `'psn'`, and the trophy set's
  number as id (`NPWR20188_00` ↔ `2018800`, `psnNumericId`/`psnTitleId`).
- **A game counts by its whole set, DLC included**, as Sony's own title list
  does: a platinum with DLC trophies still to earn is "in progress", not
  "completed". (It used to count by the `default` group alone; it no longer
  does, and no per-game lookup of the groups is made for the list.)
- **Icons: the store's, not the trophy set's.** A PS4/PS3 trophy icon is a 320×176
  banner (PS5's are square); the played-games `imageUrl` is square on PS4 too, so it
  wins (`withPlayData`), except for a collection's games. The cover is only a
  `PORTRAIT_BANNER`; PS4's 16:9 hub art is a backdrop. `GameIcon` letterboxes PSN
  (no blurred fill: the user tried it and preferred plain bands).
- **A collection is one played game for several trophy sets** (Ezio Collection →
  AC II, Brotherhood), and Sony does not say which was played: its session goes only
  to the set with the newest trophy, or every game in it shows as just played. Its
  hours stay on each (the total counts them once, by `playedAs`). Each game carries
  its `collection` (the played game's id, name, icon, session, hours), and the recent
  feed folds a collection with 2+ games in the list into one card
  (`psnFeed` in `steamFeed.ts`, `PsnCollectionItem`). Opened, it is laid out like an
  opened game (`PsnCollectionExpanded`): ring, chart and rarest count the whole
  collection, and each game is a fold of trophies, as DLC are. Only the feed folds:
  stats, library, pins, pages and "completed" stay per trophy set (user's choice).
  A game of the collection never started has no trophy list, so Sony lists it nowhere.
- **Two lists, merged**: the trophy list (`getUserTitles`) and the played-games
  list (play time, last session, store art, PS4/PS5 only, its own privacy
  setting). `lastTrophyAt` is the trophy list's date and keys every trophy
  cache; `lastPlayed` is the last session when known.
- **Caches** live in `steam_cache` under `psn:` keys. When the shape of a
  cached value changes, bump its key's version (`psn:titles:vN`) in the same
  change — a dev server will otherwise serve the old shape.
- **PS3/Vita games** have no play data and no Store page: their cover,
  backdrop and release year come from IGDB (`src/lib/igdbClient.ts`, a Twitch
  app in `TWITCH_CLIENT_ID`/`TWITCH_CLIENT_SECRET`), matched by title and
  platform, cached half a year. Without the keys they keep the trophy icon.
  Every PSN game page also asks IGDB for its summary, studios, genres and
  screenshots (`igdbDetails`, `GET /api/psn/details?id=`, keyed by Sony's
  title from the user's list, never by text from the request). English only;
  a 404 just means the page goes without them.
- Sony returns errors as bodies, not throws: every call goes through
  `psnCall()` (`unwrap()` plus one retry after 2 s when Sony says "too many
  requests" — psn-api hides the HTTP status and `Retry-After`, so it goes by
  the message). `psnFailure()` maps them to 503 / 403 (private) / 429 (rate
  limited, with `Retry-After: 60`) / 502. The client reads a 429 as a plain
  failure with a retry button.

## Performance rules — keep these true (audited 2026-10-16)

- **Nothing the first paint needs waits for JavaScript (audit v1.7, 2026-10-30).** No Framer `initial`
  with opacity 0 on what a visitor reads first; use CSS keyframes, or `AnimatePresence initial={false}`.
  That one change took the landing's LCP from 12.8 s to 1.4 s under the audit's throttling.
- **Code the browser loads must not reach `pg`.** `steamClient` and `fetchRA` are server code; picture
  and page URLs live in `steamAssets.ts` (pure). Reaching the database from something a client imports
  breaks the build even through a dynamic import.
- **Every call to a platform has a deadline shorter than the client's 20 s** (two 8 s attempts on RA
  and Steam, 8 s per PSN call through `psnCall`, since `psn-api` takes no signal). RA keeps its measured
  pace per key in `fetchRA`; every Sony call spends the app's `psn-upstream` budget and a refusal
  cools the instance down a minute. `countUpstream` counts calls per day; Steam fills wait at 85 % of its
  100,000 a day (`steamBudgetLow`).
- **Guarded work counts first:** `reserveAttempt` before a password check, not `isLimited` then
  `recordAttempt`: a burst passes those together (30 of 30 past a limit of 10, measured).
- **What a user stores has an end:** a length on text, a row cap, one `unnest` statement for an order.
- **Cross-site writes stop in `src/proxy.ts`**, whose matcher takes `/api` only when the request carries
  `Origin`, so same-origin reads never pay for it.

- **recharts is only loaded through the lazy plots** (`AchievementsLinePlot`,
  `GameAchievementsProgressPlot`, via `next/dynamic`). Their `loading` and the chart's data state are the same
  `ChartSkeleton`, or the reader sees a second skeleton between them. Never import `recharts` in
  a component that is part of a page's first render: it is ~390 KB.
- **A modal is a `next/dynamic` import wrapped in `LazyWhenOpened`**, so it is
  downloaded the first time it opens and stays mounted after (its exit animation
  plays). Do not import a modal statically into a page or the header.
  (A test waits for such a modal with `findBy…`; `__mocks__/next/dynamic.js`.)
  **Always pass `{ loading: () => null }`** (or a real fallback): without `loading`,
  `next/dynamic` adds no Suspense boundary, so the first download suspends up to the
  route's `loading.tsx` and the whole page flashes its skeleton (seen 2026-10-18).
  The jest mock always wraps one, so tests cannot catch it.
- **Several components asking for the same GET share one request while it is in
  flight**: `fetchWithRetry` does it for you; for a raw `fetch` of a GET use
  `fetchShared`. A shared answer is shared by reference: copy before changing it.
- **Steam's owned list is read through `loadOwnedGames`** (`src/lib/steamProgress.ts`, 5 min,
  shared): never call `getOwnedGames` from a route. A home page used to download it five times
  (2026-10-22). `scoreRefresh` keeps its own cache on purpose. "Recently played" is built from
  its `rtime_last_played`, not from `GetRecentlyPlayedGames` (two weeks only).
- **Steam library counts come in batches** (`fetchBatchCounts`, `GetTopAchievementsForGames`, 100
  games a call; 192 in 0.6 s measured 2026-10-22): only finished games are read one by one, for
  the date they were finished. The batch also answers for achievements Steam keeps private, so it
  is trusted only after one per-game read agrees they are public (`batchCountsFor`). Keep that probe.
- **Every Steam unlock read is kept** in `steam_unlocks` (`migrations/042_steam_unlocks.sql`,
  applied to pre and production 2026-10-22; any other database needs it, though without it they
  only log and nothing fails): `fetchPlayerAchievements` records them, so the score refresh (every played game)
  fills it. The streak and activity read the `maxGames` played last live and the rest of the
  window from the table, only for games the owned list still shows (a private profile shows none).
  Unlinking Steam (user or admin) deletes the rows; `/privacy` says they are kept until then.
- **Read routes that are expensive upstream send `cachedJson(data, ttl)`**
  (private, `Vary: Cookie`): the PSN and Xbox reads (5 min per game, 2 min for
  recent unlocks) as RA's and Steam's already did. Mutable data (groups, pins,
  preferences) never does.
- **A context value is memoized** when its provider reads the session (the session
  updates on every visit and would re-render every consumer).
- **A route group has an `error.tsx`** (`RouteError`), or its errors replace the
  whole app (`global-error`, which renders the same `RouteError` full screen).
  Its `Reintentar` calls Next's **`retry()`**, not `reset()`: `reset()` only
  re-renders, so a server error never recovers (measured 2026-10-18, Next 16.3).
  `(main)/not-found.tsx` takes a `notFound()` inside the app **and most URLs that
  match nothing** (`/foo` via `[category]`, even `/compare/x`); it reads the
  session on the server: signed in, under the header (a game page names its
  platform, Xbox only to whoever may see it); signed out, full screen. URLs of
  three or more segments reach it through `[category]/[consoleId]/[...missing]`
  (it cannot sit beside `[category]` or `[consoleId]`: Next refuses two dynamic
  names on one level). A game 404 answers HTTP 200: those routes stream (a
  `loading.tsx`, `notFound()` on the client), so the status is out first. The layout's
  `<main>` is a block: these screens size themselves (`STATUS_SCREEN`) and are a
  `<div>` inside it, a `<main>` only full screen.

## Presence — "online" and "last seen" (2026-10-19)

`users.last_seen_at` and `users.show_presence` (`migrations/038_user_presence.sql`,
applied 2026-10-19; **any other database needs it before this code runs**:
`userRecord` reads `show_presence` on every session, so without it every
signed-in request fails).

- **Written only by the heartbeat**: `usePresenceHeartbeat` posts to
  `/api/presence` while the tab is visible (arrival, every 2 min, back to the tab);
  the route writes at most once a minute. Do not write it from the session or
  another read path.
- **Online = seen in the last 5 minutes**, decided on the server. `lastSeenAt` is
  rounded down to 5 minutes: never send the exact time. Past 30 days it says only
  "over a month ago". **One rule, one place**: every query that shows it selects
  `presenceColumns()` (`src/lib/presence.ts`) — the follows overview, the user search
  and `findPublicUser` (the public profile).
- **`show_presence` is enforced in SQL** (on by default; the switch is in
  Preferences → General). Off: `online` false and `lastSeenAt` null, to everyone.
  Not reciprocal (hiding yours does not hide others'), by the user's choice.
- **Wherever another user's picture shows, so does it** (2026-10-20, the user's ask):
  `PresenceDot` on the picture (in a `relative` wrapper; `announce` when no text beside
  it says so) and, where there is a line for it, `PresenceLabel` in place of the bio
  (the bio is its fallback). Today: Following (cards, hero), user search and the home's
  friend cards (`UserSummary`), the public profile hero (not on your own), compare,
  someone's game page banner, the friends leaderboard and shared games. A new place
  that shows other users must do the same. Never for your own picture.
- `/privacy` says signed-in users who come across you see it; change it if that grows.
- **"Now playing" on Steam** (2026-10-22, the user's ask): `/api/follows/playing` asks Steam, one
  call per 100 accounts, cached a minute per viewer, for the people you follow who share their
  presence and have a public profile; `useFriendsData` merges it after the overview (which stays
  database-only, so cards never wait on Steam) and `PresenceLabel` shows it over "Online". Steam
  only says it for a public Steam profile. `/privacy` says followers see it.

## Vault Points and the rankings (beta, 2026-10-20)

One score worth the same on every platform, and rankings of it. Formula, balance tests and
decisions: `docs/rankings-plan.md`; layout: `docs/architecture.md` → Vault Points.

- **The formula lives in `src/utils/vaultScore.ts`**, and its balance tests
  (`vaultScore.test.ts`: the same game within ±10 % on every platform, easy games about a
  third of a demanding one) must keep passing. Change a number → bump `RULES_VERSION`.
  Do not weigh native values (gamerscore, grades, RA points) more than the 25 % they have:
  that is what made platforms unequal in the tests.
- **Scores are computed ahead, never on a read.** `scoreRefresh` runs right after a platform is
  linked (`onPlatformLinked` in the four link routes), in back-to-back passes while the user has
  the site open (`useVaultFill` → `POST /api/rankings/fill`, up to 90 s each), after the presence
  heartbeat (6 h freshness) and from `/api/cron/scores` (daily, plus the Monday snapshot). One
  pass at a time per user: every trigger claims `users.score_refreshed_at` first. The rankings
  routes only read `score_games`/`score_periods`; do not call a platform from them.
- **Each platform is read at the pace measured on 2026-10-20 (`PACE`), not faster:** Steam 8 at
  once (29 games/s, no error); RA one at a time, 300 ms apart (a burst of ~7 gets 429 **with no
  Retry-After**; one every 250 ms never failed); **PSN gently**, because it is one app account for
  everyone: 2 at once, 100 games a pass, and 300 games every 15 minutes for the whole app
  (`allowAttempt('psn-score', 'app')`), stopping the pass at Sony's "too many requests"; Xbox 5 a
  pass (150 calls an hour for the app). Raising any of these needs a new measurement.
- **The fill is shown, never silent.** Its progress per platform is kept in `steam_cache`
  (`score:fill:<user>`; `FillStatus`, no migration); the header, the account page, each platform's
  card (`VaultFillLine`) and the rankings show it, the viewer's own points carry "≈" until read, a
  finished fill toasts "ready" (only a fill that was pending, never a routine refresh) and a
  platform that failed says why (private profile, refused key) and how to fix it.
- **"How Vault Points work" (`/rankings/how`, public)** explains it to users. Its prose is in
  `src/translations/vaultGuide.ts` (+ `vaultGuideMore.ts`), in all nine languages but outside `T`
  like the public pages (only this page loads it); every number
  on it (rarity and difficulty tables, examples, level thresholds) is computed from the formula
  and the examples are the same ones the balance tests use (`src/utils/vaultExamples.ts`). If the
  formula changes, reread its prose.
- **Who is listed**: public profile and `show_in_rankings` (Preferences → General; not in the
  session on purpose, see the plan). Hidden games and unticked consoles do not score. A game
  counts only for the account linked now, never while flagged `suspect` (Steam unlock tool;
  admins review it in the panel, logged as `ranking-flag`). Xbox scores only for admins.
- **No ownership verification, by the user's choice (2026-10-20)**: an account linked by two
  users scores for both. The analysis of how to verify is in the plan, for later. Since
  2026-10-21 a user's Steam link is proven by Steam (one user per Steam account); PSN and
  Xbox, typed, are still unproven.
- **`/rankings` and `/rankings/how` are public** (`PUBLIC_PATHS` in the proxy, in the sitemap). Signed out: the
  global list only, no presence (the privacy policy promises it only to signed-in users).
  Responses never carry user ids and are never shared-cached.
- **A profile's public card (2026-10-20):** signed out, `/user/<name>` shows `ProfileTeaser` and
  its link preview (`opengraph-image.tsx`) shows the same, both from `profileTeaser` in
  `src/lib/rankings.ts`: **only what the rankings already show** (name, level, points per
  platform, games at 100 %, achievements), only for someone listed there, a 404 for anyone else.
  Never presence, never an uploaded picture (served to signed-in users only), and the preview
  never fetches a pasted avatar link (SSRF). The proxy opens `/user/<name>` and its image, not
  `/user` nor a game inside a profile. Adding anything to the card means changing `/privacy`.
- **A level shown for another user reads `vaultTotals`/`vaultTotalsOrNone`** (same rules as the
  rankings). Today: the rankings, Following cards, the home's friend cards, the public profile
  hero, the header (yours) and your account page. Progress towards a level is a `ProgressBar`
  or `CircularProgress` in the theme's colour; tiers have their own hue only on their badge.
- **Streaks in the rankings (2026-10-23)** are read from `score_games.unlocks` (UTC days, `streaksOf`),
  never from a platform: they lag the score refresh and may differ by a day from the streak page,
  which reads the live feed. `?sort=streak|best` orders by them (no arrows, no points gap in the zone).
- Rankings are labelled **Beta** in the UI; drop the label when the user says so.

## Follows: who you follow and who follows you (2026-10-20)

- **Both lists are yours alone.** `/following` has two tabs, "Following" and "Followers"
  (`#followers`, opened from the account page's counts); `GET /api/follows/overview?who=followers`
  answers only for the signed-in user. Nobody else is ever shown who follows whom: do not add a
  follower list or count to public profiles without asking. `/privacy` says so in all 9 languages
  (changed 2026-10-20 at the user's request; before, followers were a number only).
- **Public profiles only**, on both sides and in both counts (`/api/follows/count`): a private
  profile drops out of the lists until it is public again.

## Achievement showcase vs achievements to get (2026-10-20)

Two different things; do not mix them up again.

- **Showcase** ("Vitrina de logros"): up to **5 earned** achievements a user chooses to
  show off. Its own table, `showcase_achievements` (`migrations/039`), one shape for every
  platform (`achievement_key`: RA id, Steam apiname, PSN trophy id, Xbox id; text and
  badge copied in). `/api/showcase` (GET own or `?user=`, POST adds while < 5 and answers
  `409 showcase-full`, DELETE `?id=`, PUT order). Earned is the client's word plus a
  required `earnedAt` (`parseShowcaseEntry`). **It is what others see**: the public
  profile (`PublicUserAchievementShowcase`), Following cards and the home's friend cards
  (overview → `showcase`).
- **Achievements to get** ("Logros por conseguir", the old "Logros fijados"): the user's
  own goals, `pinned_achievements`, `/api/favorites`. **Private**: GET ignores `?user=`,
  and nothing shows them to anyone else. Do not add a place that does.
- Managed in the Pinned section (showcase block on top, `MainPagePinnedSectionShowcase`).
  Its "+" opens `ShowcasePickerModal`: the user's games with something earned
  (`useProfileLibrary`, those with an unlock this year first), then a game's achievements
  (`useShowcaseGameChoices`, through the routes its game page uses; earned first, the rest
  greyed, hidden unearned ones concealed), with a way back; the selection spans games and
  goes in at once (`addMany`), never more than fits. Also added from any earned
  achievement through `ShowcaseToggleButton` in `AchievementModal` (RA) and
  `AchievementDetailModal` (Steam, PSN, Xbox). One shared state: `ShowcaseProvider`.
- Unlocks carry `Key` (the platform's own id), so an unlock maps to a showcase entry
  (`showcaseFromUnlock`); RA uses `AchievementID`.

## Preferences that follow the account

The display preferences (which consoles show, library layout/view/columns/sort,
and the PSN/Xbox switches) are kept in the browser (`useStorageValue`) **and**
mirrored in `users.preferences` (`migrations/036_user_preferences.sql`, a jsonb of
short strings), so they follow the person between devices.

- **The list of keys is fixed in code** (`src/utils/syncedPreferences.ts`,
  `isSyncedKey`); `/api/preferences` refuses anything else whole. A device-bound
  value (language, cookie choice, the last tab, folded sections) stays in the
  browser. **To sync a new preference, add its key there**; nothing else.
- `usePreferencesSync` (mounted by `MainProviders`): on sign-in the account's values
  are applied to the browser (the account wins) and what only the browser has goes up
  once; then each change is sent after 800 ms. Changes made by the sync itself are not
  sent back (`applyStoredValue`). A failed save toasts; a failed read only logs.
- Not mounted on someone else's page, and never exposed on public profiles
  (`publicUser` selects explicit columns: keep it that way).

## How each platform fails — keep these distinct (audited 2026-10-16)

A person must be able to tell "nothing here" from "I cannot read it" from "try later".

| | Unknown account | Private / unreadable | Credential refused | Busy |
|---|---|---|---|---|
| **RA** | RA says 401 for a bad key, for any username | n/a (profiles are public) | `raUnavailable()` → `403 ra-key-invalid`, not retried; `RaKeyInvalidNotice` | 429 waits `Retry-After`, then 429 with `Retry-After`, not retried |
| **Steam** | link goes through Steam (no unknown account); ids that do not exist answer 400 | a private profile links; **after linking**, `{ response: {} }` → `ownedGames` answers `403 private` (not an empty library) and the list page says so | key is the app's | 429 with `Retry-After` (`steamFailure`), not retried |
| **PSN** | link: not found | `psnFailure` → 403 | NPSSO expiry, admin panel | 429 + `Retry-After: 60` |
| **Xbox** | `code: 404` in the body → `not-found` | no titles and no `achievementSummary` → `private` | app key: `503 unauthorized` | 429 |

An error that asking again will not fix must be a 4xx: the client retries 5xx
(`fetchWithRetry`, then `scheduleRetry`) and never a 4xx.

## Consoles to show — a preference per platform

The account page's preferences are in tabs (`UserPreferencesCard`): General, then
one per platform with its favourite game and its own choices; the tab last open
is remembered (`account-preferences-tab`). A new platform preference goes in its
platform's tab, not in a new card. RA, PSN and Xbox each have, in their tab, the list of
the consoles in the user's library with a tick each (`UserConsolesPreference`;
Steam has none). Unticked consoles leave the lists, collection and stats, and
nothing is deleted.

- Stored under `hidden-consoles:<source>` (`useHiddenConsoles`; in the browser and,
  see "Preferences that follow the account", on the account), as the *unticked* names, so a console that appears later starts shown.
- Applied **in the data contexts** (`GamesDataContext`, `PsnGamesDataContext`,
  `XboxGamesDataContext`): `library`/`all` is filtered, `fullLibrary` (PSN, Xbox)
  and `consoles` (the options) are not. **Anything that looks a game up by id**
  (its page, a pin, a group item) must use `fullLibrary`, or a game on an
  unticked console 404s.
- Only the viewer's **own** library: on someone else's page (`useSubject()`)
  nothing is filtered. A game is hidden only when **all** its consoles are
  unticked (`isConsoleShown`: "Xbox 360 · Xbox Series" stays with either ticked).
- **Feeds follow it too** (`useConsoleVisibility`: `isShown(unlock)` /
  `isGameShown(source, id)`): the year feed behind the streak, the heatmap and the
  charts, RA's recent unlocks, and the PSN/Xbox "latest" columns. So a day spent only
  on a hidden console is not a day in the streak. A **new feed of unlocks must
  filter through that hook**, or a hidden game comes back through it.

## Hidden games — a listing preference, never authorization (2026-10-31, #88)

- A hidden game is excluded from every listing and listing-derived aggregate, for its
  owner and on public/other-user views, keyed by `source:id` (`src/utils/gameVisibility.ts`).
  The hidden-games modal is the only intentional exception, so showing the game again stays possible.
- **Two boundaries, one rule.** Listing BFF routes filter after their canonical upstream/cache read
  (`src/lib/gameVisibility.ts`) and answer with `max-age=0`; shared client providers/selectors filter
  again so optimistic hide/show is immediate and a warm response cannot leak. Raw upstream caches need
  no purge. Public subjects mount `HiddenGamesProvider` with the profile owner's keys, never the viewer's.
- Library `fullLibrary` stays raw for direct game URLs and id lookups. A direct game URL keeps its
  existing authorization behavior: hidden is not a new privacy or access-control model. Do not filter
  the canonical detail loaders to “fix” a listing.
- Stored pins, groups, favorites and showcases stay stored and are excluded at read time, so unhide
  restores them. Groups filter with the group owner's id. Friends' libraries use the friend's keys.
- `score_games` also keeps hidden rows as raw data, but every ranking/streak/total read excludes them.
  Hide/show rebuilds `score_periods` and bumps the shared ranking-cache revision in Postgres; stack
  factors and periods count only visible games. Historical `score_snapshots` stay point-in-time records. Never delete a hidden row just
  to make a listing correct.

## Completion dates are not latest activity (2026-10-31, #88)

Completion status still uses each platform's whole set, but its date is a separate nullable value in
`src/utils/completionDates.ts`. Activity fields remain cache and sync fingerprints; PSN/RA use base
completion, while Steam/Xbox deliberately use full-current-set completion (user decision, 2026-10-31).

| Platform | Completion-date rule | Conservative fallback |
|---|---|---|
| **PSN** | Earned platinum in `default`, else the latest dated trophy only when the whole `default` group is earned. `/api/psn/titles` adds `completedAt`; no-DLC completed games may use `lastTrophyAt`, DLC games read the existing per-game trophy cache. | `null` when base data/date is incomplete or enrichment fails. A failed date lookup does not fail the library and is not cached as a complete enrichment. |
| **RetroAchievements** | `Mastery/Completion` award date, or `HighestAwardDate` when `HighestAwardKind` is `mastered`/`completed`. | `null`; never the latest achievement or a title-based subset guess. |
| **Steam** | When the current set is 100%, use `lastUnlock` (the latest earned achievement). Do not attempt base/DLC separation. | `null` without a valid unlock date; never `lastPlayed`. |
| **Xbox** | When the current set is 100%, `/api/xbox/titles` reads achievements and uses the latest `unlockedAt`. Do not attempt base/DLC separation. | `null` when the read or date is unavailable; never `lastPlayed`. Partial enrichment is not cached as complete. |

**The Completed lists go by this date, not by activity (#99):** on `/completed` the mixed list orders by it by default (`completed` sort key, `mixedSortKeys`), the platforms' own lists too (`byCompletedDesc`), and rows, cards and shelf cards say "Finished" with it, falling back to the last session only when it is unknown. Playing a DLC later must not move a completed game. RA's own list keeps its orders: it has no such key.

Collection grids keep undated games in their existing **Undated** group and library details omit
**Finished** when the date is unknown. Activity feeds, `/racha` and charts still show DLC on its real
unlock day. Vault's completion bonus uses the same date (timestamp 0 when unknown), with
`RULES_VERSION = 3` so normal score refreshes rebuild stored games and periods; display data needs no
migration and historical score snapshots are left untouched.

## Registration

Public and open: anyone can sign up with a username, a password and an **email,
which is required** — it is the only way to recover an account. Accounts created
before that rule have none, and the account page shows them a warning.
There is no invite code; the old `REGISTER_TOKEN` / `NEXT_PUBLIC_REGISTER_TOKEN`
pair is gone, and the public one leaked the secret into the browser bundle.
`REGISTRATION_OPEN=false` closes sign-ups; unset means open. Sign-ups and reset
requests are both limited per address in the database (`src/lib/attemptLimit.ts`).

### Sign up with RetroAchievements (2026-10-23)

"Create account with RetroAchievements" under the register form (`RegisterUserFormRa`): the RA
username and Web API key are checked first (`POST /api/auth/ra/check`, signed out, limited per
address as `ra-check`, refuses a key already in use), RA's name fills the username (unless one was
typed, `suggestUsername`) and its picture becomes the avatar; then `POST /api/users` with `ra`
asks RA again and creates the account already linked, as `/api/updateRaUser` would store it. The
welcome's RA step then shows "linked as" (the user's choice: shown, not skipped).

- **It is a sign-up, never a sign-in.** Measured 2026-10-23: a valid RA key reads *any* user's
  profile and RA has no "whose key is this" call (no `u` → 422), so a key proves owning an RA
  account, not which one, and people paste their key into other tools. **Do not add "sign in with
  RA" by key.** The account still gets an email and a password. Revisit when RA ships OAuth (see
  the roadmap): that is when it can become a "Continue with RetroAchievements" like Steam's.
- The RA username is as unproven as when linking from the account page; `raid` stays unique.

### Steam: sign up, sign in and link, all through Steam (2026-10-21)

"Continue with Steam" under both forms (`SteamSignInDivider`), and "Connect Steam" on the
Steam card (`UserSteamCardLink`, `/api/auth/steam?intent=link&next=…`). Steam's OpenID 2.0, all
in `src/lib/steamLogin.ts`; `migrations/041_steam_login.sql` (`users.steam_login_id`,
unique) was applied to pre (2026-10-21) and production (2026-10-22); any other database needs it first; nothing else
reads that column, so the rest of the app works without it.

- `/api/auth/steam` → Steam → `/api/auth/steam/callback`, which asks Steam to confirm
  its own signature (`check_authentication`) and checks the claimed id, `return_to`
  (built from `NEXTAUTH_URL`) and that those fields were signed. **Never trust the
  callback's query without that round trip**, and refuse a query with a repeated
  parameter before reading any of it: what is checked here and what Steam checks must
  be the same value.
- **A random `state`** rides on `return_to` (signed by Steam) and in an httpOnly cookie on
  the callback path; the callback does nothing unless they match. Without it, a callback link
  made with someone else's Steam account could link it to your account, and then sign them in
  as you. Keep it on both flows.
- The proven SteamID64 travels as a signed ticket (HMAC with `NEXTAUTH_SECRET`,
  10 minutes) in an httpOnly cookie on `Path=/api/auth`. The `steam` NextAuth
  provider reads it from the Cookie header, never from the request body; so does
  `POST /api/auth/steam/register`.
- **Steam gives no email**, so the sign-up still asks for one (required, as always)
  and for a username (suggested from the Steam name). The Steam name and
  `avatarfull` are copied in, `steamid`/`steamusername` are linked, and the password
  is random: the user signs in with Steam, and "forgot password" sets a real one.
  Same `REGISTRATION_OPEN` and `signup` rate limit as the normal sign-up.
- **Users link Steam only through Steam** (decided 2026-10-21; the typed link and
  `/api/steam/link` are gone). A link sets `steamid`, `steamusername` and `steam_login_id`,
  so it also signs in with Steam; one Steam account to one user (another user's proven link
  answers `#steam-taken`). The outcome comes back as `#steam-linked|taken|failed` on the page
  it started from (`/`, `/user` or `/welcome`, `linkReturn`), toasted by `useSteamLink`.
- `steam_login_id` is **separate from `steamid`**: links typed before 2026-10-21 (three, all
  the user's test accounts) keep `steamid` with no `steam_login_id` and were left as they are,
  by the user's choice; `steamid` stays not unique for them. **Unlinking clears both** (changed
  2026-10-30, audit SEC-01): a sign-in nobody can remove outlives a password change. Someone who
  signed up through Steam gets back in with "forgot password". Link and unlink mail the account's
  address (`sendSteamLinkNotice`). Linking asks for no password, by the user's choice (2026-10-31,
  the most comfortable flow, here and in the welcome): the mail and the unlink are what answer a
  link nobody asked for. Admins still link by typing (logged).

## Git — branches, commits, PRs (MANDATORY for every session and agent)

### Environments and branches
| Branch | Environment | Rule |
|---|---|---|
| `main` | **Production** (`www.cheevovault.com`) | Always deployable. Only receives PRs from `develop` (or `hotfix/*`). Never commit or push to it directly. |
| `develop` | **Pre-production** (Vercel preview) | Integration branch. Receives PRs from work branches; verified here before going to `main`. |
| `<type>/<slug>` | none | Short-lived work branch, cut from `develop`, deleted after merge. |

Flow: `<type>/<slug>` → PR into `develop` → check on the preview → PR `develop` → `main`.
Hotfix (production is broken): `hotfix/<slug>` from `main` → PR into `main`, then
merge `main` back into `develop` so they do not diverge.

Never force-push `main` or `develop`. Never merge a PR with failing `npm test`/lint/build.
Do not create, push, merge or delete branches or PRs unless the user asked.

### Branch names
`<type>/<kebab-case-slug>`, English, short. Types are the same as commit types:
`feat/`, `fix/`, `refactor/`, `perf/`, `test/`, `docs/`, `chore/`, `hotfix/`.
e.g. `feat/steam-refresh-button`, `fix/psn-rate-limit`. (Old `feature/…`, `spike/…`
branches stay as they are; new ones follow this.) With its issue's number in front of the
slug (`feat/123-steam-refresh-button`), the PR links the issue on its own (see Issues).

### Issues — every PR resolves one (2026-10-23)
- **No PR without an issue.** Before opening a PR, find its issue or open one
  (`gh issue create`, from the forms in `.github/ISSUE_TEMPLATE/`: Feature or Bug, in
  English; blank issues are off). Name the branch `<type>/<issue>-<slug>`.
- The PR's description starts with `## Issue` → `Closes #123` (the template has it). With
  a numbered branch and no `Closes #`, CI writes it in.
- **Enforced in CI**: `.github/workflows/pr-issue.yml` (check `linked-issue`) fails the PR
  unless it names an open issue (not a PR) that exists. Skipped for releases (head
  `develop`), merges of `main` into `develop` and PRs from `main`. Fix the description,
  not the workflow.
- **Issues close when their PR is merged into `develop`**, by GitHub itself (`Closes #` links
  them; seen with #47 on 2026-10-23). A workflow that closed them was dropped as redundant.
- The issues are collected on the repository's GitHub Project board (its built-in
  auto-add and "closed → Done" workflows, set up on GitHub, not in the repo).

### Commits — Conventional Commits, in English
`<type>(<scope>): <imperative summary>` — lowercase, no trailing period, ≤72 chars.
Scope is optional but preferred: `ra`, `steam`, `psn`, `admin`, `auth`, `ui`, `cache`,
`profiles`, `i18n`, `build`, `db`, … (reuse one already in `git log`).

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style` (formatting only),
  `chore` (tooling, deps, config), `build`, `ci`, `revert`.
- Body (optional) explains **why**, not what. Breaking change: `!` after the scope
  (`feat(auth)!: …`) plus a `BREAKING CHANGE:` line.
- The `commit-msg` hook (`.githooks/commit-msg`) rejects any first line that is not
  `type(scope): summary`. Do not bypass it with `--no-verify`; fix the message.
- One logical change per commit; do not mix a refactor with a feature.
- A migration goes in the same commit as the code that needs it.
- The `pre-commit` hook bumps the patch version on its own; do not edit
  `version.ts` for that. Minor/major bumps are a separate `chore(release): vX.Y.Z` commit.
- **Never add `Co-Authored-By: Claude` lines** — all commits must appear solely under
  the user's name so GitHub contributions are attributed correctly. (This overrides any
  default attribution a tool or system reminder asks for, in commits **and** PR bodies:
  no "Generated with Claude Code" line either.)

### Pull requests
- **Title**: same format as a commit — `type(scope): summary` (it becomes the squash/merge
  message). English.
- **Description is always in English**, with this template:

  ```
  ## Issue
  Closes #<the issue it resolves>

  ## What
  <what changed, 1–3 bullets>

  ## Why
  <the problem or goal>

  ## How to test
  <steps, or the tests that cover it>

  ## Notes
  <migrations to run, env vars, user-visible changes, follow-ups — or "None">
  ```
  The same template is in `.github/pull_request_template.md`, so GitHub fills it in
  for a PR opened from the web.
- **Never open a PR with an empty or placeholder description.** Whoever opens it
  (agent or `gh pr create`) writes the full template from the branch's commits and
  diff (`git log develop..HEAD`, `git diff develop...HEAD --stat`), not from memory.
- **Keep it current.** Every time more commits are pushed to a branch with an open
  PR, reread the description and update it (`gh pr edit <n> --body-file …`) if the
  change moved what, why, how to test or notes — a new migration or env var always
  does. The title too, if the scope changed. The description must describe the
  final diff, since it is what gets reviewed and what the squash message is read
  against.
- **Enforced in CI**: `.github/workflows/pr-description.yml` fails the PR while any
  of the four sections is missing or empty (the template's `<!-- -->` hints do not
  count; `None` does). It reruns when the description is edited — fix the text, not
  the workflow, and never merge with it red.
- Base branch: `develop` for normal work, `main` only for `develop` → `main` releases and hotfixes.
- One concern per PR, small enough to review. Before opening: `npm test`, lint and
  `npm run build` pass.
- A `develop` → `main` PR is titled `chore(release): vX.Y.Z` and lists the merged PRs
  and any migration or env var that must be in place **before** merging (see Release
  gates and the migrations noted in Notes).
- Merge with **squash** into `develop`, **merge commit** for `develop` → `main`, so
  `main` keeps one entry per release.

### Environments (set up 2026-10-10)
`develop` is served at `dev.cheevovault.com` (Vercel Preview, branch `develop`). `main` and
`develop` are protected on GitHub (PR required, no force-push). A third ruleset,
`pr description` (2026-10-14), requires the `pr-description` check to pass **and the
branch to be up to date with its base** before merging, on both; since 2026-10-23 it also
requires `linked-issue` (see Issues).

- **Before merging, bring the branch up to date**: `git fetch` and `git merge
  origin/develop` (or the "Update branch" button), push, wait for the checks again.
  Merge, not rebase — a rebase would need a force-push.
- **`src/lib/version.ts` and `package.json` do not conflict on a local merge**: a
  merge driver (`scripts/merge-version.js`, set in `.gitattributes`, registered by
  `npm run prepare`) keeps the **higher** version on both sides. Run `npm run prepare`
  once per clone. GitHub's "Update branch" button does not run it, so merge locally;
  if it ever conflicts by hand, keep the higher version, never below `develop`'s.
- A `develop` → `main` PR needs `develop` to contain `main`; after a hotfix, merge
  `main` back into `develop` first (as the flow above already says).

- **Pre has its own database (2026-10-20):** a Neon branch of production, `preview`, read through
  `PREVIEW_DATABASE_URL` (`databaseUrl()` in `src/lib/db.js`), set in Vercel for **all Preview
  branches** (scoped to `develop` alone, a feature branch's preview would fall back to production)
  and in `.env.local`. It exists because the Neon integration owns `DATABASE_URL` for
  every environment and Vercel refuses a branch-scoped second one. Production ignores it whatever
  is set (`VERCEL_ENV`). Consequences: **every migration is applied twice** (pre first, production
  when the work reaches `main`); the branch drifts from production (Neon's "Reset from parent"
  copies production again, losing what pre had); it is a copy of real data, so treat it like
  production. **Until the variable is set somewhere, that place still uses production**: check
  before running anything destructive.
- **Demo users** for the rankings and public profiles: `node scripts/demo-rankings.mjs seed
  --follower=<username>` (and `clear`). It writes only to `PREVIEW_DATABASE_URL` and refuses when
  that is missing or the same host as `DATABASE_URL`. Never point it at production: `/rankings` is
  public. 30 hand-written personas (`scripts/demo-personas.mjs`, 2026-10-20; the five names the
  user chose stay), each with a twin (another name and picture), so 60; their points are multiplied
  by `SCALE` (30) so real users with big libraries are not all on top: no sign-in, kept out of the score refresh, found by their password mark
  (`MARK`), never by name. Their Steam/PSN accounts are made up, so their profiles work by
  **seeding `steam_cache`** under those accounts (never expiring) with real games' definitions
  taken from what pre already has cached for real users; points come from the real formula. If
  pre loses those cached games (a reset from production, an unlink), games drop out of the seed
  (it warns). No RA (the dev server does not read RA's DB cache; a made-up RA name may be real).
  PSN trophy lists only in English and Spanish. Their current streaks are set in `STREAKS` (`demo-personas.mjs`):
  reseed to bring them up to today, since a streak ends two days after the seed.
- Preview needs `NEXTAUTH_URL=https://dev.cheevovault.com` scoped to branch `develop`.

## Style
- Single quotes, no trailing semicolons
- Spanish UI text is intentional — do not change it

## Roadmap (pending)
- [x] Steam integration
- [x] Public user profiles
- [ ] Group hardcore achievement tracking
- [ ] **An internal component library** (buttons, inputs, selects, switches, modals, pills,
      steps bar, curtain) in the welcome's style, for the whole site, **and a record of every
      design** (`docs/designs.md`, started): `docs/ui-library-and-designs-plan.md`. A separate
      development, the user's idea (2026-10-23). Design agreed 2026-10-24; building in three PRs
      (foundations and controls, overlays and feedback, surfaces / data / colour sweep).
- [x] **Entrance animations on every page and component** (issue #61, 2026-10-31). See "Entrances"
      in the design system section.
- [ ] **A shareable user card** for social networks (the user's wish, 2026-10-23). Concepts on the
      component library's canvas (`docs/designs.md`). Only data that is already public (what
      `profileTeaser` and the showcase show); anything more means changing `/privacy`. Not started.
- [ ] **`/diario`, a day-by-day journal of play** (the user's wish, 2026-10-23): a new route from
      home concept C. Mini concept on the component library's canvas (`docs/designs.md`). Not started.
- [ ] **Styles to the user's taste** (the user's wish, 2026-10-23): the user chooses how parts of the
      site look. The first one: the home layout (*Classic*, default, or *Portada*), planned with the
      component library (`docs/ui-library-and-designs-plan.md`).
- [ ] **More languages** (the user's wish, 2026-10-23). Today nine (`LANGUAGES` in
      `src/utils/languages.ts`); the browser's language is taken when it is one of them, so a new
      language reaches its speakers on its own. A new one needs: its `src/translations/<lang>.ts`
      (typed as `Translations`, every key), its entry in `LANGUAGES` and in `LanguageContext`'s
      map, the texts kept outside `T` (`vaultGuide.ts`, `vaultGuideMore.ts`; the public pages fall
      back to English), plural rules if it has its own (`T.plurals`), and gender-neutral wording.
      Not started; ask which languages first.
- [ ] Notifications — **an idea the user wants to expand before it is built; do not
      start it, and do not assume it is push or email.** Ask what they have in mind
      first. Known so far: friends completing games and a game's last chance (a
      Game Pass title leaving) were floated, nothing decided. Needs a channel,
      per-user subscriptions and a place to store them (a migration).
- [x] Steam linked by name, like PSN (2026-10-09): custom URL name, profile
      link or SteamID64 (`src/lib/steamAccount.ts`), no OpenID, and no
      "already linked elsewhere" check (`migrations/028`), so one person can
      have several CheevoVault accounts. The profile has to be public.
      **Replaced 2026-10-21**: users now link Steam through Steam's sign-in (see
      Registration → Steam); only admins still link by typing.
- [ ] RA: wait for the API v2 with OAuth before changing how accounts are
      linked ([RAWeb releases](https://github.com/RetroAchievements/RAWeb/releases)).
      **RA's answer was clear: each user with their own key.** No shared app
      key and no looking names up with one — `requireViewerApiKey` never falls
      back to one, and its test says so. The RA modal explains why the key is
      asked for. **Open:** a viewer with no RA account is served with the page
      owner's key (see RetroAchievements above); ask RA whether that counts, and
      if not, ask the viewer to link their own. Revisit when OAuth lands.
- [x] **Vault Points, levels and rankings** — a beta in 1.6.0 (2026-10-20). See "Vault Points
      and the rankings". Later: ownership verification (the user found code-in-bio clumsy;
      revisit with care), a history chart, and CheevoVault's own achievements (advice: they
      should not give points).
- [x] **Online status and "last seen"** on the Following cards (2026-10-19). See
      Presence above. The user said it will grow beyond the card: ask what next
      before extending it (proposed: Steam's "playing now" for everyone in one
      call, an "online" filter, live refresh, the public profile).
- [ ] Later: **community-flagged missables for PSN, Steam and Xbox.** Only RA says
      which achievements are missable (`Type: 'missable'`, marked in red in
      `AchievementGrid`); Sony, Steam and OpenXBL have no such field (checked
      2026-10-16), and the sites that flag them (TrueAchievements/TrueTrophies,
      PSNProfiles) have no API, so **do not scrape them**. Idea: users mark an
      achievement as missable, and once enough of them agree it shows for everyone.
      Needs a migration, a threshold and some moderation; only worth it with more
      users. Not started.
- [ ] Later, optional: a "verified" badge per linked account — the app gives
      a code, the user puts it for a few minutes in their RA motto / Steam
      summary / PSN About me, the app reads it. Only if public profiles or
      group comparisons come to need proof of ownership.
- [x] The "13 optimization fixes" (2026-10-16). They were never written down, only
      named, so they were re-derived by auditing each named area; see "Performance
      rules" below for what was done and what must stay true. Already fine and left
      alone: server cache stampede (`withSteamCache`, `withCache`), database indexes,
      TTLs.
- [x] The ~51 `react-hooks/set-state-in-effect` warnings are gone (2026-10-09)
      and the rule is now an error. See State and effects above.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
