# Worklog

What each working session did, so the next one (a person or an agent) starts
with the context instead of rediscovering it. **Newest first.** `git log` says
*what* changed; this says *why*, what was tried and dropped, and what is still
open.

## How to write an entry

Add it at the top, before your last commit (so it ships in the same PR).
Keep it short — a few lines per heading; leave out a heading with nothing in it.

```md
## YYYY-MM-DD — <short title> (`<branch>`)

**Did** — what changed, at the level of features or files, not every line.
**Why** — the problem or the user's request.
**Decisions** — choices made and the reason; what was rejected and why.
**Open** — what is left, known bugs, follow-ups, things to check on the preview.
**Watch out** — anything surprising the next person would trip on.
```

Facts that must keep holding go in `CLAUDE.md`, not here; an entry can say
"added X to CLAUDE.md".

---

## 2026-10-14 — README and internal docs (`docs/readme-and-agent-docs`)

**Did** — Rewrote `README.md` (it still described Next 14, Steam over OpenID,
PSN "coming soon", 8 themes and the pre-1.0 gates). Added `docs/README.md`
(index), `docs/architecture.md` (map of the code and data flow) and this
worklog. Moved the old Steam plan to `docs/archive/` with a note on what no
longer holds. Added the "Documentation — MANDATORY" section to `CLAUDE.md`.
**Why** — The user wanted the docs brought up to date, and every future agent
to leave a written record of what it did.
**Decisions** — Rules stay in `CLAUDE.md` (it is loaded into every agent's
context); the README is for people landing on the repo and points there
instead of copying the Email/Sessions sections, which had gone stale twice.
The worklog is one file, newest first, so reading the top is enough.
Then, on the same branch: a rule in `CLAUDE.md` → Pull requests that a PR is
never opened without its full description and that it is updated whenever more
commits change what it says, plus `.github/pull_request_template.md` so PRs
opened on the web start from the same template. And
`.github/workflows/pr-description.yml`, the first GitHub Action in the repo: it
fails a PR whose description is missing a section or leaves one blank.
**Watch out** — For the check to block merging it must be added as a required
status check, named `pr-description`, in a ruleset on `develop` and `main` (GitHub settings,
not code). The user created it as `pr description`, **with "require branches to be
up to date" on, by choice**: every PR now has to merge its base in before it can
merge, and `version.ts`/`package.json` will conflict when the base moved (keep the
higher version). Written down in `CLAUDE.md` → Environments. The body reaches
the script through `env`, never `${{ }}` inside `run:`, so a PR description
cannot inject shell.
**Open** — Nothing from this session.
