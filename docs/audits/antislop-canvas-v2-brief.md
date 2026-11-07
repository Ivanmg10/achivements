# Brief: the antislop design canvas, done again (#126, 2026-11-07)

For a new session. The first canvas was made at the end of a very long session and the owner judged it uneven.
Redo it **from zero, in a new canvas**, with what was learned. Its identity and theme choices are not binding; only the two points marked "chosen" below are. Read this whole file before doing anything.

## What the owner wants

A new design canvas (claude.ai Design type: start with the Artifact tool's `quickstart`, intent `design`) with four
pages, each a clear proposal:

1. **Identidad. From zero.** The first canvas's choice (its direction "B") is **not** a starting point: the owner wants
   identity proposed again, properly. Start from the audit's diagnosis (report 2.1–2.5: why slanted feels off, what round
   is today, what is already ours) and propose directions of your own, each on the real pieces (header, tabs, game row,
   figures, podium, segmented control, switch, buttons, weekly bars), in **slanted and round**, in Dark and in Venom (the
   owner's own theme), with today beside them.
2. **Mejoras por pantalla** (it was "Recortes"; the owner **rejected** the cuts: they took the site's personality away).
   Now: screen by screen, the owner's **real capture** with numbered marks on it, each a small improvement that keeps the
   look (bugs, clarity, coherence, copy, legibility), with "what" and "fix" in one line each; anything that changes the
   look is marked "Opcional". The owner approved this format on 2026-11-06. Start with the Home; the first version of
   that board (13 points) is in the old canvas (`MejHome.dc.html`) and is a good base. Then Following, public profile,
   account, library/game pages, rankings. The findings per screen are already written: `docs/audits/antislop-v17/visual/V1.md`
   (home) to `V4.md`, `V7.md` (colour).
3. **Temas. From zero.** The first canvas's list is **not** a starting point. Propose the theme list again, properly:
   which themes, why, and where each removed one goes (whoever uses it must keep a theme close to theirs). The only
   facts to respect: the audit's findings (V7: contrast failures, near-duplicates) and that a theme is never removed
   without a successor. Present each theme as a small real screen in its colours (from `globals.css`), not just swatches.
4. **Landing.** The **first screen is chosen**: "Primera pantalla 1 v2" (old canvas, `LandH1b.dc.html`). Reuse it as it is:
   title on top like the Metal Gear Solid 2 logo, the logo in a signature colour (violet) where MGS2 has its red "2", one
   slowly drifting blurred art background (no tile seams), "Crear cuenta" and "Iniciar sesión" (no Steam button: the owner
   calls Steam sign-in a gimmick here), the disclaimer line at the bottom like MGS2's copyright. **Propose what goes below**
   it (the sections that explain the site), in the same spirit. Then the phone version of the whole page.

## How to work with the owner

- **Reply in Spanish.** Code, commits and docs in English.
- **One thing at a time.** The owner got lost when several points came in one message ("me estás liando, paso a paso").
  Present one page, ask one question, wait. Short messages.
- The owner's process: `docs/design-process.md` and CLAUDE.md "How UI work is done". Each round changes **only** what the
  owner asked. Every round goes into `docs/designs.md` (a new row for this canvas; the old one stays as history).
- The owner looks at it on a 2560 px screen and also uses Firefox.

## Mistakes the first canvas made (do not repeat)

- **Minimalism sold as antislop.** The cut proposals were redrawn flat and took colour, art and density away. Rejected.
  Antislop removes repeats, bugs and hand-made copies of library pieces; it keeps what makes the site CheevoVault.
- **Pasted screenshots as product shots.** The landing's sections v3 used crops of the app, scaled up 12–20 % (blurry,
  stretched). The owner: "feísimo y super cutre". Draw pieces crisply from the real tokens and covers, composed as a scene;
  real captures belong only on the improvements page, at their own size, as the "today" being annotated.
- **Template layouts.** Landing v2's sections were the AI zig-zag (text/picture ×3, FAQ, closing CTA card) with a "/" before
  every heading; the italic title-screen menu ("Crear cuenta / Entrar / Continuar con Steam") did not fit the site.
- **Invented copy.** Use the real texts: `T.landing` in `src/translations/es.ts` (tagline, intro, library/organise/progress
  texts, the real FAQ). A new text is marked as new.
- **Generic concepts.** The owner's standing rule: grounded in the real code and art, with "today" beside each proposal.

## Inputs

- The audit: `docs/audits/antislop-v17.md` (Part 2 visuals: 2.1 AI traits, 2.2 what is already ours, 2.3 why slanted feels
  off, 2.4 round, 2.5 the directions, 2.8 landing inputs; 3.7 the owner's answers). Appendices `docs/audits/antislop-v17/`.
- Tokens: `src/app/globals.css` (themes, `[data-shape="round"]`), `docs/design-system.md`, `src/components/ui/`.
- Captures (git-ignored, on this machine): `.audit/shots/app2/` (real slanted/round pairs, Venom, 2560 and 390, taken with
  the account's preferences intercepted), `.audit/shots/app/` (the account's own look: slanted Venom), `.audit/shots/public/`.
- The old canvas: https://claude.ai/artifact/LKJhzx7w5PTcsDqV5Fvj1c (read it with the Artifact tool). Its sources and the
  images it used are copied in `.audit/canvas126-v1/` (`project/*.dc.html`, `assets/`: the owner's covers, the art wall,
  three avatars from the rankings, the MGS2 reference, crops of today). Its uploaded images can be copied server side into
  the new canvas (`from_url` + `asset_ids`; list them with `scope: "assets"`).

## Rules that bind this work

- **No Xbox** on anything public (landing): Xbox is admin-only.
- **The logo is never redrawn**, only recoloured (paths in `src/utils/themeIcon.ts`, `LOGO`).
- Never change the owner's account or preferences to take a capture: intercept `/api/preferences` and `/api/me/bootstrap`
  in Playwright and block writes (CLAUDE.md, the antislop section).
- No numbers, people or claims that are not real on the landing (the rankings' podium shows real public users only if the
  owner agrees).
- Commit, never push. No `Co-Authored-By` or "Generated with" lines. Branch: `chore/77-antislop-pass`.
- Subagents only if the owner asks; Sonnet for mechanical work, Opus for judgement, always pass `model`.
