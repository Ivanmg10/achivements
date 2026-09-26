import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import MainPage from "@/components/main-page/MainPage";
import LandingPage from "@/components/landing-page/LandingPage";

/** The app for anyone signed in; what the app is for, to anyone else. */
export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) return <LandingPage />;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-bg-main text-text-main">
      <MainPage />
    </div>
  );
}
