import { Inter } from 'next/font/google'

/** The app's font, as `--font-inter`: set on <html> by the root layout and by global-error, which replaces it. */
export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
