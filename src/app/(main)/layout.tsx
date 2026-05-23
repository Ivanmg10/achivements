import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
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

  if (!session) {
    redirect("/authPage");
  }

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
