# Welcome after sign-up — plan (not started)

Written 2026-10-22 on `feat/welcome-onboarding` (cut from `feat/steam-sign-in`, PR #46,
not merged yet). Design only; no code yet. **The design to build is v3** (below): concept E
as it was, with the side rail of v2 as its step bar. v1 and v2 stay on the canvas for history.

## Goal

Today a sign-up lands back on the login form ("account created, sign in"), and then on a
home with nothing linked (`ConnectAccounts`): three cards with no context. The welcome
replaces that: right after sign-up the user is signed in and taken to `/welcome`, which
says what CheevoVault offers and walks through linking RetroAchievements, Steam and
PlayStation one at a time, with animated transitions. The aim is that people link
accounts there, so `ConnectAccounts` becomes the fallback for whoever skipped.

## Designs

A canvas with live, clickable prototypes (private, the user's):
https://claude.ai/artifact/88tv7qpD6mktno2KYzkGob

- **00** brief and flow, **01** frame-by-frame analysis of the reference.
- **A** "Cambio de jornada": the reference translated directly (curtain, band, nodes).
- **B** "Tu primer logro": the welcome as a 4-achievement set with a ring and unlock toasts.
- **C** "La bóveda se llena": a vault door turns per platform and game tiles pour in.
- **D** "Inserta cartucho": a console; each platform is a cartridge, the CRT boots.
- **E** (v1) A + B: A's transitions between steps, B's unlock on link; plus the RA step in
  detail (guided "where is my key"), mobile, and a motion spec.
- **v2** (the one to build): the user liked E and asked (2026-10-22) for four changes, see
  "v2" below. Boards: the style audit and step-bar options, the 7 steps and what each saves,
  the prototype (Tweaks: registered with Steam, reduced motion, start step), mobile, and the
  motion spec (updated).

## v3 — the one to build (decided 2026-10-22)

The user liked E's concept, look and animation as they were; their only objection to it was the
top step bar. v2 restyled everything to the app's look, which went too far. v3 is **E unchanged**
(full-screen curtain with the chevron band and the platform skies, Barlow Condensed italic
headings, the giant tone-on-tone word drifting behind, "Así se verá" cards on the right) with
**v2's side rail in place of the top timeline**, plus v2's other changes: back on every step
(the curtain mirrors), the profile and preferences steps (each with a live preview on the
right: "Así te verán", "Qué ven los demás"), and no achievements. On mobile the rail folds into
"Paso n de 7" + a bottom sheet.

The rail is the only part drawn in the app's own language (a `rounded-3xl` card, rows with an
icon chip and the state written out, a thin accent bar), because it is the part that sits next
to the rest of the app the longest. Everything else keeps E's game-like voice.

## v2 — what changed from E, and why (the rail and points 1, 2, 4 still hold)

1. **Back on every step.** "Atrás" in the footer of every step but the first; the rail jumps
   to any step already seen; each step is a URL hash, so the browser's back works too. Going
   back mirrors the curtain (it enters from the right, the chevron points left) and the
   content arrives from the right.
2. **Profile and preferences in the welcome**, two new steps after the platforms:
   - *Tu perfil*: picture, country, description (280), gender (optional) and "show it on my
     profile". Saved on change, as the account page does (`useSaveProfileField`).
   - *Preferencias*: theme (applied on the spot), language, and the three switches: public
     profile, presence, rankings (`UserProfileSwitch` fields).
   Platforms go first on purpose: linking one starts reading the games (`scoreRefresh`), which
   runs while the user fills in the profile, so "Listo" already has data. Platform-specific
   preferences (consoles shown, favourite game) stay on the account page: they need a library.
   Steps: Bienvenida → RetroAchievements → Steam → PlayStation → Tu perfil → Preferencias → Listo.
3. **The step bar is rebuilt in the app's own language.** v1 brought Inazuma's language (nodes
   on a line, chevrons, condensed italic type) to an app that marks position with 2 px accent
   underlines (tabs), ringed pills (header, filters) and rows with an icon chip and the state
   written out (Preferences), on `rounded-3xl` cards, Inter only, bold headings. Three options
   were drawn (underlined tabs, pills in a floating bar, a side rail); the **rail** won: seven
   steps fit with their state in words ("Conectado", "Para luego"), any seen step is one click
   away, and it is the account page's pattern. On mobile it folds into "Paso 3 de 7" + a thin
   bar, and opens as a bottom sheet. (v2 also moved the curtain inside the content card and
   used Inter for it; v3 undoes that.)
4. **No achievements.** Linking says so with the usual green toast (`notify.success`); an error
   stays inline in the step. See "Later: CheevoVault's own achievements".

## The reference: Inazuma Eleven: Victory Road's day change

