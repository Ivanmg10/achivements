import type { Metadata, Viewport } from 'next'
import CookieBanner from '@/components/cookie-banner/CookieBanner'
import Toaster from '@/components/toaster/Toaster'
import GoogleAnalytics from '@/components/google-analytics/GoogleAnalytics'
import "./globals.css";
import Providers from "./providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, THEME_COLOR } from '@/lib/siteUrl'
import { themeScript } from '@/utils/themeIcon'
import { display, fira, firaDisplay, sofia, sofiaDisplay, ui } from '@/lib/fonts'

const THEME_SCRIPT = themeScript()

// Like the theme, the page's shape and font (slanted Barlow by default) and what the skeletons need (the home's and the library's layouts, whether a session is expected): the last choices, before the first frame.
const LOOK_SCRIPT = `try{var d=document.documentElement;if(localStorage.getItem('shape-style')==='round')d.dataset.shape='round';var f=localStorage.getItem('font-style');if(f==='sofia'||f==='fira')d.dataset.font=f;if(localStorage.getItem('home-layout')==='cover')d.dataset.homeLayout='cover';var l=localStorage.getItem('library-layout');if(l==='list'||l==='cards')d.dataset.libraryLayout=l;var s=localStorage.getItem('session-look');if(s==='in'||s==='tabs')d.dataset.session=s}catch(e){}`

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
        {/* Here, not src/app/icon.svg: Next's own link can land after the script, or in the body. The script and ThemeContext swap its href. */}
        <link id="theme-icon" rel="icon" href="/icon.svg" type="image/svg+xml" suppressHydrationWarning />
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
