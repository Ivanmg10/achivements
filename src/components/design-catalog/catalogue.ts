/** One piece of the design system as the catalogue presents it: what it is, where it lives, how it is used. */
export type PieceInfo = {
  id: string
  title: string
  summary: string
  /** Where it lives, as an import path. */
  source: string
  /** Its props or options, one line each: name and what it does. */
  props?: [string, string][]
  /** What must hold when it is used. */
  rules?: string[]
}

export type Group = { id: string; title: string; pieces: PieceInfo[] }

/** Every piece the catalogue shows, in its menu order. The menu, the cards' heads and the tests read this one list. */
export const GROUPS: Group[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    pieces: [
      { id: 'colour', title: 'Colour', summary: 'A theme owns the colours; nothing outside the theme picks its own. Meaning (success, danger…) always comes from here.', source: 'src/app/globals.css', rules: ['A hue with a meaning is a theme token, never a palette class (the guard refuses red / green / yellow / amber / orange classes).', 'Tier hues (level badge, streak) are the one exception and live in their own util.'] },
      { id: 'type', title: 'Typography', summary: 'Barlow is the default interface face, with Barlow Condensed italic for display titles and big figures. Sofia Sans and Fira Sans are preferences, each with its own condensed italic display face. The choice is `data-font`, independent of the shape design.', source: 'src/lib/fonts.ts', rules: ['A page title, a big figure or a rank is `font-display italic`.', 'Figures that change use `tabular-nums`.', 'Only Barlow preloads; the two optional faces load when chosen.'] },
      { id: 'shape', title: 'Shape', summary: 'The design owns the shapes. Two designs exist: slanted (the default) and round, the site as it was before the slant. Every specimen is drawn in both at once, each in its own scope.', source: 'src/app/globals.css · src/components/ui/shape.ts', props: [['--slant-button / --slant-pill / --slant-line / --slant-mark', 'the lean of a control, a switch, a tab line and a mark'], ['--clip-3 … --clip-14', 'the cut ends of a bar, a segment, a step (via slantStyle(px))'], ['--bar-radius', 'the rounding of a bar when it is not cut'], ['--r-chip / --r-tag / --r-button / --r-pane / --r-tile / --r-field / --r-card', 'chips, tags, buttons, panes, tiles, fields and cards: softer in the round design, pills for chips and tags'], ['--r-track / --r-knob', 'a switch\'s track and knob: a pill and a circle in the round design']], rules: ['Never a literal polygon() or skew-*-[..]: the guard fails on it.', 'A design is a block of token overrides; no component knows which one is on.'] },
      { id: 'motion', title: 'Motion', summary: 'Three durations and one spring. Reduced motion turns movement off at the component.', source: 'src/app/globals.css', props: [['--motion-hover', '150 ms, colour and shadow changes'], ['--motion-open', '250 ms, things opening and the tab line'], ['--motion-indicator', '450 ms, a sliding indicator'], ['--ease-spring', 'the knob and the bounce']] },
    ],
  },
  {
    id: 'controls',
    title: 'Controls',
    pieces: [
      { id: 'button', title: 'Button', summary: 'The one way to press something. Primary is slanted and in the accent; secondary is a ring; quiet is text; danger is tinted, never solid.', source: '@/components/ui/Button', props: [['variant', 'primary · secondary · quiet · danger'], ['size', 'sm · md · lg'], ['loading', 'a spinner, the text stays so the width does not jump'], ['href', 'renders a link that looks the same'], ['buttonClass()', 'for the rare element that cannot be a Button']], rules: ['className is for layout only, never colour.'] },
      { id: 'icon-button', title: 'IconButton', summary: 'A button that is only an icon, softly rounded; tinted when pressed.', source: '@/components/ui/IconButton', props: [['aria-label', 'required'], ['tone', 'default · accent · danger'], ['size', 'sm · md · lg']] },
      { id: 'fields', title: 'Fields', summary: 'Sunken fields in a Field frame: label, an aside, a hint or the error, wired by id.', source: '@/components/ui/Input', props: [['Input / Textarea / SearchInput / PasswordInput', 'the controls'], ['Field', 'label, aside, hint, error; the control is a render prop'], ['fieldClass()', 'on a native input that cannot be one of ours']], rules: ['An error next to one field is Field\'s error; an error for a form is a Notice.'] },
      { id: 'select', title: 'Select', summary: 'Its own listbox, never a native select, with an optional quiet label inside.', source: '@/components/ui/Select', props: [['options', 'value, label, description, icon'], ['prefix', 'a label before the value ("Period  All time")'], ['look', 'field · button']] },
      { id: 'switch', title: 'Switch', summary: 'An on/off switch that springs. Slanted track and knob, or a pill with a circular knob.', source: '@/components/ui/Switch', rules: ['Say the state in words beside it; on/off by colour alone is not enough.'] },
      { id: 'checkbox', title: 'Checkbox', summary: 'A native checkbox drawn in the library\'s style; the whole row toggles.', source: '@/components/ui/Checkbox' },
      { id: 'choice-cards', title: 'ChoiceCards', summary: 'A choice among a few options as cards (native radios underneath, so the arrows work), each with an optional drawing above its words.', source: '@/components/ui/ChoiceCards', props: [['options', 'value, label, hint, icon, preview'], ['columns', '2 · 3 · 4']] },
      { id: 'tabs', title: 'Tabs', summary: 'A row of tabs with the accent line under the current one; roving tabindex.', source: '@/components/ui/Tabs', props: [['tabs', 'value, label, count'], ['tabIds()', 'the ids a tab and its panel share']] },
      { id: 'segmented', title: 'SegmentedControl', summary: 'A choice among a few ways to see the same thing; a pill slides to the chosen one.', source: '@/components/ui/SegmentedControl', props: [['size', 'xs · sm · md']] },
      { id: 'pill', title: 'Pill', summary: 'A filter chip that toggles (aria-pressed), with an optional count.', source: '@/components/ui/Pill' },
    ],
  },
  {
    id: 'data',
    title: 'Data',
    pieces: [
      { id: 'figures', title: 'Figures', summary: 'StatPill (large has no box), StatCard (label first, the figure big) and RarityBadge (a tinted figure, never a bar).', source: '@/components/ui/StatPill · RarityBadge' },
      { id: 'progress-bar', title: 'ProgressBar', summary: 'Bevelled in the slanted design, rounded in the round one; in the theme\'s colour; glows only when finished. RA\'s softcore sits darker behind hardcore.', source: '@/components/ui/ProgressBar', props: [['pct / softPct', 'the bright bar and the darker one behind it'], ['label', 'its accessible name']], rules: ['The green that says "done" is in the percentage beside it, never on the bar.'] },
      { id: 'progress-ring', title: 'CircularProgress', summary: 'A ring of progress, with anything in the middle.', source: '@/components/ui/CircularProgress', props: [['earned / total', 'the share'], ['center', 'what is in the middle'], ['size / strokeWidth', 'the ring']] },
      { id: 'streak-tag', title: 'StreakTag', summary: 'A flame and its days, in the colour of its tier: 0, 5, 10, 20, 30, 40 and 50+ days. Lit with a glow while going, dimmed at 0.', source: '@/components/ui/StreakTag · @/utils/streakTier' },
      { id: 'level-badge', title: 'VaultLevelBadge', summary: 'A level and its tier, in the tier\'s hue with its own shape, so the tier never rests on colour alone.', source: '@/components/vault-level-badge/VaultLevelBadge' },
      { id: 'surface', title: 'Surfaces', summary: 'SURFACE is the card; every card shell is `rounded-card` on it.', source: '@/components/ui/surface' },
      { id: 'game-card', title: 'Game card', summary: 'GameCardBackdrop draws every game row. Colourful takes the colour of the game\'s art; flat is a plain card. The person chooses; both are shown here.', source: '@/components/game-card-backdrop/GameCardBackdrop', props: [['style', 'override the person\'s choice (used here)']] },
    ],
  },
  {
    id: 'disclosure',
    title: 'Disclosure',
    pieces: [
      { id: 'accordion', title: 'Accordion', summary: 'A question that slides its answer open. The answer stays in the page while closed (inert), so search engines read it.', source: '@/components/ui/Accordion', props: [['title', 'the question'], ['index', 'its place in a list, shown as 01, 02…'], ['defaultOpen', 'start open']], rules: ['Instant with reduced motion.'] },
      { id: 'show-more', title: 'ShowMore', summary: 'Under a capped list: "show the other N", then "show fewer". A secondary button whose chevron turns over.', source: '@/components/ui/ShowMore', props: [['more / less', 'the words in each state'], ['size', 'sm · md']] },
      { id: 'toggle-button', title: 'ToggleButton', summary: 'A button that is on or off (a pinned star). It reports aria-pressed and its icon changes shape when on, never colour alone.', source: '@/components/ui/ToggleButton', props: [['icon / pressedIcon', 'the quiet and the filled one'], ['label', 'what it does, read aloud']] },
      { id: 'shelf', title: 'Shelf', summary: 'A titled group of cards, with a hint and an optional action to see the whole group.', source: '@/components/ui/Shelf', props: [['title / hint', 'the group heading and its short description'], ['action', 'label and click handler for the whole group']] },
      { id: 'drop-slot', title: 'DropSlot', summary: 'The striped empty place that adds another item to a collection.', source: '@/components/ui/DropSlot', props: [['label', 'its accessible action name'], ['children', 'the icon and words inside']], rules: ['className is for layout only; the striped surface belongs to the piece.'] },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback and overlays',
    pieces: [
      { id: 'notice', title: 'Notice', summary: 'An inline notice tinted for what it says, always with its icon. An error is announced; the rest politely.', source: '@/components/ui/Notice', props: [['tone', 'info · success · warning · danger'], ['title / action', 'a bold first line; a button or link on the right']] },
      { id: 'toast', title: 'Toasts', summary: 'The dark card bottom right, through notify. Gone after 4 s (errors 7 s), never while hovered or focused.', source: '@/lib/notify', rules: ['A silent failure is a bug: an optimistic update that rolls back must say so.', 'An error inside a modal that stays open is inline, never a toast.'] },
      { id: 'modal', title: 'Modal', summary: 'A centred card from sm, a sheet on a phone. Escape, outside click, focus kept inside and given back.', source: '@/components/ui/Modal', props: [['title / hint / icon', 'the head'], ['footer', 'the actions, under a hairline'], ['tone', 'default · danger (an alertdialog)'], ['size', 'sm · md · lg · xl'], ['backdrop', 'default · opaque (a stronger wash for an immersive chooser)']] },
      { id: 'skeleton', title: 'Skeleton', summary: 'One block of what is on its way. A screen composes its own from these, in the shape and the gutters of what it replaces, so nothing jumps when the content lands.', source: '@/components/ui/Skeleton', props: [['radius', 'line · chip · tag · tile · pane · control · button · field · card · circle'], ['className', 'its size and layout'], ['GameRowSkeleton / SkeletonGameList / ChartSkeleton', 'the shapes several screens share'], ['SKELETON_PULSE', 'the pulse, for the placeholder of an image'], ['RememberedHeight', 'keeps the room a data-sized block had on the last visit']], rules: ['Pulse, never shimmer; still under reduced motion.', 'Never a hand-made pulse: the guard fails on it.', 'The composed skeleton says it is loading (role="status", aria-busy); the blocks are hidden.'] },
      { id: 'menu', title: 'Menu and tooltip', summary: 'The surfaces of a menu and a tooltip.', source: '@/components/ui/menu · tooltip' },
      { id: 'empty', title: 'EmptyState', summary: 'Says what is missing and what to do, with an icon.', source: '@/components/empty-state/EmptyState', props: [['icon / title / subtitle', 'the three lines'], ['size', 'default · compact']] },
    ],
  },
]

export const ALL_PIECES = GROUPS.flatMap((g) => g.pieces)
export const pieceById = (id: string): PieceInfo => {
  const piece = ALL_PIECES.find((p) => p.id === id)
  if (!piece) throw new Error(`The catalogue has no piece "${id}"`)
  return piece
}
