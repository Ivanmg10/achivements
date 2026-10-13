import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/siteUrl";
import MainPage from "@/components/main-page/MainPage";
import LandingPage from "@/components/landing-page/LandingPage";

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

// What search engines read about the site: its name and that it is a free web app.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  applicationCategory: 'GameApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

/** The app for anyone signed in; what the app is for, to anyone else. */
export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
        <LandingPage />
      </>
    );
  }

  // No overflow here: the page scrolls, and an overflow box would stop the
  // sticky section strip from sticking.
  return (
    <div className="flex-1 min-h-0 flex flex-col bg-bg-main text-text-main">
      <MainPage />
    </div>
  );
}
