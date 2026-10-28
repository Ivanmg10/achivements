import { Barlow, Barlow_Condensed } from 'next/font/google'

/** The app's font (the agreed design's), as `--font-ui`: set on <html> by the root layout and by global-error, which replaces it. */
export const ui = Barlow({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
})

/** The display face (big italic titles, in every design), as `--font-barlow` (the `font-display` utility): set on <html> with `ui`. */
export const display = Barlow_Condensed({
  subsets: ['latin', 'latin-ext'],
  weight: ['700', '800'],
  style: ['italic'],
  variable: '--font-barlow',
  display: 'swap',
})
