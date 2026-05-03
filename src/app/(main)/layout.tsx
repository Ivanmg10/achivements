import MainFooter from "@/components/main-footer/MainFooter";
import MainHeader from "@/components/main-header/MainHeader";
import RaUserRefresher from "@/components/ra-user-refresher/RaUserRefresher";
import { MainProviders } from "@/components/main-providers/MainProviders";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainProviders>
      <div className="min-h-screen flex flex-col">
        <MainHeader />
        <RaUserRefresher />
        {children}
        <MainFooter />
      </div>
    </MainProviders>
  );
}
