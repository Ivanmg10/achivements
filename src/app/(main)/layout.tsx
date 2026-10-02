import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import MainFooter from "@/components/main-footer/MainFooter";
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

  // Signed out, the only page that gets this far is the landing (see
  // proxy.ts), and it brings its own header and footer.
  if (!session) return <>{children}</>;

  return (
    <MainProviders>
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <RaUserRefresher />
        <main className="flex-1">{children}</main>
        <MainFooter />
      </div>
      <VersionBadge />
    </MainProviders>
  );
}
