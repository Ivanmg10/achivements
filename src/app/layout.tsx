import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import CookieBanner from '@/components/cookie-banner/CookieBanner'
import Toaster from '@/components/toaster/Toaster'
import GoogleAnalytics from '@/components/google-analytics/GoogleAnalytics'
import "./globals.css";
import Providers from "./providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, THEME_COLOR } from '@/lib/siteUrl'
import { THEMES, THEME_STORAGE_KEY } from '@/types/types'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// Paints the last theme this browser used before the first frame; without it
// every load flashes dark until the session says otherwise.
const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(THEMES)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  // Search Console's HTML-tag check, when the token is set; a DNS check needs nothing here.
  ...(process.env.GOOGLE_SITE_VERIFICATION?.trim() && {
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION.trim() },
  }),
}

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} bg-bg-header`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="text-text-main bg-bg-main">
        <Providers>
          {children}
          <CookieBanner />
          <Toaster />
        </Providers>
        {/* Loads only after the visitor accepts cookies in the banner. */}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
