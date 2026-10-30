# Implementation Plan: Hidden games and completion dates (#88)

## Overview

Fix hidden-game visibility at shared data boundaries and separate base-completion timestamps from latest activity. Tasks are tracked in `tasks/todo.md`; the two bug fixes remain in separate commits.

## Architecture decisions

- Filter canonical upstream/cache results at listing response boundaries and shared client providers/selectors, never in direct-game loaders.
- Keep owner and public-subject filtering source-qualified and immediate on optimistic hide/show changes.
- Filter stored pins, groups and score projections without deleting curated rows, so unhide restores them.
- Keep activity fields (`lastTrophyAt`, `lastUnlock`, `lastPlayed`) for feeds, synchronization and cache fingerprints.
- Use a nullable base-completion rule: PSN platinum/default group, RA completion award, and unknown for Steam/Xbox without reliable base/DLC separation.

## Task list

1. Add shared hidden-game filtering and regression coverage for owner/public warm-cache feeds and library selectors.
2. Apply visibility to stored collections, groups, searches, aggregates and rankings with invalidation.
3. Add shared completion-date rules and cover PSN DLC ordering plus conservative Steam/Xbox fallbacks.
4. Propagate completion dates through displays, caches and score recomputation without changing activity semantics.
5. Document platform rules and audited surfaces; run focused/full verification and open the PR.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Filtering raw libraries breaks direct game URLs | Preserve raw `fullLibrary`/detail loaders and test direct URL behavior. |
| Subject pages use the viewer's hidden set | Mount subject visibility from the profile owner's keys and test owner/public responses. |
| Warm caches or materialized scores leak old visibility | Filter after cache reads, disable stale browser reuse for mutable visibility responses, rebuild score periods and clear ranking cache on hide/show. |
| DLC activity is lost while fixing dates | Change only completion timestamps/bonus dates; leave activity feeds and cache fingerprints intact. |
| Missing platform data produces invented dates | Return `null`, retain the existing Undated UI group and omit unknown Finished facts. |

## Verification checkpoints

- After tasks 1–2: focused hidden-game utility, provider, route, group and ranking tests; typecheck.
- After tasks 3–4: focused completion, PSN DTO/cache and score tests; typecheck.
- After task 5: full Jest, lint, typecheck, `git diff --check` and production build before PR.
