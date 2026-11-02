# The welcome's style and privacy steps (#102)

Agreed on the canvas on 2026-11-02 (`docs/designs.md`, row "Preferencias del welcome"): concept A,
two steps, with its v2 in the welcome's own language, way 1 (one choice at a time). The user chose
two steps and left the way to code: tried on the page, way 2 only changes how a row opens.

## In

- **`prefs` is now "Style", and `privacy` is a new step after it** (`WELCOME_STEPS`, `STEP_SKY`, the
  curtain's mark, the bar, the done summary, `T.welcome` in all nine languages). The key stays `prefs`.
- **Style:** the title, "How it will look" over the Layout modal's sample (`LayoutModalPreview`, fixed
  data, never the account's), and six rows (`LOOK_CHOICES`). A row is the intro's card with its value
  under the title, and it grows into `WelcomePagePreferencesDetail` by `layoutId`, as the intro's points do.
- **The choices are the account's own:** `UserShapePreference`, `UserFontPreference`,
  `UserHomeLayoutPreference`, `UserGameCardPreference`, `useThemeChoice`, `setLang`. Nothing is saved
  a second way. What goes to the welcome from the modal is the sample and how each change moves,
  **not its controls**: the user turned that down ("pegado tal cual").
- **Motion:** shape sweeps, font fades, theme spreads from its tile (`lookTransition`, whole page: no
  dialog here, so no blur to lose), the first game grows into the cover and the flat style wipes (the sample's own).
- **History:** opening a choice is an entry (`useWelcomeChoice`), so the browser's back closes it;
  going between choices replaces it, so back never walks through them.
- **Privacy:** the three switches beside a live sample of the person's own card and rankings line.
  The rankings switch holds its row from the first frame.
- **Phone:** `WelcomePageStep`'s `stage`: the sample stuck under the bar, rows and buttons after it.

## Round 4, from the user's screenshots (2026-11-02)

- **Linked** is one card for all three platforms (`WelcomePagePlatformLinked`): its colours, the account, a tick, and the
  reading of its games inside. RA and PSN no longer move on by themselves after linking, or the card was never seen.
- **Theme** opens over the whole step, the user's idea: the sample on one side and all 22 by family on the other
  (`ThemeModalGroups`, shared with `ThemeModal`), with its own Next. The welcome's short list and "All themes" are gone.
- **Language** is the list itself, not a row that opens a dropdown.
- **The sample** goes up to 34rem, so the cover can be seen whole on a big screen.
- **Profile:** no thumbnail in the Photo field; the card beside it shows the picture.

## Decided while building

- The font applies to the whole welcome at once, unlike the modal, which holds it until it closes:
  there the page is behind a dialog; here the page is what is being styled.
- Only the sample is shared. The modal keeps its own choosers, and the theme keeps its own dialog there.

