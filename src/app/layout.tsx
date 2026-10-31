import type { Metadata, Viewport } from 'next'
import CookieBanner from '@/components/cookie-banner/CookieBanner'
import Toaster from '@/components/toaster/Toaster'
import GoogleAnalytics from '@/components/google-analytics/GoogleAnalytics'
import "./globals.css";
import Providers from "./providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, THEME_COLOR } from '@/lib/siteUrl'
import { THEMES, THEME_STORAGE_KEY } from '@/types/types'
import { display, fira, firaDisplay, sofia, sofiaDisplay, ui } from '@/lib/fonts'

// Paints the last theme this browser used before the first frame; without it
// every load flashes dark until the session says otherwise.
const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(THEMES)}.indexOf(t)>-1)document.documentElement.dataset.theme=t}catch(e){}`

// Likewise the page's shape and font (slanted Barlow by default) and the home's layout: the last choices, before the first frame.
const LOOK_SCRIPT = `try{var d=document.documentElement;if(localStorage.getItem('shape-style')==='round')d.dataset.shape='round';var f=localStorage.getItem('font-style');if(f==='sofia'||f==='fira')d.dataset.font=f;if(localStorage.getItem('home-layout')==='cover')d.dataset.homeLayout='cover'}catch(e){}`

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
    <html lang="en" data-theme="dark" className={`${ui.variable} ${display.variable} ${sofia.variable} ${sofiaDisplay.variable} ${fira.variable} ${firaDisplay.variable} bg-bg-header`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOOK_SCRIPT }} />
      </head>
      <body className="min-h-screen text-text-main bg-bg-main">
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
