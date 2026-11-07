# MS — everything outside `src/`, and documentation drift
Auditor notes: The tooling is small and healthy: every dependency is used, hooks and workflows are short and clear, `public/` is tiny. The real problem is **documentation volume**. `CLAUDE.md` is 1459 lines / 111 KB (about 28k tokens read at the start of every session), with 103 dated entries and 37 "the user's call"; it is both the rules and the project's diary. It contradicts itself in at least 9 places. `docs/worklog.md` is 2460 lines / 198 KB with 137 entries and has outgrown its job. A few tracked leftovers (`tasks/`, `commit_all.tmp.sh`, `tailwind.config.ts`) are dead.

## Findings

### MS-01 · HIGH · rule (docs maintenance)
- **Where:** `CLAUDE.md` (whole file, 1459 lines)
- **What:** Rules an agent must obey on every task are mixed with release history, measurements, per-platform internals and a dated changelog. Sizes: Xbox 104 lines (L644-747), PSN 60, Performance 72 + Data loading 52, Welcome 65, Vault 60, Versioning 56, Steam/RA sign-up 57, Email 43, Roadmap 75, Git 150. The file asks agents to "update CLAUDE.md when a rule changes", so it only grows. Every session pays ~28k tokens, and the contradictions in MS-02 follow from the size: nobody can re-read it to check.
- **Fix:** split as in "Proposed structure" below. Target: CLAUDE.md about 370 lines / 28 KB (a quarter of today), everything else moved to `docs/` with one pointer line per area.
- **Size:** 1459 → about 370 lines.

