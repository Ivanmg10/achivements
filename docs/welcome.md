# The welcome after sign-up (`/welcome`)

The welcome's rules, moved out of `CLAUDE.md` on 2026-11-07 (#124); `CLAUDE.md` → Welcome keeps the
ones that bite on any task. Design history: `archive/welcome-plan.md` (the plan and the canvas it
links) and `archive/welcome-look-plan.md` (the style and privacy steps, #102).

## What it is (2026-10-22)

A new account (form, form with RetroAchievements, or Steam) is signed in and sent to `/welcome`, not to the login form:
intro, RetroAchievements, Steam, PlayStation, profile, style, privacy, done. Design and the
reasoning behind it: `archive/welcome-plan.md` (and the design canvas linked there); style and privacy: `archive/welcome-look-plan.md`.

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
- **Style and privacy are two steps (#102, 2026-11-02):** the step key `prefs` is the one the bar calls Style.
  Style shows the Layout modal's sample (`LayoutModalPreview`) beside the intro's cards (`LOOK_CHOICES`), each growing into
  its choice, the account's own preference components. **The sample and how a change moves come from the modal; its controls
  do not** (the user's call: the welcome keeps its own look). The theme alone opens over the whole step, with all the themes. A choice opened is a
  history entry (`useWelcomeChoice`). Privacy's sample follows its three switches, on the person's own card. A new look preference is a new row in `LOOK_CHOICES`.
- **A linked platform is one card, `WelcomePagePlatformLinked`,** with its `VaultFillLine` inside, and linking stays on the step so it is seen. A new platform uses it.
- The avatar is edited in `AvatarModal` (account page and welcome), not `EditProfileModal`,
  which is only for the username and email now.
- **The Vault Points fill runs in the welcome** (`VaultFillProvider` in `src/app/welcome/page.tsx`,
  since the app's providers are not mounted there): an account that came linked (signed up with
  Steam or RetroAchievements) or links a platform on the way is read while the person goes
  through the steps, so "your games are on their way" is true. Each linked platform step's card
  (`WelcomePagePlatformLinked`) carries its `VaultFillLine` (games counted, or why not: a private profile
  and how to fix it), and Steam's shows the Steam picture (`useSteamProfile`). Checked end to end 2026-10-23 with a
  Steam sign-up: linked in the bar, the step, the profile's avatar and the done summary.

## The welcome follows the app — keep it current (the user's standing rule, 2026-10-22)

More platforms will come. **Every platform a user can link must have its step in the welcome**,
in the same change that makes it available to users (Xbox included, the day `XBOX_ADMIN_ONLY`
turns false). A new platform touches:
- `PLATFORM_STEPS` and `WELCOME_STEPS` (`src/hooks/useWelcomeSteps.ts`): its place in the order.
  The "Platforms · n of total" count follows on its own.
- Its step component in `src/components/welcome-page/welcome-page-<platform>/`, linking with the
  platform's own hook (as RA, Steam and PSN do), with `WelcomePagePlatformLinked` when linked, and its tests.
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
