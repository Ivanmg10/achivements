# Internal docs

What to read, and when.

| File | Read it |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Always, first. The rules every task obeys, one line each, with a link to the doc of each area below. |
| [`worklog.md`](worklog.md) | At the start of a session (the last few entries), and at the end (add yours). |
| [`architecture.md`](architecture.md) | When you need to find where something lives, or how a request travels from a page to RA/Steam/PSN/Xbox and back. |
| [`accounts.md`](accounts.md) | Before touching sign-up, sign-in (form, Steam, RetroAchievements), sessions, email or the admin panel. |
| [`platforms/`](platforms) | Before touching a platform's calls: [`ra.md`](platforms/ra.md), [`steam.md`](platforms/steam.md), [`psn.md`](platforms/psn.md), [`xbox.md`](platforms/xbox.md), and how each one fails ([`README.md`](platforms/README.md)). |
| [`87-xbox-quota-hardening-spec.md`](87-xbox-quota-hardening-spec.md) | Before changing OpenXBL quota, timeout, stale/cache, telemetry, activity scans or Following/score limits; the approved #87 contract. |
| [`performance.md`](performance.md) | Before adding a fetch, a provider, a modal, a chart or a cached route: the performance rules and what each page loads. |
| [`library.md`](library.md) | Before touching a list of games: synced preferences, consoles to show, hidden games, completion dates. |
| [`social.md`](social.md) | Before touching presence, follows, the showcase, Vault Points or the rankings. |
| [`rankings-plan.md`](rankings-plan.md) | Before changing the Vault Points formula, levels or account verification: the decisions and balance tests. |
| [`welcome.md`](welcome.md) | Before touching `/welcome`, and whenever a change adds a platform, a feature, a profile field or a preference (the welcome follows the app). |
| [`i18n.md`](i18n.md) | Before touching how a language is picked or loaded, adding a language, or naming a thing in the UI (the vocabulary). |
| [`releases.md`](releases.md) | Before a release, a migration or an environment change: milestones, release gates, environments, the migrations table. |
| [`roadmap.md`](roadmap.md) | Before starting something new: what is pending and which ideas need the owner first. |
| [`design-process.md`](design-process.md) | Before any new page, section or visual rework: how UI work is done here (idea → design canvas → iterations → development), with the welcome as the example. |
| [`design-system.md`](design-system.md) | Before building any page, section or piece of UI: the layers (tokens, library, pages), the rules in full, the catalogue at `/design` (admins) and the flow for adding a piece. |
| [`designs.md`](designs.md) | To find any design made for the app (Figma or canvas) and which version was built; add an entry for every new one. |
| [`ui-library-and-designs-plan.md`](ui-library-and-designs-plan.md) | The component library's plan, built and released in 1.7.0: why each piece looks as it does. Today's rules are in `design-system.md`. |
| [`audits/antislop-v17.md`](audits/antislop-v17.md) | Before any cleanup, refactor or visual change from #77: the whole-project audit (code, visuals, identity), its plan and the owner's open decisions; per-area reports in `audits/antislop-v17/`, the v2 canvas brief in `audits/antislop-canvas-v2-brief.md`. |
| [`audits/perf-security-apilimits-v17.md`](audits/perf-security-apilimits-v17.md) | The v1.7 performance, security and API-limits audit, with #101's measurements. `audits/78-round-design/` holds the round design's screenshots. |
| [`brand/`](brand) | The logo's source files. The logo keeps its shape (`CLAUDE.md`). |
| [`archive/`](archive) | Only for history: finished plans (the welcome, its style steps, Xbox's spike, the UI polish rounds, Steam v2) and the worklog before v1.7.0. Not true any more where they disagree with the docs above. |

## Where a piece of knowledge goes

- **A rule every task must obey** (a security property, a "never do X" that bites anywhere) →
  `CLAUDE.md`, one line, linked to its area's doc.
- **A rule of one area, with its reasons and measurements** → that area's doc above.
- **How the code is laid out** (a new folder, a new data path, a new cache) →
  `architecture.md`.
- **What a session did, why, what it tried and dropped, what it left open** →
  a new entry at the top of `worklog.md`. At each release, older entries move to `archive/`.
- **A plan for work not started yet** → its own file here (`docs/<topic>-plan.md`);
  move it to `archive/` with a dated note once it is done or abandoned.
- **Something about one function** → a comment next to it, not here.
