import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { serverLanguage } from "@/lib/serverLanguage";
import { LanguageProvider } from "@/context/LanguageContext";
import { loadMessages } from "@/translations/load";
import MainFooter from "@/components/main-footer/MainFooter";
import NavigationProgress from "@/components/navigation-progress/NavigationProgress";
import MainHeader from "@/components/main-header/MainHeader";
import RaUserRefresher from "@/components/ra-user-refresher/RaUserRefresher";
import { MainProviders } from "@/components/main-providers/MainProviders";
import VersionBadge from "@/components/version-badge/VersionBadge";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  // This layout is dynamic already (it reads the session), so it can also render in the
  // person's language from the first byte: their choice's cookie, else their browser's.
  const lang = await serverLanguage();
  const messages = lang && lang !== "en" ? await loadMessages(lang) : undefined;

  // Signed out, the only page that gets this far is the landing (see
  // proxy.ts), and it brings its own header and footer.
  if (!session) return <LanguageProvider initial={lang} messages={messages}>{children}</LanguageProvider>;

  return (
    <LanguageProvider initial={lang} messages={messages}>
    <MainProviders>
      <NavigationProgress />
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <RaUserRefresher />
        {/* Clip, not hide: the game pages' 100vw backdrops would otherwise add a sideways scroll the width of the scrollbar. */}
        <main className="flex-1 overflow-x-clip">{children}</main>
        <MainFooter />
      </div>
      <VersionBadge />
    </MainProviders>
    </LanguageProvider>
  );
}
