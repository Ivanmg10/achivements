# Internal docs

What to read, and when.

| File | Read it |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Always, first. The rules and invariants: code style, state and effects, auth, email, admin, each platform, git. |
| [`architecture.md`](architecture.md) | When you need to find where something lives, or how a request travels from a page to RA/Steam/PSN and back. |
| [`rankings-plan.md`](rankings-plan.md) | Before working on Vault Points, levels, the rankings page or account verification. |
| [`worklog.md`](worklog.md) | At the start of a session (the last few entries), and at the end (add yours). |
| [`archive/`](archive) | Only for history. Plans and notes that are no longer true. |

## Where a piece of knowledge goes

- **A rule that must keep holding** (a security property, a "never do X", how a
  platform must be called) → `CLAUDE.md`, in the section of its area.
- **How the code is laid out** (a new folder, a new data path, a new cache) →
  `architecture.md`.
- **What a session did, why, what it tried and dropped, what it left open** →
  a new entry at the top of `worklog.md`.
- **A plan for work not started yet** → its own file here (`docs/<topic>-plan.md`);
  move it to `archive/` with a dated note once it is done or abandoned.
- **Something about one function** → a comment next to it, not here.
