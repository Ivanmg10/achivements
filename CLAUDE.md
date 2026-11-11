# CLAUDE.md — Achievements Tracker

The rules every task must obey. **This file holds rules, not events**: a dated fact, a measurement or
the story of a decision goes in `docs/worklog.md` or in the area's doc, and a section here links to it.
Index of the docs: `docs/README.md`. Before working in an area, read its doc:

| Area | Doc |
|---|---|
| The look: tokens, the library, entrances, favicon, progress bars | `docs/design-system.md` |
| How UI work is done (canvas first) and every design made | `docs/design-process.md`, `docs/designs.md` |
| Sign-up, sessions, email, the admin panel, Steam and RA sign-in | `docs/accounts.md` |
| RA, Steam, PSN, Xbox, and how each fails | `docs/platforms/` |
| A component written once per platform (one shell, an adapter each) | `docs/platform-shells.md` |
| Performance and what each page loads | `docs/performance.md` |
| Presence, follows, the showcase, Vault Points and the rankings | `docs/social.md` (formula: `docs/rankings-plan.md`) |
| Synced preferences, consoles to show, hidden games, completion dates | `docs/library.md` |
| The welcome after sign-up | `docs/welcome.md` |
| Languages | `docs/i18n.md` |
| Milestones, release gates, environments, migrations | `docs/releases.md` |
| What is pending | `docs/roadmap.md` |
| Where things live | `docs/architecture.md` |

## Project
Multi-user RetroAchievements companion. Public tracker with groups,
stats, and personalization. Next.js 16 App Router + PostgreSQL + Tailwind v4.

## Stack
- Framework: Next.js 16 (App Router; the auth gate is `src/proxy.ts`, the old middleware).
  **Keep Next at 16.4.3 or later**: up to 16.4.2 about 13 % of Vercel builds failed on Sofia Sans's font
  URLs (`docs/releases.md` → Environments).
- Auth: NextAuth.js
- DB: PostgreSQL via `pg` pool
- Styles: Tailwind CSS v4
- Animations: Framer Motion
- Data: RetroAchievements, Steam, PlayStation (`psn-api`) and Xbox (OpenXBL, admin-only)

## Code structure

### Folder / naming
- Component: `kebab-case/PascalCase.tsx`
  e.g. `main-side-panel/MainSidePanel.tsx`
- Sub-component: `parent-name-sub-name/ParentNameSubName.tsx`
- Hooks: `src/hooks/useXxx.ts` — never inline in component
- Pure transforms: `src/utils/`, one file per topic (`streaks.ts`, `vaultScore.ts`, `completionDates.ts`…).
  `utils.tsx` and `apiCallsUtils.tsx` are older grab bags: add to the topic's file, or a new one, not to them.

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
- Hooks own the session check, the fetch and its state; a component never fetches by itself.
- Shared data loads on its first reader: the provider's `request()`, called by the hook that reads it
  (`useGamesData`, `usePinnedGames`…), never a fetch at mount (Performance below). The older
  `hasFetched = useRef(false)` guard survives in a few hooks; do not copy it into new code.
- **A GET that retries goes through `useRetryingRead`** (`src/hooks/`): never another attempt/timer loop
  around `scheduleRetry`.

### Shared helpers — use them, never a copy (#119)
- **Platform dates** through `src/utils/dates.ts`: `parseUnlockTime` / `unlockIso` read the platforms'
  zone-less strings as UTC (never `.replace(' ', 'T')`), `utcDay` / `localDay` are the day keys, and
  `formatDate(s, lang)` / `formatDay(day, lang)` show a date in the reader's language (never a fixed locale), in
  **the one date format** ("23 oct", the year only when it is not this year; on screen `ui/DateText`). Never a
  numeric one, never its options written by hand (`{ day, month: 'short' }`) and never a `toLocaleDateString`
  outside `utils/dates.ts`: the guard refuses all three (`docs/design-system.md` → One date format).
- **RA picture URLs** through `src/utils/raAssets.ts` (`raImageUrl`, `raBadgeUrl`, `raAvatarUrl`), never a
  hand-written `retroachievements.org` host.
- **The platform list and names** are `GAME_SOURCES` and `PLATFORM_NAME` (`src/utils/gameRef.ts`); the shared
  types (`GameSource`, `GameStatus`, `SavedGame`, `GameAchievement`) are in `src/types/game.ts`.
