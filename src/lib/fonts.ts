import { Barlow, Barlow_Condensed } from 'next/font/google'

/** The app's font (the agreed design's), as `--font-ui`: set on <html> by the root layout and by global-error, which replaces it. */
export const ui = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-ui',
  display: 'swap',
})

/** The display face (big titles, italic; upright in the round design), as `--font-barlow` (the `font-display` utility): set on <html> with `ui`. */
export const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['italic', 'normal'],
  variable: '--font-barlow',
  display: 'swap',
})
