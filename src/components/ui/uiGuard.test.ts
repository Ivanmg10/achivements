import fs from 'fs'
import path from 'path'
import PENDING from './uiGuard.pending.json'

/**
 * The library is the only way to draw its pieces: these fail when one is
 * written by hand outside src/components/ui. Each PR of the library adds its
 * part (docs/ui-library-and-designs-plan.md → Build plan).
 */

const SRC = path.join(__dirname, '../..')
const UI = path.join(SRC, 'components', 'ui')

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) return full === UI ? [] : sources(full)
    return /\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name) ? [full] : []
  })
}

const FILES = sources(SRC).map((file) => ({ file: path.relative(SRC, file), text: fs.readFileSync(file, 'utf8') }))

function offenders(pattern: RegExp) {
  return FILES.filter(({ text }) => pattern.test(text)).map(({ file }) => file)
}

/**
 * A rule added in #120 starts with the files still drawing the piece by hand (`uiGuard.pending.json`).
 * The list only shrinks: a file that no longer offends must leave it, and no new file may join
 * (docs/worklog.md, #120 → Open, says how to empty each list).
 */
function newOffenders(rule: keyof typeof PENDING, pattern: RegExp) {
  const found = offenders(pattern).map((f) => f.split(path.sep).join('/'))
  const pending: string[] = PENDING[rule]
  expect({ rule, migrated: pending.filter((f) => !found.includes(f)) }).toEqual({ rule, migrated: [] })
  return found.filter((f) => !pending.includes(f))
}