- **Hidden games in SQL** are `notHidden(row)` (`src/lib/gameVisibility.ts`), as presence is `presenceColumns()`.
- **Signing, constant-time compares and cookies** through `src/lib/secrets.ts`. **A key derivation never
  changes**: sealed RA keys, the NPSSO and every link and ticket out there stop being readable;
  `secrets.test.ts` pins them.
- What is still written by hand, and how to move it: the #119 entry in `docs/worklog.md`.

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

## API calls — error handling MANDATORY
Every API call added or modified must have its own error handling. No exceptions.

- `fetch` calls: check `response.ok`, handle non-2xx explicitly
- Catch network/unexpected errors with `try/catch`
- Set appropriate error state so the UI can reflect failure (error message, empty state, retry)
- Do not let errors propagate silently or swallow them with empty catch blocks
- API route handlers (`route.ts`): always return structured error responses with correct HTTP status codes
- **A route answers a code (`username-taken`, `too-many`), never a sentence**, and the client puts the code in the
  reader's language through `src/utils/apiErrors.ts` (`signupError`, `profileFieldError`, `groupError`; any code it
  does not know is the generic text). Never show `data.error`, `err.message` or a status code on screen (#122).
- **A route that needs a signed-in user starts with `requireSession()`** (or a platform's `require*Session`),
  which also gives the session's user: never `getServerSession` plus a 401 of its own.
- **An error that asking again will not fix is a 4xx**: the client retries 5xx (`fetchWithRetry`, then
  `scheduleRetry`) and never a 4xx. Keep "nothing here", "I cannot read it" and "try later" distinct
  (the table per platform: `docs/platforms/README.md`).

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
  at the top entries: a `---` between two may be missing. At each release, the
  entries older than it move to `docs/archive/` (as its header says).
- **A rule or invariant changed or was learned** (a "never do X", how a
  platform must be called, a new env var, a migration that must run, a release
  gate) → update its area's doc in the same change, and this file too when the
  rule bites on any task. Do not leave a section that says the opposite of the code.
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
- Inputs → `<label htmlFor>` + `id` (`Field` wires it)
- Toggles → the library's `Switch` (`role="switch"`, `aria-checked`) or, for an on/off icon such as a pin
  star, `ToggleButton` (`aria-pressed`); never a hand-made `role="switch"`
- Errors → `role="alert"`, success → `role="status"`
- Selected states must not rely on color alone

### 3. i18n
- All user-facing strings via `T.*` from `useLanguage()` hook
- **Gender-neutral wording** in every language: nothing that assumes the reader's gender
  ("Bienvenido", "Bem-vindo", "Benvenuto", a Polish "zostawiłeś"…). Say "Hola", "Esta es tu
  bóveda", or rephrase (the user's rule, 2026-10-22). The opt-in gender is for others' profiles,
  not for addressing the reader.
- New strings → every file under `src/translations/` (nine languages; the `Translations` type refuses a
  missing key)
- Admin panel exempt
- **One name per thing, in the nine languages** (the words are in `docs/i18n.md` → Vocabulary): connect / disconnect
  an account (RA is never "signed in to"), library, achievements to get, Vault Points, "not started". No em
  dash in a live string (`src/translations/copy.test.ts` fails on one, Russian apart). Numbers and dates go through
  `lang` (`formatDate`, `formatDay`, `toLocaleString(lang)`), never the browser's locale.
- **The detected language is never saved**, only a person's pick. `LANGUAGES` (`src/utils/languages.ts`)
  is the one list. **Never import `es`, `pt`… into client code** (each language is its own chunk, plain
  data), and **never call `serverLanguage()`, `headers()` or `cookies()` in the root layout** (it would
  make every static page dynamic). How and why: `docs/i18n.md`.
- **Numbers a reader sees are in their language:** `toLocaleString(lang)`, `decimal(n, lang)`,
  `formatRarity(pct, lang)`; never `toFixed` on screen ("0,8", not "0.8").

## Style
- Single quotes, no trailing semicolons (in `src/`; the root configs keep their own)
- **Every user-facing text goes through `T`** (the owner's decision, 2026-11-06, #77): a literal Spanish or English
  string in a component is a bug, however it got there. The admin panel stays exempt.

## How UI work is done — idea → design → iterations → development

**Every new page, section or visual rework follows `docs/design-process.md`**, the way the
welcome was made (the user's standing preference): study the reference, several clickable
concepts on a claude.ai design canvas (the user calls it "Figma"; they mean the canvas), iterate with the user one
version at a time (changing only what they asked), a plan doc, then build and fix in short rounds
from their screenshots (they use a 2560 px screen). The welcome's visual language (display
italic titles, kickers, floating pill bar, curtain, cards that grow into their detail) is the
one the user likes; the component library that makes the whole site match it is built
(`docs/ui-library-and-designs-plan.md`; components only, never page structure). **Every design made (canvas) gets an entry in `docs/designs.md`**
with its link, versions and what was built, so it can always be found again.

## The antislop audit (#77) — read before any UI, refactor or new feature (2026-11-06)

The whole code and every screen were audited: `docs/audits/antislop-v17.md` (Part 1 code, 2 visuals,
3 the plan; appendices per area in `docs/audits/antislop-v17/`). **Before touching an area, read its part**:
the finding may already say what to reuse or why it looks the way it does. The work is in issues, in this
order (§3.6 of the report): #116 CI → #117 dead code → #113 Steam last-played and #118 bugs → #119 helpers →
#120 library and guards → #121 dialogs, #123 contrast and themes, #122 texts → #125 per-platform shells →
per-screen issues from the canvas (#126) → #115 handhelds (with #114) → the landing. #124 (this file) at any time.

**Where the design stands (2026-11-07):** the first canvas (#126) is history, not a decision. Its identity and theme
choices are **not binding**: both are proposed again from zero in a new canvas (`docs/audits/antislop-canvas-v2-brief.md`).
What holds: the page-by-page cuts were **rejected** (they took the personality away) and became improvements per screen
that keep the look; the landing's first screen is chosen ("Primera pantalla 1 v2").

**Mistakes not to repeat:**
- **Antislop is not minimalism.** Cutting colour, art, density or the slant to look "clean" took the site's
  personality away and was rejected. What goes: repeats, bugs, hand-drawn copies of library pieces, comments
  that say what the code says. What stays: what makes it CheevoVault.
- **A page does not shrink when data is missing** (the owner, 2026-11-07): an empty or one-item section keeps its
  room and its place, so the visual order holds. Do not size a card to its content to "fix" empty space.
- **Look before writing.** The two biggest findings were the same component written once per platform (~4,500
  lines) and the library walked around (kickers in 95 files, the focus ring ×220, platform hex ×116). New
  platform code goes into its family's shell (`docs/platform-shells.md`: a shell, an adapter per platform, one
  `describe.each` contract suite; reuse `CompareAchievement`, never a new achievement shape); a new look goes
  into `ui/` with its guard rule.
- **Short functions, short components.** A 200-line function that could be 50 is a bug (the owner's words).
  Split before it grows; one helper, never two or three copies.
- **Screenshots of a signed-in account lie unless intercepted:** the account's synced preferences and theme
  (`users.preferences`, `users.theme`) beat `localStorage`, so setting the browser captures the account's own
  look. Intercept `/api/preferences` and `/api/me/bootstrap` in Playwright, block writes, and **never change
  the account**. Signed-out shots in a fresh browser context.
- **Data read with the app's own credential hides per-account differences** (#113: Steam sends
  `rtime_last_played` only for the API key's owner). Check a second, ordinary account before trusting it.
- **Sizes to check:** 390 and 2560 px, and the handhelds (Steam Deck 1280×800, AYN Thor ~800×450, #115).
- **Designs are drawn from the real components and art, with today beside them**, and each round changes only
  what the owner asked.

## The design system and the library — read `docs/design-system.md` before any UI

Three layers: **tokens** (`globals.css`: a theme's colours, a *design's* shapes), **the library**
(`src/components/ui` and friends) and **pages built from it**. The catalogue of every piece is at
**`/design`, admins only**. `uiGuard.test.ts` and `designTokens.test.ts` enforce most of what follows;
the reasons and the details are in `docs/design-system.md` → The rules in full.

- **Never draw a control by hand**: `Button` / `IconButton` (or `buttonClass`), `Input`, `Textarea`,
  `SearchInput`, `PasswordInput` in `Field` (or `fieldClass`), `Select` (never a native `<select>`),
  `Switch` (state in words beside it), `Checkbox`, `ChoiceCards`, `Tabs`, `SegmentedControl`, `Pill`,
  `Modal` (every dialog is one: its own head (`title`, `hint`, `icon`), the corner close, `footer` for the actions, `tone="danger"` for a
  destructive one; no hand-drawn head or ✕, no Escape listener of its own, no `createPortal`, no `CommonModal` (deleted, #121); a `Modal` draws the frame,
  never a card inside it; `placement="top"` for a command panel or a menu), `Notice`, `ErrorRetry` (a failed read with its retry), `Spinner` (or `Button loading`),
  `TOOLTIP_SURFACE`, `MENU_SURFACE`, `SURFACE`, `Accordion`, `ShowMore`, `Shelf`, `SectionHead`, `DropSlot`,
  `ToggleButton`, `Kicker` (the small label, sentence case), `Tag`, `Avatar` (with the presence dot), `ListRow`, `Figure`
  (every labelled number), `DataBar` (a chart bar) and `Facts` (facts on one line). `className` on them is for layout only,
  never colours. **Tokens, not strings:** `focus-ring`, `shadow-hairline-t/-b`, `shadow-sunken`,
  `drop-shadow-done`, and a platform's colour is `text-steam` / `bg-psn/10`…, never a hex. Rules added in #120
  start with the files still to migrate (`ui/uiGuard.pending.json`): the list only shrinks, never add to it.
- **A component never reads the look choice** (`data-shape`, `data-font`): it reads tokens. **Never a literal
  `polygon(...)` or `skew-*-[..]`**; no theme overrides a shape token. The welcome curtain's fixed clip paths are
  the documented exception.
- **The slant grammar, identity B v2 (#127, the owner's choice on the canvas, 2026-11-07):** **one angle**,
  `--slant` (12°, 0 in round), `skew-x-(--slant)` or `SLANT_PLATE`; no second angle and no fixed cuts (the guard
  refuses `--slant-*`, `--clip-*`). **Only the big gestures and the player's own marks lean:** the primary button,
  the chosen option of a `SegmentedControl`, the level (`VaultLevelBadge`) and the streak (`StreakTag`), the
  podium's steps. Small controls, fields, search, filters, secondary/quiet/danger buttons, the switch, tags and
  marks stand upright. **Data never leans:** `ProgressBar`, `DataBar` and every chart bar are upright. **The mark
  is the signature** (`--mark`: "/" slanted, "•" round, `MARK`): in front of the tab you are on (`Tabs`, the one
  drawing of every tab bar; `TabMark` in a row of pressed buttons), between bare figures, and between facts on
  one line (`Facts`, never a hand-made `·`). **No label in capitals:** kickers, figure labels and table heads are in
  sentence case. Details: `docs/design-system.md` → The slant grammar.
- **The round design is always rounder than the slanted one.** Radii come from tokens, chosen by what the thing
  is (`rounded-card`, `-sheet`, `-tile`, `-box`, `-cell`, `-button`, `-icon`, `-chip`, `-field`, `-area`);
  `rounded-control` is a soft surface (notices, menus, tooltips), never a pill. Outside `ui/` no `rounded-lg`…`-3xl`
  or arbitrary values.
- **Colours with a meaning come from the theme** (danger, success, warning, `hardcore`, `softcore`); no palette
  class of any hue. Platform hues are tokens (`--color-steam`…, `platinum`); tier hues live in their util.
- **Streaks are coloured by tier** (`streakTier`) wherever a streak is coloured.
- **Every progress bar is `ProgressBar` or `CircularProgress`** in the theme's `--progress`; only a finished
  bar glows; **the green is only in the percentage beside it**, never on the bar (the user tried a green ring
  and did not like it). Never a bar in a platform's colour; those stay in charts that compare platforms.
- **A page title, a big figure or a rank is `font-display italic`.**
- **Loading:** each screen, section and fetch brings its own composed skeleton from `Skeleton`, on the real
  boxes, in the same change; never a hand-made `animate-pulse`; a figure on its way is `loading` on
  `Figure`, never a `—`; spinners only inside a button. **A section lands
  whole** (the user's preference): no row pops in, no timeout or progressive reveal without asking.
  **What a row or card may show is in it from the first frame.** A chart in a skeleton is the real chart with
  `isLoading`. A line of unlocks over time is `AchievementsLinePlot`, never a second drawing of it.
- **Entrances: a class, never a new animation.** A new page or list brings its entrance in the same change
  (`.enter-rows`, `.enter-cards`, `.enter-card` / `.enter-rise`, `.enter-grow-x` / `-y`, `animateIn`,
  `CountUp`). CSS keyframes, **never Framer's `x`/`y`/`initial` on what appears on a load**; `backwards`,
  never `both`; a block that waits for a fetch holds its exact room.
- **The game card's look is drawn only by `GameCardBackdrop`** (a flat tint, never the blurred art again).
  A game page's top is `GameHero`; its tables use `ui/dataTable.ts`.
- **Look transitions go through `lookTransition`**; never ease a shape with CSS, and test motion in Firefox
  too, on the real screen.
- **Adding a piece:** library first (`ui/`, props for layout only, a test), then its specimen in the
  catalogue, then its rule in `uiGuard.test.ts`, then the page. A page that needs a one-off look asks
  for a prop or a variant, never a copy.
- **The logo was drawn by a friend of the user and keeps its shape**: recolour it, never redraw it or swap it
  for a simpler mark (`LOGO` in `src/utils/themeIcon.ts`). The favicon is the logo in the accent, never on a
  ground or a plate. **A new theme needs its row in `THEME_ACCENT`** (and a new light theme joins the light
  selector lists in `globals.css`). **Every theme must pass WCAG AA** (`themes.test.ts`: text, accent, meaning colours
  and streak inks, on their grounds and their own tints; see `docs/design-system.md` → Contrast): fix the theme's value, never the rule.
- `/api/image-proxy` serves only the platforms' image hosts: never widen it to anything a user can type
  (an open proxy).

## Public pages — what search engines and chat AIs read

`/compare/<slug>` and `/track/<slug>` are public pages written to answer what
people ask Google or a chat AI ("a PSNProfiles alternative that also tracks
Steam"); the landing has a FAQ for the same reason.

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

## AI export (`src/utils/aiExport.ts`)

The "Ask an AI" button on the game pages builds a file for a chat AI:
English instructions plus "Reply in <language>", pending in game order,
earned oldest first. **Never put account data in it** (username, ids, keys):
only the game and its achievements. The UI says so. Change the prompt there,
with its tests; it is the part that decides whether the answers are any good.

## Welcome after sign-up (`/welcome`) — `docs/welcome.md`

- **Never blocks**: every step can be skipped, "Skip all" is always there, back works. Do not add a required step.
- **No Xbox** in it while Xbox is admin-only; **no app header** (it lives outside `(main)` on purpose).
- **Linking reuses the account page's hooks** (`useRaLink`, `useSteamLink`, `usePsnLink`); never a second way to link.
- **The welcome follows the app** (the user's standing rule): every platform a user can link has its step, in the
  same change that opens it (Xbox too, the day `XBOX_ADMIN_ONLY` turns false), and a change that adds or renames a
  feature, a profile field or a preference checks whether the welcome shows it. The checklist: `docs/welcome.md`.
- Sizes in it are in rem, and **never CSS `zoom`** (it breaks Framer's layout animations).

## Auth, sessions, email and admin — `docs/accounts.md`

- **The session is rebuilt from the `users` row on every read. Never copy data from `update()`'s payload into the
  token**: save in the DB, then call `update()` with no arguments.
- **The RA key (`raid`) is server-only.** Never pass `getServerSession(authOptions)`'s object to a client component;
  client code uses `raLinked`. Do not hand the session to a second `SessionProvider`, and never read it in the root layout.
- **`useAuthSession`, never `useSession`, wherever `status` is read.**
- Admin checks read the DB (`loadUser(id, { fresh: true })`). **Every admin route starts with `requireAdmin(req)`**
  (two locks: the flag and the password + one-time-code unlock) and every admin action calls `logAdminAction`.
- Rate limits live in the DB (`src/lib/attemptLimit.ts`): `reserveAttempt` before the guarded work, never a count
  then a record.
- **Email:** without `RESEND_API_KEY` the reset answers `503 email-not-configured`: **never pretend the mail was
  sent**. `/api/auth/forgotPassword` answers the same whether or not the address has an account. Never a second
  mail provider or an SMTP fallback without asking. **Email verification stays soft**: nothing is ever gated on it.
- **Changing an email notifies the old address**; changing the email or deleting the account asks for the
  current password; a password change ends every session.
- **Sign up with RetroAchievements is a sign-up, never a sign-in**: a key does not prove whose account it is.
  Do not add "sign in with RA" by key.
- **Steam: users link only through Steam's OpenID.** Never trust the callback's query without the
  `check_authentication` round trip, refuse a repeated parameter, keep the random `state` on both flows, and read
  the signed ticket from the cookie, never the body. Unlinking clears `steamid` and `steam_login_id`.
- Sign-up is open (`REGISTRATION_OPEN=false` closes it) and **the email is required**. A change to the admin panel
  or to what is kept means changing `/privacy` (and `/terms`).

## Platforms — `docs/platforms/`

- **RA: each user with their own key** (RA's answer). Never a shared app key; `requireViewerApiKey` never falls
  back to another key. `users.raid` is read through `readRaKey`, never directly. Bump a cache key's `_vN` when its
  shape changes (same for `psn:` and `xbox:` keys).
- **Steam:** the owned list only through `loadOwnedGames` (never `getOwnedGames` from a route); keep the
  per-game probe that makes the batch counts trustworthy (`batchCountsFor`).
- **PSN: one app account (the NPSSO), not the user's**; `psnaccountid` is deliberately **not unique**. Every call
  through `psnCall()`. **Do not try to automate Sony's sign-in.** A game counts by its whole set, DLC included.
- **Xbox stays admin-only on purpose, and the reason is money** (OpenXBL's free plan, 150 calls an hour for the
  whole app). **Do not set `XBOX_ADMIN_ONLY` to `false`, and do not suggest it as a next step**, until the user says
  they will pay for a plan. The gate is enforced in three places that must keep holding (routes, UI, and every
  path that shows other people's data); **a new place that lists games or accounts filters Xbox the same way.**
  Every Xbox image goes through `xboxMappers.https()`. Do not enrich the whole library from IGDB at load.
- **No second provider** for Xbox or mail without asking; **never scrape** sites without an API (missables).
- Every call to a platform has a deadline shorter than the client's 20 s.

## Performance and data loading — `docs/performance.md`

- **Nothing the first paint needs waits for JavaScript**: no Framer `initial` with opacity 0 on what a visitor
  reads first.
- **Code the browser loads must not reach `pg`**, not even through a dynamic import.
- **A global data provider loads on its first reader; never fetch at mount.** A reader that only needs
  `isLinked` passes `{ passive: true }`.
- **The header never reads the year** (its streak is `GET /api/me/streak`, `null` until it answers: a grey
  tag, never a 0). **A streak is drawn only whole:** the year's `isLoading` covers every linked platform and the
  library the console filter needs; nothing shows the streak from part of it. `GET /api/me/bootstrap` is
  database only, never a platform. `/api/follows/cards` calls the profile routes' own handlers: do not
  re-implement their rules there.
- **Nothing in the browser makes a platform's data older than its server cache** (the user's rule): page reads
  are painted from their last answer and always read again, never served from a client TTL.
- **recharts only through the lazy `AchievementsLinePlot`.** A modal is a `next/dynamic` import in
  `LazyWhenOpened`, **always with `{ loading: () => null }`**; never imported statically into a page or the header (`uiGuard.test.ts` refuses a static
  `import XModal` / `XDialog` and a `dynamic()` of one without `loading`). A modal that opens on data (`{selected && <XModal …/>}`) is lazy by
  its condition alone; one with an `isOpen` is wrapped in `LazyWhenOpened`.
- Expensive read routes send `cachedJson(data, ttl)`; mutable data (groups, pins, preferences) never does.
  A context value is memoized when its provider reads the session. A route group has an `error.tsx` whose retry
  calls `retry()`, not `reset()`.
- What a user stores has an end (a length, a row cap). Measure before and after with `scripts/measure-api-calls.js`.

## Social and libraries — `docs/social.md`, `docs/library.md`

- **Presence is written only by the heartbeat**; online and `lastSeenAt` come from `presenceColumns()`, rounded,
  with `show_presence` enforced in SQL. **Wherever another user's picture shows, so does their presence**
  (`PresenceDot`, `PresenceLabel`); never on your own.
- **Who follows whom is shown to nobody else**: no follower list or count on public profiles without asking.
- **The showcase is public; "achievements to get" are private**: never a place that shows them to anyone else.
- **Vault Points are computed ahead, never on a read**; the rankings routes never call a platform. Keep
  `vaultScore.test.ts` passing and bump `RULES_VERSION` when a number changes; read each platform at `PACE`
  (`src/lib/scoreRefresh.ts`), not faster. A profile's public card shows only what the rankings show.
- **Hidden games are a listing preference, never authorization**: excluded from every listing and aggregate,
  stored rows kept, the canonical detail loaders unfiltered. Anything that looks a game up by id uses
  `fullLibrary`. **A new feed of unlocks filters through `useConsoleVisibility`.**
- **A completion date is not the latest activity** (`src/utils/completionDates.ts`); never `lastPlayed`.
- **To sync a new preference, add its key to `src/utils/syncedPreferences.ts`**; nothing else. Never expose
  preferences on public profiles.

## Versioning

Single source of truth: `src/lib/version.ts` → `APP_VERSION`. Milestones: `docs/releases.md`.

- Semver: `x.0.0` huge integrations or platform shifts (e.g. Steam); `0.x.0` new pages, sections,
  significant feature changes; `0.0.x` small fixes, optimizations, tweaks. Optional pre-release suffixes:
  `-beta`, `-rc.1`.
- **Every commit auto-bumps the patch** (`.githooks/pre-commit`, activated by `npm run prepare`). For a
  minor or major, edit `src/lib/version.ts` by hand before committing: the hook sees it, skips the bump
  and syncs `package.json`.
- **Release gates (all closed since 1.0.0): warn the user, unprompted, if one stops being true** while they
  talk about a release or "going live" (they asked for this reminder on purpose): `cheevovault.com` verified in
  Resend with `EMAIL_FROM` on it, `NEXTAUTH_URL=https://www.cheevovault.com` (www, not the apex),
  `NEXT_PUBLIC_CONTACT_EMAIL` set, `migrations/011` and `018` run. Details: `docs/releases.md`.
- **A migration must be applied before the code that reads it**, to pre first and to production when the work
  reaches `main`; some break every signed-in request without it (the table: `docs/releases.md`).

## Git — branches, commits, PRs (MANDATORY for every session and agent)

### Environments and branches
| Branch | Environment | Rule |
|---|---|---|
| `main` | **Production** (`www.cheevovault.com`) | Always deployable. Only receives PRs from `develop` (or `hotfix/*`). Never commit or push to it directly. |
| `develop` | **Pre-production** (`dev.cheevovault.com`, Vercel preview) | Integration branch. Receives PRs from work branches; verified here before going to `main`. |
| `<type>/<slug>` | none | Short-lived work branch, cut from `develop`, deleted after merge. |

Flow: `<type>/<slug>` → PR into `develop` → check on the preview → PR `develop` → `main`.
Hotfix (production is broken): `hotfix/<slug>` from `main` → PR into `main`, then
merge `main` back into `develop` so they do not diverge.

Never force-push `main` or `develop`. Never merge a PR with failing `npm test`/lint/build.
`.github/workflows/ci.yml` (check `checks`) runs types, lint, tests and build on every PR into `develop` or
`main`, with no secrets: the build needs none (checked 2026-11-07). Fix the code, never the workflow.
Do not create, push, merge or delete branches or PRs unless the user asked.

- **Pre has its own database** (`PREVIEW_DATABASE_URL`, a Neon branch of production): a copy of real data, so
  treat it like production, and **where the variable is not set, that place still uses production**: check
  before running anything destructive. **Never point the demo seed (`scripts/demo-rankings.mjs`) at
  production.** Details: `docs/releases.md` → Environments.

### Branch names
`<type>/<kebab-case-slug>`, English, short. Types are the same as commit types:
`feat/`, `fix/`, `refactor/`, `perf/`, `test/`, `docs/`, `chore/`, `hotfix/`.
e.g. `feat/steam-refresh-button`, `fix/psn-rate-limit`. (Old `feature/…`, `spike/…`
branches stay as they are; new ones follow this.) With its issue's number in front of the
slug (`feat/123-steam-refresh-button`), the PR links the issue on its own (see Issues).

### Issues — every PR resolves one
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
  them). A workflow that closed them was dropped as redundant.
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

### Merging
`main` and `develop` are protected on GitHub (PR required, no force-push); the `pr description` ruleset
requires `pr-description` and `linked-issue` to pass **and the branch to be up to date with its base**.

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

## Roadmap — `docs/roadmap.md`

Do not start an item marked **ask first** there (notifications, more languages, extending presence) without
asking the owner what they have in mind.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
