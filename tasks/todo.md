# Hidden games and completion dates tasks (#88)

## Task 1: Shared visibility boundaries

- [x] Add failing tests for source-qualified filtering in owner/public listings and warm-cache responses.
- [x] Apply shared filters to library/recent/activity providers and listing BFF routes without changing direct-detail loaders.
- [x] Verify optimistic hide/show updates and hidden management remain reversible.
- Verify: focused visibility, context, selector and route tests.

## Task 2: Stored collections and aggregates

- [x] Add failing tests for pins/showcase/search, groups, activity/streaks, charts and rankings.
- [x] Filter stored collections and score reads; rebuild visibility-dependent periods and invalidate ranking caches on hide/show.
- Verify: focused group, feed, award, score-refresh and rankings tests; `npx tsc --noEmit`.

## Task 3: Completion-date rules

- [x] Add failing regressions for old PSN platinum/new DLC, DLC before base completion, missing timestamps and Steam/Xbox unknown fallback.
- [x] Implement shared nullable completion rules and route collection/detail/library consumers through them.
- Verify: focused completion-date, perfect-game, library and component tests.

## Task 4: DTOs, caches and later syncs

- [x] Enrich PSN completion dates through existing trophy caches without weakening platform error behavior.
- [x] Base Vault completion bonus dates on the shared rules; recompute persisted periods via rules versioning.
- [x] Confirm DLC remains activity and continues invalidating caches/synchronization.
- Verify: focused PSN client/route, cache, vault-score and score-refresh tests; `npx tsc --noEmit`.

## Task 5: Documentation and delivery

- [x] Update CLAUDE/architecture/worklog and prepare the required surface audit table.
- [x] Review both diffs, run all tests, lint, typecheck, build and `git diff --check`.
- [ ] Push the branch and open a complete PR with `Closes #88`; do not merge.
