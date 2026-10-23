# How UI work is done here: idea → design → iterations → development

Written 2026-10-23, after the welcome (`/welcome`, branch `feat/welcome-onboarding`), which the
user liked both for how it turned out and for how it was reached. **Any new page, section or
visual rework follows this.** The welcome is the worked example: `docs/welcome-plan.md` and its
design canvas (linked there).

## 1. Idea and references

- Start from what the user asks for and what they point at. They often bring a reference from a
  game (the welcome came from Inazuma Eleven: Victory Road's change of day): **study it for
  real**. For a video, pull frames (every 0.5 s, then every 0.1 s around the moment that
  matters) and write down the timings, the shapes and *why* it works, before drawing anything.
- Read the code it touches (what exists, what can be reused, which rules in `CLAUDE.md` apply:
  i18n, accessibility, platforms, Xbox admin-only, progress bars in the theme's colours…).

## 2. Design — several concepts, clickable

- **Figma** when its connector is authorised in the session (it is the user's word for "the
  design"); **otherwise a design canvas artifact** on claude.ai with live, clickable artboards
  (that is what the welcome used, and the user was happy with it: animations can be tried, which
  a static frame cannot do). Say which one is being used and why.
- **Several concepts, not one**: four for the welcome (A–D), each with its own idea, plus the
  analysis of the reference as its own artboard. Recommend one and say why.
- **Record it in `docs/designs.md`** as soon as it exists (date, link, what it is for), and keep
  its entry current: versions, which one was agreed, which branch built it.
- Prototypes use the app's real tokens (backgrounds, accent, Inter, radii) and real copy in the
  user's language (Spanish), not lorem ipsum. Tweaks for the scenarios that matter (registered
  with Steam, reduced motion, a refused key, the browser's language…).

## 3. Iterations with the user

- Each round is a **new row on the canvas (v2, v3, v4…)**; the old ones stay, with a sticky note
  saying what replaced them and why. The plan doc (`docs/<topic>-plan.md`) records the same.
- **Change only what was asked.** Lesson from the welcome's v2: the user said the step bar did
  not fit and v2 restyled everything; they had liked the rest. Ask when "this does not fit" could
  mean the whole thing or one part.
- Fix the bugs they show in screenshots in the prototype too, so the reference stays right.
- When they say "integrate it", the canvas version that was agreed is the spec.

## 4. Development

- A plan doc first (`docs/<topic>-plan.md`): what is in, what is reused, what is left.
- Build in the repo's way (components and sub-components extracted, hooks in `src/hooks/`, texts
  in `T` in all nine languages, tests for every hook and component) and reuse the account page's
  logic rather than a second copy (the welcome reused `useRaLink`, `useSteamLink`, `usePsnLink`,
  `UserProfileSwitch`, the theme and language contexts).
- **The user tries it on their own screen (2560 px) and sends screenshots**; expect several short
  rounds after the first integration (the welcome had: too small on 2K, the curtain too quick,
  then too abrupt, a transition trapped inside a card, gendered copy, an overlapping row).
  Each round: fix, test, a worklog entry, a commit (never a push unless they say so).

## Lessons that apply to any page

- **Big screens**: check 1536 px and 2560 px, not only a laptop. Scale with rem (the welcome
  raises the root font size), never CSS `zoom` (it breaks Framer Motion's layout animations).
- **Anything that must cover the screen goes through a portal** to `<body>`: a `transform` or
  `backdrop-filter` on any box around it traps `position: fixed`.
- **Motion**: long enough to be read (the welcome's curtain is 2.2 s), eased in and out, content
  that arrives as the cover leaves; always a reduced-motion path.
- **Copy is gender-neutral** in every language (`CLAUDE.md` → i18n).
- **Sketches over fake screenshots** when the real thing would show someone's data or go stale;
  say they are illustrations.
- A native `<select>` puts its arrow against the edge: draw your own (`appearance-none`).
