import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import CookieBanner from '@/components/cookie-banner/CookieBanner'
import Toaster from '@/components/toaster/Toaster'
import GoogleAnalytics from '@/components/google-analytics/GoogleAnalytics'
import "./globals.css";
import Providers from "./providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/siteUrl'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${inter.variable} bg-bg-header`}>
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
