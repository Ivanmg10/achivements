import { Barlow_Condensed, Inter } from 'next/font/google'

/** The app's font, as `--font-inter`: set on <html> by the root layout and by global-error, which replaces it. */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

/** The welcome's display face (big italic titles), as `--font-barlow` (the `font-display` utility): loaded only by the pages that set it. */
export const display = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['700', '800'],
  style: ['italic'],
  variable: '--font-barlow',
  display: 'swap',
})