test('primary buttons come from Button / buttonClass', () => {
  // the accent fill with the dark text and a hover is a primary button
  expect(offenders(/["'`][^"'`]*\bbg-accent [^"'`]*text-bg-main[^"'`]*(?<![\w-])hover:[^"'`]*["'`]/)).toEqual([])
})

test('text fields come from the library (fieldClass, Input, Textarea, SearchInput, PasswordInput)', () => {
  const bad: string[] = []
  for (const { file, text } of FILES) {
    for (const m of text.matchAll(/<(input|textarea)\b[\s\S]*?\/>/g)) {
      const el = m[0]
      if (/type="(checkbox|radio|file|hidden|range|color)"/.test(el)) continue
      // a bare input inside a box that is the field (the search panels) draws nothing itself
      if (/fieldClass\(|bg-transparent|sr-only/.test(el)) continue
      bad.push(file)
    }
  }
  expect(bad).toEqual([])
})

test('a textarea drawn with fieldClass says it has several lines: a pill would deform it', () => {
  const bad: string[] = []
  for (const { file, text } of FILES) {
    for (const m of text.matchAll(/<textarea\b[\s\S]*?\/>/g)) if (/fieldClass\(/.test(m[0]) && !/multiline: true/.test(m[0])) bad.push(file)
  }
  expect(bad).toEqual([])
})

test('no native select: the library has its own', () => {
  expect(offenders(/<select[\s>]/)).toEqual([])
})

test('on/off switches come from Switch', () => {
  expect(offenders(/role="switch"/)).toEqual([])
})

test('checkboxes come from Checkbox', () => {
  expect(offenders(/type="checkbox"/)).toEqual([])
})

test('dialogs come from Modal', () => {
  // Not dialogs: the sign-in backdrop, the welcome's curtain. The search panel still moves to Modal placement="top" (#120 → Open).
  const allowed = [
    path.join('app', '(auth)', 'authPage', 'page.tsx'),
    path.join('components', 'welcome-curtain', 'WelcomeCurtain.tsx'),
    path.join('components', 'search-modal', 'SearchModal.tsx'),
  ]
  expect(offenders(/className="fixed inset-0[^"]*bg-black/).filter((f) => !allowed.includes(f))).toEqual([])
})

test('meaningful colours come from the theme, not the palette', () => {
  // red → danger, green → success, yellow → hardcore, amber/orange → warning (each theme tunes them)
  expect(offenders(/\b(text|bg|ring|border|fill|stroke|from|to|via)-(red|green|yellow|amber|orange)-(200|300|400|500|600)\b/)).toEqual([])
})

test('the shape of a bar or a mark comes from the design tokens, never a fixed polygon or skew', () => {
  // slantStyle(px) / var(--clip-*) and skew-*-(--slant-*): the round design can only remove what the tokens carry.
  // Exception: WelcomeCurtain.module.css is a fixed decorative illustration, not a shape-controlled component.
  expect(offenders(/clipPath:\s*['"`]polygon\(/)).toEqual([])
  expect(offenders(/(?<![\w-])-?skew-[xy]-\[/)).toEqual([])
})

test('a streak is coloured by its tier, never a fixed hue', () => {
  expect(offenders(/StreakTag[\s\S]{0,200}className="[^"]*\bbg-(?:red|orange|amber|yellow)/)).toEqual([])
})

test('the radii the designs change come from the tokens, never a fixed value', () => {
  // rounded-card / -sheet / -pane / -tile / -box / -tag / -badge / -cell / -icon / -button / -chip: the round design softens them or turns them to pills.
  expect(offenders(/\brounded-(?:xl|2xl)\b/)).toEqual([])
  // What may keep its own radius: art bigger than a card, which is round enough in both designs, and the
  // tiny drawings of a layout inside the preferences, which are not controls or surfaces.
  const allowed = [
    path.join('components', 'landing-page', 'landing-hero', 'LandingHero.tsx'),
    path.join('components', 'main-page', 'main-page-portada', 'MainPagePortada.tsx'),
    path.join('components', 'status-badge', 'StatusBadge.tsx'),
    path.join('components', 'user-page', 'user-game-card-preference', 'user-game-card-preference-preview', 'UserGameCardPreferencePreview.tsx'),
    path.join('components', 'user-page', 'user-home-layout-preference', 'user-home-layout-preference-preview', 'UserHomeLayoutPreferencePreview.tsx'),
    path.join('components', 'welcome-page', 'welcome-page-intro-detail', 'WelcomePageIntroDetail.tsx'),
  ]
  // A value of its own, on any side. `inherit` and a calc on a token follow the design, so they pass.
  const fixed = offenders(/(?<![\w-])rounded(?:-[tblrse]{1,2})?-(?:lg|md|sm|3xl|\[(?!inherit\]|calc\(var\())(?![\w-])/)
  expect(fixed.filter((f) => !allowed.includes(f))).toEqual([])
})

test('a bare rounded is only ever a focus ring: anything painted takes a token', () => {
  const painted = /(?<=["'`\s])rounded(?=[\s"'`])[^"'`]*(?<![\w:-])(?:bg-(?!transparent)|object-cover|ring-1)|(?<![\w:-])(?:bg-(?!transparent)|object-cover|ring-1)[^"'`]*\srounded(?=[\s"'`])/
  expect(offenders(painted)).toEqual([])
})

test('a loading block comes from Skeleton, never a hand-made pulse', () => {
  // Not a skeleton: the status badge's glow is decoration. An image's placeholder uses SKELETON_PULSE.
  const allowed = [path.join('components', 'status-badge', 'StatusBadge.tsx')]
  expect(offenders(/\banimate-pulse\b/).filter((f) => !allowed.includes(f))).toEqual([])
})

test('an entrance is CSS (globals.css → .enter-*), never Framer', () => {
  // What opens on a click, not on a load: dialogs, toasts, the library's swaps and opened rows, the welcome's opened point.
  const allowed = [
    path.join('components', 'library-detail-row', 'LibraryDetailRow.tsx'),
    path.join('components', 'library-explorer', 'LibraryExplorer.tsx'),
    path.join('components', 'toaster', 'toast-item', 'ToastItem.tsx'),
    path.join('components', 'welcome-page', 'welcome-page-intro-detail', 'WelcomePageIntroDetail.tsx'),
  ]
  expect(offenders(/initial=\{[^}]*\{[^}]*\b[xy]: /).filter((f) => !allowed.includes(f))).toEqual([])
  expect(offenders(/whileInView|useInView/)).toEqual([])
  expect(offenders(/variants=\{fadeUp\}/)).toEqual([])
})

test('a disclosure and a show-more button come from the library (Accordion, ShowMore)', () => {
  expect(offenders(/aria-expanded=\{[^}]*\}[\s\S]{0,400}IconPlus/)).toEqual([])
})

// The rules added with #120 (docs/audits/antislop-v17.md, X2 and T-05/T-06). Each pattern is also what the
// next migration greps for.
const NEW_RULES = {
  kicker: /["'`][^"'`]*(?:\buppercase\b[^"'`]*\btracking-|\btracking-[^"'`]*\buppercase\b)/,
  tag: /["'`](?=[^"'`]*\brounded-tag\b)(?=[^"'`]*(?:\bh-(?:5|6|\[1\.375rem\])|\bpy-0\.5)(?![\w-]))/,
  avatar: /\brounded-full\b[^"'`]*\bobject-cover\b|\bobject-cover\b[^"'`]*\brounded-full\b|from '@\/components\/presence-dot\/PresenceDot'/,
  listRow: /\bhover:bg-accent\/10 focus-visible:bg-accent\/10\b/,
  figure: /\b(?:StatPill|StatCard)\b/,
  dataBar: /\bslantStyle\(/,
  spinner: /\banimate-spin\b|main-spinner\/Spinner/,
  pillButton: /<button\b[^>]*?className=\{?["'`][^"'`]*\brounded-full\b|px-3 py-1 rounded-full hover:bg-ink\/10/,
  notice: /bg-(?:danger|warning|success|info)\/\d+[^"'`]*ring-(?:1|inset)\b/,
  dialogRole: /role="(?:alert)?dialog"|\baria-modal\b/,
  portal: /\bcreatePortal\(/,
}

test('a kicker comes from Kicker / kickerClass, never an uppercase tracked class by hand', () => {
  expect(newOffenders('kicker', NEW_RULES.kicker)).toEqual([])
})

test('a tag comes from Tag, never a tinted rounded-tag box by hand', () => {
  expect(newOffenders('tag', NEW_RULES.tag)).toEqual([])
})

test('a person\'s picture comes from Avatar, which carries their presence dot', () => {
  expect(newOffenders('avatar', NEW_RULES.avatar)).toEqual([])
})

test('a row to pick from comes from ListRow / LIST_ROW', () => {
  expect(newOffenders('listRow', NEW_RULES.listRow)).toEqual([])
})

test('a labelled number comes from Figure; StatPill and StatCard are its old names', () => {
  expect(newOffenders('figure', NEW_RULES.figure)).toEqual([])
})

test('a chart bar with cut ends comes from DataBar, never slantStyle on a hand-made bar', () => {
  expect(newOffenders('dataBar', NEW_RULES.dataBar)).toEqual([])
})

test('a spinner comes from Spinner or Button loading, never a hand-made animate-spin', () => {
  expect(newOffenders('spinner', NEW_RULES.spinner)).toEqual([])
})

test('a retry or any pill-shaped button comes from Button (ErrorRetry under a failed read), never a hand-made pill', () => {
  expect(newOffenders('pillButton', NEW_RULES.pillButton)).toEqual([])
})

test('a tinted notice box comes from Notice (or ErrorRetry), never drawn by hand', () => {
  expect(newOffenders('notice', NEW_RULES.notice)).toEqual([])
})

test('a dialog is a Modal (placement="top" for a panel or a menu): no hand-made role="dialog" or aria-modal', () => {
  expect(newOffenders('dialogRole', NEW_RULES.dialogRole)).toEqual([])
})

test('only the library portals: Modal portals itself, so wrapping it in createPortal is never needed', () => {
  expect(newOffenders('portal', NEW_RULES.portal)).toEqual([])
})