The user sent a YouTube short (`youtube.com/shorts/emWAHD5mRT8`) of the story mode's
"rest" transition. Sampled every 0.1 s:

1. **In, ~0.2 s**: a blue curtain with an arrow-shaped (chevron) leading edge wipes
   left → right over the scene; giant tone-on-tone type ("INAZUMA ELEVEN") is its texture.
2. **Origin, ~0.4–0.7 s**: a horizontal line with nodes (time slots, "MIÉ" under each);
   a chevron band filled with the current sky (sunset, day, night) sits on the current node,
   with two lighter echo chevrons trailing it.
3. **Travel, ~0.4 s**: the band's tip moves to the next node while its sky crossfades
   to the next one (sunset → grey → night).
4. **Destination, ~1.1–1.3 s**: holds; the type drifts slowly; the nodes slide so the
   destination centres. The scene is changed underneath.
5. **Out, ~0.2 s**: the curtain leaves to the right with a notched back edge.

Total 2.4–3.5 s. Why it works: the transition carries information (from → to), one shape
means one idea (the chevron = forward), colour is the data (the sky is the time), origin
and destination are on screen together, the moves are short and the holds long, and it
hides the scene swap. For CheevoVault: time slot → step, sky → platform art, brand blue →
the user's theme accent, giant type → the platform's name. Ours is shorter (1.1 s): a web
step should not make people wait.

## How it would be built (once a concept is chosen)

- **Route** `src/app/(main)/welcome/page.tsx`, signed-in only (not in `PUBLIC_PATHS`).
  Steps in the URL hash (`useLocationHash`) so Steam's round trip lands on the right step.
- **Sign-up → welcome.** `RegisterUserForm`: after `POST /api/users` succeeds, `signIn`
  with the same credentials (`redirect: false`) and `router.push('/welcome')`; the login
  form stays as the fallback if that sign-in fails. `useSteamSignup`: only a **new** Steam
  account (`register()`) goes to `/welcome`; an existing one signing in still goes to `/`.
  The Steam step shows as already done for them.
- **Steps in this order**: welcome, RA, Steam, PSN, profile, preferences, done; back on all
  but the first; the rail (`welcome-rail/…`) with each step's state written out.
- **Linking reuses what exists**: RA through `RaLoginModal`'s logic (or the inline form of
  board E-Paso-RA), Steam through `/api/auth/steam?intent=link&next=/welcome` (add
  `'/welcome'` to `LINK_RETURNS` in `src/lib/steamLogin.ts`), PSN through `UserPsnCard`'s
  logic. No new link endpoints.
- **No Xbox**: it is admin-only and a new user is not an admin.
- **Never blocks**: "Ahora no" on every step, "Saltar todo" always visible. No "seen" flag
  and no migration: the welcome is reached from sign-up only. If it should come back later,
  a synced preference key (`src/utils/syncedPreferences.ts`) is the place.
- **Motion**: Framer Motion; only transform/opacity/clip-path; `useReducedMotion()` turns
  the curtain into a 150 ms fade. Focus moves to the step's title after each change; a
  `role="status"` says "Paso 2 de 5 · RetroAchievements".
- **Toasts**: a link's success goes through `notify.success` (`src/lib/notify.ts`); an error
  inside the step stays inline (CLAUDE.md, toasts). No achievement look for now.
- **Profile and preferences** reuse the account page's pieces (`AvatarUpload`,
  `LocationModal`'s list, `UserDescriptionField`, `UserProfileSwitch`, `ThemeContext`,
  `LanguageContext`). The theme is kept on the account; the language only in the browser.
- **Colours**: the curtain from the theme accent; platform colours only inside the band and
  the logos, never on a progress bar.
- **Texts** in `T.welcome`, all languages; components extracted per step; tests for the
  hook (step state, hash), the sign-up redirect and each step's render.

## Later: CheevoVault's own achievements (not now)

The user likes concept B and wants **internal CheevoVault achievements** in the future, but
**not in the welcome for now** (decided 2026-10-22). Notes for when it is picked up:

- Concept B on the canvas is the starting point: a "game" of the site's own achievements with
  a progress ring, locked/unlocked badges and an unlock toast with a shine.
- The welcome would be its first set (create the account, link RA, link Steam, link PSN), but
  the idea is wider: achievements for using the site (first group, first pin, a streak…).
- The rankings plan advises they **give no Vault Points**; keep it that way.
- Needs its own table (a migration), a list of achievements fixed in code, texts in `T`,
  and a decision on whether they show on public profiles.
- A toast for an unlock would be a variant of the existing `Toaster`, not a second system.

## Open

- Whether `/welcome` shows the app header or only the minimal bar of the prototype
  (CheevoVault + "Saltar todo").
- The RA step: an inline form (v2) or the existing `RaLoginModal`; inline reads better, but
  its logic must be shared, not copied.
