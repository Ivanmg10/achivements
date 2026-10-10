set -e
cd /c/Users/Ivan/achivements

# A: PSN 429 (+ the fixture factory its test file uses)
git add src/lib/psnClient.ts src/lib/psnClient.test.ts src/test-utils/
git commit -q -m "fix(psn): wait and retry once when Sony says too many requests

Every Sony call goes through psnCall(); a second refusal answers 429 with
Retry-After instead of a generic 502. psn-api hides the HTTP status, so the
rate limit is recognised by Sony's wording. Adds a PSN game fixture factory
for tests."

# B: source — no setState in effects, accessibility fixes, config, docs
git add src/hooks/useIsClient.ts src/hooks/useLocationHash.ts src/hooks/useStorageValue.ts src/hooks/useWhenChanged.ts
grep -v "\.test\.\|^__mocks__\|^jest\|psnClient\|^tsconfig" /tmp/mod.txt | xargs git add
git add tsconfig.build.json
git commit -q -m "refactor(state): clear every set-state-in-effect warning, and make the rule an error

State that starts over goes through useWhenChanged; what the browser holds
through useStorageValue, useIsClient and useLocationHash; a fetch's answer is
applied in its .then. Resets are keyed so a session.update() flip of status does
not start a load that nothing will answer.

Also: accessible names for the group and admin forms, role=alert on the
location error, aria-expanded on the all-games header, the admin create form
uses PASSWORD_MIN, and a 4xx is no longer retried in useGameProgression.
CLAUDE.md documents the patterns."

# C: tests, mocks, jest config
git add -A -- ':!.playwright-mcp'
git commit -q -m "test: cover what was untested, type the tests, raise the coverage floor

New tests for the hooks above, the groups and admin modals, useGroupPage,
publicUser and the admin users route, plus regression tests for resets on
reopen and for the session status flicker. Fixes 62 type errors in tests, the
framer-motion mock that remounted modal content on every render, and the
next/image mock's stray props. Coverage 89 -> 93%; floor now 90/83/86/92."

git log --oneline -4
git status --short
git push 2>&1 | tail -4
