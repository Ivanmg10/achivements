const BASE =
  'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-main'

/** The two buttons of the 404 and error screens: the way out, and the other one. */
export const STATUS_BUTTON = {
  primary: `${BASE} bg-accent text-bg-main hover:bg-accent-hover`,
  secondary: `${BASE} bg-ink/5 text-text-main ring-1 ring-ink/10 hover:bg-ink/10`,
}

/**
 * How tall the 404 and error screens are. Inside the app they fill what the
 * header (64 px with its margin) and the footer (49 px) leave, so they sit in
 * the middle: the layout's <main> is a block, so flex-1 would not stretch them.
 * Full screen (no layout around), they are the page's <main>.
 */
export const STATUS_SCREEN = {
  inApp: 'min-h-[calc(100dvh-7rem)]',
  fullScreen: 'min-h-screen bg-bg-main',
}
