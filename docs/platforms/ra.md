# RetroAchievements (RA)

Moved out of `CLAUDE.md` on 2026-11-07 (#124). Sign-up with an RA key: `../accounts.md`. How RA fails:
`README.md` here.


- **The cache already lives in Postgres.** `withCache` (`src/lib/raCache.ts`)
  keeps memory as a first level and `steam_cache` as the second, under `ra:`
  keys, so a cold start or another instance does not ask RA again. Skipped in
  development, where memory is cleared on purpose. Bump a key's `_vN` when the
  shape of what it returns changes.
- **A 429 waits.** `fetchRA` honours `Retry-After` up to `MAX_RETRY_AFTER`
  (5 s) and retries; a longer ask is thrown. Other 4xx are never retried.
- **Keys are sealed at rest** (`src/lib/raKey.ts`, `migrations/043_ra_key_sealed.sql`, applied to pre
  2026-10-31; any other database needs it first, or linking answers 500; reads still work). `users.raid` is read through `readRaKey`, never directly: a key from
  before sealing reads as it is, until it is linked again. `raid_hash` keeps one key to one account.
  Changing `NEXTAUTH_SECRET` makes every key unreadable and everyone links RA again.
- **Whose key.** Never a shared app key (see "What RA said" below). On the user's own
  page the call uses their `raid`; `requireViewerApiKey` never falls back to
  another key. On someone else's page `dataOwner` (`src/lib/apiAuth.ts`) signs
  with the **viewer's** key when they have one, and otherwise with the **page
  owner's**, so a viewer with no RA account still sees it. That last case
  spends one user's key on other people's visits; it is an open question for RA,
  not something settled. `raid` stays server-only either way.
- The user search (`/api/users/search`) only reads our database; it never calls RA.
- **What RA said, and what is open** (from the roadmap): wait for the API v2 with OAuth before changing
  how accounts are linked ([RAWeb releases](https://github.com/RetroAchievements/RAWeb/releases)).
  **RA's answer was clear: each user with their own key.** No shared app key and no looking names up
  with one — `requireViewerApiKey` never falls back to one, and its test says so. The RA modal explains
  why the key is asked for. **Open:** a viewer with no RA account is served with the page owner's key
  (above); ask RA whether that counts, and if not, ask the viewer to link their own. Revisit when OAuth lands.
- **RA game pictures are kept in the browser** and **RA unlocks are sent slim**: see `../performance.md`.
