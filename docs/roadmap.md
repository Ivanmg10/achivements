# Roadmap

What is pending, moved out of `CLAUDE.md` on 2026-11-07 (#124). The items marked **ask first** are ideas
the owner wants to shape before anyone builds them: do not start them on your own.

## Pending

- [ ] Group hardcore achievement tracking
- [ ] **A shareable user card** for social networks (the user's wish, 2026-10-23). Concepts on the
      component library's canvas (`docs/designs.md`). Only data that is already public (what
      `profileTeaser` and the showcase show); anything more means changing `/privacy`. Not started.
- [ ] **`/diario`, a day-by-day journal of play** (the user's wish, 2026-10-23): a new route from
      home concept C. Mini concept on the component library's canvas (`docs/designs.md`). Not started.
- [ ] **Styles to the user's taste** (the user's wish, 2026-10-23): the user chooses how parts of the
      site look. The first one: the home layout (*Classic*, default, or *Portada*), planned with the
      component library (`docs/ui-library-and-designs-plan.md`).
      Built so far (1.7.0): the home layout, the shape, the font and the game-card style.
- [ ] **More languages** (the user's wish, 2026-10-23). **Ask first** which languages. What a new one
      needs: `i18n.md` → Adding a language.
- [ ] Notifications — **an idea the user wants to expand before it is built; do not
      start it, and do not assume it is push or email.** Ask what they have in mind
      first. Known so far: friends completing games and a game's last chance (a
      Game Pass title leaving) were floated, nothing decided. Needs a channel,
      per-user subscriptions and a place to store them (a migration). **Ask first.**
- [ ] RA: wait for the API v2 with OAuth before changing how accounts are linked; RA's answer and
      the open question are in `platforms/ra.md`.
- [ ] Vault Points, later: ownership verification, a history chart, CheevoVault's own achievements
      (`social.md`).
- [ ] Presence, next: the user said it will grow beyond the card. **Ask first** what next (proposed:
      Steam's "playing now" for everyone in one call, an "online" filter, live refresh, the public profile).
- [ ] Later: **community-flagged missables for PSN, Steam and Xbox.** Only RA says
      which achievements are missable (`Type: 'missable'`, marked in red in
      `AchievementGrid`); Sony, Steam and OpenXBL have no such field (checked
      2026-10-16), and the sites that flag them (TrueAchievements/TrueTrophies,
      PSNProfiles) have no API, so **do not scrape them**. Idea: users mark an
      achievement as missable, and once enough of them agree it shows for everyone.
      Needs a migration, a threshold and some moderation; only worth it with more
      users. Not started.
- [ ] Later, optional: a "verified" badge per linked account — the app gives
      a code, the user puts it for a few minutes in their RA motto / Steam
      summary / PSN About me, the app reads it. Only if public profiles or
      group comparisons come to need proof of ownership.

## Done

- Steam integration (1.0.0); public user profiles (1.4.0).
- The component library and the record of every design (`ui-library-and-designs-plan.md`, `designs.md`;
  released in 1.7.0).
- Entrance animations on every page and component (#61, 2026-10-31; `design-system.md` → Entrances).
- Steam linked by name, like PSN (2026-10-09): custom URL name, profile link or SteamID64
  (`src/lib/steamAccount.ts`), no OpenID, and no "already linked elsewhere" check (`migrations/028`), so one
  person could have several CheevoVault accounts; the profile had to be public. **Replaced 2026-10-21** by
  linking through Steam's sign-in (`accounts.md`); only admins still link by typing.
- Vault Points, levels and rankings, a beta in 1.6.0 (2026-10-20; `social.md`).
- Online status and "last seen" on the Following cards (2026-10-19; `social.md` → Presence).
- The "13 optimization fixes" (2026-10-16). They were never written down, only named, so they were
  re-derived by auditing each named area; `performance.md` has what was done and what must stay true.
  Already fine and left alone: server cache stampede (`withSteamCache`, `withCache`), database indexes, TTLs.
- The ~51 `react-hooks/set-state-in-effect` warnings are gone (2026-10-09) and the rule is now an error
  (`CLAUDE.md` → State and effects).
