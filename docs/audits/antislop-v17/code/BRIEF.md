# Code audit brief (issue #77) — read this whole file before starting

You are one of several auditors, each owning one area of the repo `C:\Users\Ivan\achivements`
(Next.js 16 App Router, React, TypeScript, Tailwind v4, PostgreSQL). The site was largely written by AI
over many sessions. The owner wants it to be **code a human can maintain alone**: reviewed file by file,
with care. This is an **audit: report only. Never edit, create or delete any file in the repo** except your
own output file named in your task.

## Read first
1. `CLAUDE.md` at the repo root, in full. It is the project's law. **If a finding contradicts a rule there,
   the rule wins**: do not propose breaking it (note the tension instead).
2. `C:\Users\Ivan\.claude\skills\antislop-code\SKILL.md` (comment hygiene).
3. For UI areas (components, app pages, CSS): also `C:\Users\Ivan\.claude\skills\antislop-ui\SKILL.md` and
   `docs/design-system.md` (tokens, library, what the guard tests refuse).

## What to look for, in every file of your area
| Category | What |
|---|---|
| `size` | A function, component or file much longer than it needs to be (the "200 lines that could be 50"). Give an honest estimate `now → could be`, and say **how** (what to cut, what to reuse). |
| `comments` | Generic AI comments: restating the code, narrating, changelog-in-comments ("now uses X instead of Y"), headers that label the obvious, comments longer than the code. Keep comments that explain *why*, a constraint, a measured fact, a trap. Quote the offending comment. |
| `duplication` | The same logic or JSX in 2+ places. Name **every** place you found (grep the whole `src/`, not only your area). Propose where the single version should live (an existing helper if one exists). |
| `dead` | Exports nobody imports, props never passed, branches that cannot run, leftovers, files unused. Verify with grep across `src/` before claiming. |
| `abstraction` | Over-engineering: an indirection with one user, a config for a constant, a wrapper that adds nothing, a hook that could be a function, generic machinery for one case. |
| `library` | A pattern drawn by hand that should be (or already is) a piece of `src/components/ui` (or a shared component). Includes components bypassing tokens: hard-coded colours, sizes, radii, shadows, ad-hoc class strings repeated across files. |
| `rule` | A violation of a CLAUDE.md rule (state, effects, fetch error handling, i18n, a11y, naming, file order, sub-component extraction). |
| `naming` | Misleading names, typos baked into names (e.g. `achivement`), inconsistent naming for the same concept. |

Severity: **HIGH** = hurts maintainability a lot or is repeated widely (a bug in waiting, 3+ copies, a 300-line
file that should be 80). **MED** = clear improvement, local. **LOW** = polish.

Be **concrete and honest**. Do not pad: a clean file is "ok". Do not report style nits the linter covers. Do not
propose behaviour changes. Every claim must be checked in the code (open the file, grep the callers).
Read every file **in full** (non-test `.ts`/`.tsx`/`.css`). Tests: do not audit them, except note a test file
that is clearly duplicated or grossly oversized for what it covers (one line in the table).

## Output — write ONE file: `.audit/code/<your-id>.md`

```
# <your-id> — <area name>
Auditor notes: <2–4 lines: overall impression of the area, the main theme of its problems>

## Findings
### <ID>-01 · HIGH · duplication
- **Where:** `src/path/File.tsx:42-80`, `src/other/Other.tsx:10-50`
- **What:** <one or two sentences>
- **Fix:** <concrete: what to merge/cut/reuse, where it lives after>
- **Size:** <lines now → after, if relevant>

### <ID>-02 · ...

## Cross-area notes
<patterns you saw that probably repeat beyond your area; things another auditor should check>

## Coverage — every file reviewed
| File | Lines | Verdict |
|---|---|---|
| `src/...` | 120 | ok |
| `src/...` | 340 | <ID>-01, <ID>-04 |
```
Number findings in order of severity (HIGH first). The coverage table must list **every** non-test file in your
area; that table is how the owner knows the whole project was reviewed.

Your final message (to the coordinator) is short: counts by severity, the 5 most important findings in one
line each, and anything you could not finish.
