# Welcome after sign-up — plan (not started)

Written 2026-10-22 on `feat/welcome-onboarding` (cut from `feat/steam-sign-in`, PR #46,
not merged yet). Design exploration only; no code yet. The user picks a concept before
anything is built.

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
- **E** the recommendation, A + B: A's transitions between steps, B's unlock on link;
  plus the RA step in detail (guided "where is my key"), mobile, and a motion spec.

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
- **Toasts**: a link's success should go through `notify` (`src/lib/notify.ts`), perhaps
  with an "achievement" look, not a second toast system; an error inside the step stays
  inline (CLAUDE.md, toasts).
- **Colours**: the curtain from the theme accent; platform colours only inside the band and
  the logos, never on a progress bar.
- **Texts** in `T.welcome`, all languages; components extracted per step; tests for the
  hook (step state, hash), the sign-up redirect and each step's render.

## Open

- Which concept (or mix). The recommendation is E.
- Whether `/welcome` shows the app header or is full screen (the prototypes are full screen).
- Whether onboarding "achievements" (concept B) should exist at all as a word: the rankings
  plan advises that CheevoVault's own achievements give no points; these would not.
