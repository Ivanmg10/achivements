# Internal docs

What to read, and when.

| File | Read it |
|---|---|
| [`../CLAUDE.md`](../CLAUDE.md) | Always, first. The rules and invariants: code style, state and effects, auth, email, admin, each platform, git. |
| [`architecture.md`](architecture.md) | When you need to find where something lives, or how a request travels from a page to RA/Steam/PSN and back. |
| [`rankings-plan.md`](rankings-plan.md) | Before working on Vault Points, levels, the rankings page or account verification. |
| [`psn-scaling-and-rate-limits.md`](psn-scaling-and-rate-limits.md) | Before touching PSN sync, the single NPSSO, onboarding at scale or rate limits. |
| [`psn-multi-account-pool.md`](psn-multi-account-pool.md) | Before adding more PSN service accounts, designing the pool or the sync UX. |
| [`psn-implementation-brief.md`](psn-implementation-brief.md) | When another agent is going to implement the PSN verification, pool, queue or UX work. |
| [`psn-scale-roadmap.md`](psn-scale-roadmap.md) | When planning growth from 1k to 100k users: accounts, DB, queue, CDN and ops. |
| [`psn-account-operations.md`](psn-account-operations.md) | Before adding many PSN service accounts, automating token refresh or wiring Telegram alerts. |
| [`psn-5-account-agent-brief.md`](psn-5-account-agent-brief.md) | The concrete 5-account rollout brief to hand to the implementing agent. |
| [`exophase-psn-analysis.md`](exophase-psn-analysis.md) | Competitive analysis of Exophase's PSN model and what CheevoVault can borrow. |
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
