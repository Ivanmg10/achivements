import { Barlow, Barlow_Condensed, Fira_Sans, Fira_Sans_Extra_Condensed, Sofia_Sans, Sofia_Sans_Extra_Condensed } from 'next/font/google'

/** Barlow, the default UI face, as `--font-ui`: set on <html> by the root layout and by global-error, which replaces it. */
export const ui = Barlow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
})

/** Barlow Condensed, the default display face (big italic titles), as `--font-barlow`: the `font-display` utility. */
export const display = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['700', '800'],
  style: ['italic'],
  variable: '--font-barlow',
  display: 'swap',
})

/** Sofia Sans, the friendly choice; not preloaded because it is not the default. */
export const sofia = Sofia_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sofia',
  display: 'swap',
  preload: false,
})

/** Sofia Sans Extra Condensed italic, the display face of the friendly choice. */
export const sofiaDisplay = Sofia_Sans_Extra_Condensed({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['700', '800'],
  style: ['italic'],
  variable: '--font-sofia-display',
  display: 'swap',
  preload: false,
})

/** Fira Sans, the legible choice; not preloaded because it is not the default. */
export const fira = Fira_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-fira',
  display: 'swap',
  preload: false,
})

/** Fira Sans Extra Condensed italic, the display face of the legible choice. */
export const firaDisplay = Fira_Sans_Extra_Condensed({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  weight: ['700', '800'],
  style: ['italic'],
  variable: '--font-fira-display',
  display: 'swap',
  preload: false,
})
