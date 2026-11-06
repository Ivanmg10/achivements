# Visual audit brief (issue #77) — read this whole file before starting

You are one of several visual auditors of CheevoVault (`C:\Users\Ivan\achivements`), an achievements tracker for
RetroAchievements, Steam, PlayStation and Xbox. **Report only: never edit, create or delete repo files** except your
own output file. **Do not drive a browser** (one shared browser is in use by the coordinator): judge from the
screenshots already taken and from the code.

## The owner's words (what this audit is for)
- They like the site, its **structure and layout are loved**: do not propose changing page structure wholesale.
- But they feel it carries many **"vibecoded" traits** (what an AI-built site looks like) and they want the site to have
  **its own identity**. They **prefer simplicity**. They are open to **cutting or merging sections that are unnecessary
  or could be better**: propose it where you honestly think so, as a proposal.
- They like the **slanted** design and keep it. What bothers them, without being able to name it, is **how slanted is
  applied across pages**: it feels strange or inconsistent. They also feel slanted damaged the original **round**
  design's identity. Turn that feeling into concrete, repeated, nameable causes (angles, cuts, radii, borders, control
  shapes, tags, surfaces, combinations), with screenshot pairs.
- Their screen is 2560 px wide; phones matter too (390 px).

## Read first
1. `CLAUDE.md` (repo root), at least: the design system, component library, entrances, progress bars, favicon,
   the welcome. **The repo's rules win over any skill's taste**; where they clash, note the conflict.
2. `docs/design-system.md`.
3. Skills: `C:\Users\Ivan\.claude\skills\antislop\SKILL.md` (Part 1 patterns, Part 2 rules R-xx, Part 3 liveliness),
   `...\antislop-ui\SKILL.md`, `...\antislop-human\SKILL.md`, `...\antislop-layoutmobile\SKILL.md`,
   `...\antislop-copywriting\SKILL.md` (only for text you see on screen).
4. The code auditors' reports in `.audit/code/*.md` relevant to your screens (search them for your component
   names): reuse their findings by id (e.g. "see C-04") instead of re-deriving them; your job is what **shows**.

## Screenshots
`.audit/shots/<area>/<screen>__<shape>__<theme>__<width>.jpg`. shape = `slanted` | `round`, width = `390` | `2560`.
Areas: `app/` (signed in, theme dark), `public/` (signed out), `modals/` (viewport shots of dialogs), `themes/`
(21 themes, slanted). Full-page shots are tall: to see a detail, crop it:
`node .audit/crop.mjs <in.jpg> .audit/visual/crops/<name>.jpg <left> <top> <width> <height>` (no numbers = print size).
Shots were taken ~3.5 s after load; a section that still shows a skeleton or an empty chart may simply not have
loaded in time: say "possibly not loaded" rather than calling it a bug, unless the code confirms it.

## For every screen in your area, judge
1. **Vibecoded traits** (antislop Part 1): uniform card grids, kickers/eyebrows everywhere, uppercase tracked labels,
   glows, gradient washes, too many accents, badge/pill overload, icon-in-a-tile on everything, decorative borders,
   identical section rhythm, template copy. Name each and say whether it **earns its place** (purpose) or not.
2. **Identity**: what on this screen is already specific to CheevoVault, and what could be any app (the swap test).
3. **Slanted vs round** pair: what differs, what feels forced/inconsistent in slanted, whether round has a character
   of its own or reads as a degraded slanted.
4. **Hierarchy and simplicity**: one focal point? Too many things competing? What could go, merge or be quieter.
5. **People** (antislop-human): contrast you can see failing, tap targets at 390, focus, states (empty/loading/error).
6. **Mobile** (antislop-layoutmobile): overflow, cramped rows, text clipping, wasted space at 2560.
7. **Library**: a piece drawn differently from its sibling elsewhere (same thing, two looks) = a library finding.

## Output — write ONE file: `.audit/visual/<your-id>.md`
```
# <your-id> — <area>
Summary: <4–6 lines: the overall read of these screens, and the 3 things that most make them feel vibecoded>

## Screen: <name>  (shots: `app/home-classic__slanted__dark__2560.jpg`, …)
Identity: <what is ours / what is generic>
### <ID>-01 · HIGH · <category>
- **See:** <shot path> (+ crop path if made), around <where on the screen>
- **What:** …
- **Why it reads vibecoded / why it matters:** … (antislop R-xx or CLAUDE.md rule)
- **Code:** `src/...` (+ code finding ids if one covers it)
- **Proposal:** <concrete: token change, library piece, remove/merge, copy rewrite>. Mark **[cut/merge proposal]**
  when it removes or merges a section.
…
## Slanted vs round in this area
<paired observations with shot paths; repeated causes>
## Cross-cutting patterns seen
<patterns that repeat across screens; these are the highest-value fixes>
```
Categories: `vibecoded`, `identity`, `slanted`, `round`, `hierarchy`, `simplify`, `a11y`, `mobile`, `library`, `copy`,
`bug`. Severity HIGH / MED / LOW. Be honest and concrete; praise what works in one line per screen (it tells the owner
what to keep). Your final message to the coordinator: counts, top 5, the slanted/round causes you found.