### MS-02 · HIGH · rule (contradictions inside CLAUDE.md)
Each checked against the code:
1. L985 "Xbox 5 a pass" vs `PACE.xbox.perPass: 2` (`src/lib/scoreRefresh.ts:50`) and L745 ("Xbox score reads two games per pass", #87). Code and #87 are right.
2. L251 "Streaks are coloured by tier ... replaces 'streaks in the accent'" vs L313 "**Streaks are in the accent**; amber only in the streak page's hero". L313 is stale.
3. L1059 names `showcaseFromUnlock` as how an unlock maps to a showcase entry. It is exported in `src/utils/showcase.ts:61` and used **only by its own test** (dead code; for the src auditors).
4. L1376 "Spanish UI text is intentional — do not change it" vs the i18n rule L430-437 (all strings via `T`, 9 languages, gender neutral). The UI is in 9 languages. Reword to "do not translate or 'fix' existing Spanish text" or drop.
5. L436 "New strings → add to both `en.ts` and `es.ts`" vs L176/211/925 "all nine languages" and the README ("every file under `src/translations/`"). The `Translations` type forces every key; L436 is stale.
6. L22 "Pure transforms: `src/utils/utils.tsx` (NOT apiCallsUtils)": `utils.tsx` is a 523-line grab bag, `apiCallsUtils.tsx` (117 lines) still exists and is used, and `src/utils/` has 110 files mostly named per topic. The rule describes a structure nobody follows.
7. L35-36 "Hooks own ... `hasFetched = useRef(false)` pattern lives in hook": only 11 of 232 files in `src/hooks` use `hasFetched`. The loading model since #101 (L884+, `request()` in the context, "loads on its first reader") replaced it.
8. L426 "Toggles → `role="switch"` + `aria-checked`" vs L243 "never a hand-made `role="switch"`" and L283 (`Switch`, `ToggleButton`). Reword to "use `Switch`/`ToggleButton`".
9. L471 "`1.5.0` — current on `develop` (not yet on `main`)" and L484 "`1.6.0` — on `feat/social-rankings`" are October branch states; 1.7.0 shipped (L489) and `APP_VERSION` is 1.7.18.
10. L1382 roadmap `[ ] An internal component library` is unchecked while L276 documents it as built; L1409 `[x] Steam linked by name` was replaced on 2026-10-21 (said in the same bullet); L1379-1450 is mostly checked-off history.
11. L656 "~4 calls" per new Xbox user vs L681 "The ~3-call figure": the second explains itself, but a reader sees two numbers.
12. L1453-1459 "This is NOT the Next.js you know" duplicates `AGENTS.md` (untracked, rewritten by `next dev`). Keep one.
- **Fix:** correct 1-8 now (one-line edits); delete 9, 10, 12 in the restructure.
- **Size:** about 20 lines changed.

### MS-03 · MED · rule (repeated rules)
- **Where:** "No Xbox while admin-only": L103, L131, L644+, L731 (4 places). "All nine languages": ~8 places. "gender neutral": L431 and welcome. "never fetch at mount": L884 and L934. "fresh from the row": Sessions, Email, Admin. Xbox quota: L656, L681, L731-747 and `docs/87-xbox-quota-hardening-spec.md`. Steam link/unlink rules: L1185-1225 and Sessions.
- **What:** the same invariant restated per feature; each copy can drift (MS-02 #1 is one).
- **Fix:** state each invariant once, in the section that owns it; the others link to it. The `uiGuard` and `designTokens` tests already enforce most design rules (L213-335): keep one line per rule, not the history of why.
- **Size:** about 100 lines saved.

### MS-04 · MED · size (worklog)
- **Where:** `docs/worklog.md` (2460 lines, 198 KB, 137 entries, Sep to Nov 2026)
- **What:** Newest-first and read from the top, so it still works as a start-of-session note. But it is larger than all the rest of `docs/` (outside audits) and many entries restate `git log` and PR bodies. The `union` driver can drop the `---` or reorder entries.
- **Fix:** keep it, but cut at a release boundary: move everything older than v1.7.0 (2026-11-02, line 79) to `docs/archive/worklog-2026-09-to-11.md` (about 2300 lines out, about 150 left). Repeat at each release. Keep the did/why/decisions/open/watch-out template.
- **Size:** 2460 → about 150 live lines.

### MS-05 · MED · dead (tracked leftovers)
- **Where:** `commit_all.tmp.sh` (tracked; one-off script reading `/tmp/mod.txt`), `tasks/plan.md` + `tasks/todo.md` (tracked; the finished #88 plan, 70 lines, referenced nowhere in `docs/` or CLAUDE.md), `tailwind.config.ts` (tracked; Tailwind v4 reads no JS config without an `@config` line, `src/app/globals.css` has only `@import "tailwindcss"`, nothing imports it, so its `content` list is ignored), `docs/brand/cheevovault-logo-source.png` (200 KB next to the 1 KB SVG).
- **Fix:** delete `commit_all.tmp.sh` and `tailwind.config.ts`; move `tasks/*` to `docs/archive/` or delete (#88 is in the worklog); keep the logo source only if the owner wants it.
- **Size:** about 190 lines and one config.

### MS-06 · MED · rule (docs/README index and stale plans)
- **Where:** `docs/README.md`; `docs/welcome-plan.md:1` ("plan (not started)", the welcome is built); `docs/xbox-integration-plan.md` (Spanish, "análisis, spike hecho"; shipped admin-only); `docs/ui-library-and-designs-plan.md` (README says "not started"; the library is built)
- **What:** The index omits `welcome-look-plan.md`, `xbox-integration-plan.md`, `audits/` (2.2 MB, 2.1 MB of it the 24 JPGs of `78-round-design`) and `brand/`. Finished plans sit in `docs/` although the README says to archive them; `archive/` has one file.
- **Fix:** move `welcome-plan`, `welcome-look-plan` (after folding its reasons into a Welcome doc), `xbox-integration-plan`, `ui-polish-roadmap`, `ui-polish-v2-plan` (already "historical") to `archive/`; mark `ui-library-and-designs-plan` as built; add the missing rows. Keep `rankings-plan` (status line says built, CLAUDE.md points to it).
- **Size:** about 1100 lines leave the live docs.

### MS-07 · LOW · rule (README drift)
- **Where:** `README.md` stack table "two daily crons (`vercel.json`)" vs `vercel.json` (3 crons: sweepCache, psnToken, scores). The rest checked and accurate (22 themes, 9 languages, scripts, layout).
- **Fix:** say "daily crons".

### MS-08 · LOW · rule (no automated test/lint/build gate)
- **Where:** `.github/workflows/` has only `pr-description.yml` and `pr-issue.yml`. CLAUDE.md says "Never merge a PR with failing npm test/lint/build", but nothing runs them (only Vercel's build).
- **Fix:** optional `ci.yml` (`npm ci && npm run lint && npm test`), or soften the wording. The owner's call.

### MS-09 · LOW · dead
- **Where:** `public/media/3DSa.png` (732 B) is referenced nowhere; `src/constants/index.ts` has no 3DS entry. Every other file in `public/` is referenced.
- **Fix:** delete it, or wire it up if 3DS games lack a console icon (check `constants`).

### MS-10 · LOW · rule (Style rule vs root config)
- **Where:** CLAUDE.md L1374-1377 "Single quotes, no trailing semicolons"; `next.config.ts`, `jest.config.js`, `postcss.config.mjs` use double quotes and semicolons.
- **Fix:** write "in `src/`" in the rule.

### MS-11 · LOW · rule (migrations bookkeeping)
- **Where:** `migrations/` (43 files, 002-044, no gaps, no 001); "applied to pre/production on <date>" sentences are scattered through CLAUDE.md (L444-490, L515, L600, L630, L1193, ...).
- **Fix:** a `migrations/README.md` table (number, purpose, applied to pre, applied to prod) replaces them; CLAUDE.md keeps one line: "any migration newer than prod's must be applied before the code".

## Dependencies and scripts (question 1)
- Every `dependencies` entry is imported in `src/`: `@dnd-kit/*` (6/20/11 files), `@tabler/icons-react` (231), `bcrypt` (11), `framer-motion` (56), `next-auth` (253), `pg` (db.js and tests), `psn-api` (2), `recharts` (1, the lazy plot, as designed). DevDependencies are all used by the babel/jest/eslint/tailwind/postcss/typescript configs. **No unused dependency.**
- `.env.example` vs `process.env` in `src/`: complete, except platform-provided `NODE_ENV`, `VERCEL_ENV`, `VERCEL_URL` and test-only `RA_API_KEY`. No unused variable in `.env.example`.
- Scripts: `demo-rankings.mjs`/`demo-personas.mjs` (README, CLAUDE.md), `measure-api-calls.js` (CLAUDE.md, needs Playwright via MCP, which is not a dependency; header says so), `merge-version.js` (wired in `prepare`, tested). None orphaned. `package.json` has the 6 standard scripts.
- Untracked/ignored clutter: `.playwright-cli/` is untracked and not in `.gitignore` (add next to `.playwright-mcp/`); `src/graphify-out/` holds only a cache folder (ignored; delete locally); `AGENTS.md` untracked.

## Proposed structure for CLAUDE.md (question 2)
**Stays (rules every task must obey, about 370 lines):**
| Block | Now (lines) | After |
|---|---|---|
| Project, stack, structure/naming/file order, sub-component rule | ~50 | 45 (fix MS-02 #6, #7) |
| State and effects, toasts, API error handling, testing, documentation rule, standards (responsive, a11y, i18n), style | ~120 | 100 |
| Design system, component library, entrances: only rules the guard tests do not already enforce, plus "read `docs/design-system.md`" | ~190 | 45 |
| Data loading and performance: the ~10 "never do X" lines (no fetch at mount, `useAuthSession`, `cachedJson`, lazy modals with `loading`, recharts only lazy, no client code reaching `pg`) | 124 | 30 |
| Sessions, admin, email: invariants only | ~120 | 45 |
| Platforms: a short invariant list each (RA whose key, Steam through Steam only, PSN shared account and not unique, Xbox admin-only and why) | ~290 | 40 |
| Git, issues, commit rules, PR template pointer, "never Co-Authored-By" | ~150 | 55 |
| Versioning: scheme and auto-bump only | 56 | 10 |

**Moves to `docs/` (history, measurements, per-feature specifics):**
- `docs/platforms/{xbox,psn,ra,steam}.md`: measured findings, data shapes, caches, quotas, the failure table (Xbox 104 + PSN 60 + RA 22 + Steam 57 + 14).
- `docs/performance.md`: Performance rules and Data loading with their dates and measurements.
- `docs/welcome.md`: Welcome and the "keeps the app current" checklist (CLAUDE.md keeps 6 lines: never blocks, no Xbox, follows the app).
- `docs/social.md`: presence, follows, showcase, hidden games, completion dates (rankings already have `rankings-plan.md`).
- `docs/releases.md`: milestones 1.0-1.7, release gates (all closed: keep the 6 env/domain conditions as a checklist), environment set-up (Neon pre branch, demo users).
- `docs/roadmap.md` or GitHub Issues: the 75-line roadmap, checked items deleted.
- `migrations/README.md` (MS-11).
- Delete: dates in headings, "the user tried it and did not like it" stories (worklog material), the duplicated Next.js block.

**Result:** about 370 lines / about 28 KB (-75 %). New rule to stop regrowth: **CLAUDE.md holds rules, not events; a dated fact goes in the worklog or the area doc.**

## Cross-area notes
- `showcaseFromUnlock` (`src/utils/showcase.ts:61`) is dead outside its test: utils auditor.
- `src/utils/utils.tsx` (523 lines) and `apiCallsUtils.tsx` (117): utils auditor to judge whether to split by topic.
- Hooks: `hasFetched` appears in only 11 of 232 hooks; check whether those still follow the older pattern the provider model replaced.
- `public/media/3DSa.png` / console icons: constants owner to check whether 3DS has no icon.
- 2.1 MB of JPGs in `docs/audits/78-round-design/` are tracked (`.git` is 18 MB): fine as evidence, but heavy.

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `package.json` | 51 | ok (all deps used) |
| `package-lock.json` | - | generated, not read |
| `next.config.ts` | 105 | ok |
| `next.config.test.ts` | - | test, not audited |
| `tsconfig.json` | 38 | ok |
| `tsconfig.build.json` | 5 | ok |
| `eslint.config.mjs` | 55 | ok |
| `jest.config.js` | 52 | ok |
| `jest.setup.js`, `jest-dom.d.ts`, `babel.config.js` | small | ok |
| `postcss.config.mjs` | 7 | ok (MS-10) |
| `tailwind.config.ts` | 15 | MS-05 |
| `vercel.json` | 17 | ok (MS-07) |
| `.gitattributes` | 7 | ok |
| `.gitignore` | 48 | ok (add `.playwright-cli/`) |
| `commit_all.tmp.sh` | ~30 | MS-05 |
| `tasks/plan.md`, `tasks/todo.md` | 70 | MS-05 |
| `AGENTS.md` | 9 | MS-02 #12 |
| `.githooks/commit-msg`, `.githooks/pre-commit` | 18 / 36 | ok |
| `.github/workflows/pr-description.yml`, `pr-issue.yml` | 95 total | ok (MS-08) |
| `.github/pull_request_template.md`, `ISSUE_TEMPLATE/*` | small | ok |
| `.claude/settings.json` | 6 | ok |
| `.env.example` | - | ok (checked against `process.env`) |
| `scripts/demo-personas.mjs` | 234 | ok (data) |
| `scripts/demo-rankings.mjs` | 455 | ok (documented and guarded; not read line by line) |
| `scripts/measure-api-calls.js` | 67 | ok |
| `scripts/merge-version.js` | 46 | ok |
| `migrations/` (43 files) | - | names and numbering only; MS-11 |
| `public/icon.svg` | - | ok |
| `public/media/*` (14 files) | 36 KB | MS-09 |
| `__mocks__/` (13 files, 1-31 lines each) | small | ok |
| `src/graphify-out/` | cache only | ignored by git; stray |
| `CLAUDE.md` | 1459 | MS-01, MS-02, MS-03, MS-10 |
| `README.md` | 149 | MS-07 |
| `docs/README.md` | 31 | MS-06 |
| `docs/worklog.md` | 2460 | MS-04 |
| `docs/architecture.md` | 204 | ok (spot-checked #101 routes, welcome, Xbox) |
| `docs/design-system.md`, `design-process.md`, `designs.md` | 119 / 64 / 19 | ok |
| `docs/rankings-plan.md` | 182 | ok |
| `docs/87-xbox-quota-hardening-spec.md` | 101 | ok |
| `docs/welcome-plan.md`, `welcome-look-plan.md` | 249 / 41 | MS-06 |
| `docs/xbox-integration-plan.md` | 276 | MS-06 |
| `docs/ui-library-and-designs-plan.md` | 321 | MS-06 |
| `docs/ui-polish-roadmap.md`, `ui-polish-v2-plan.md` | 248 / 346 | MS-06 (already marked historical) |
| `docs/archive/steam-integration-v2-plan.md` | - | ok |
| `docs/audits/*` | 1200 + 24 JPG | cross-area note (size only) |
| `docs/brand/*` | 2 files | MS-05 |
