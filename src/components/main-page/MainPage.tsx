"use client";

import { useSession } from "next-auth/react";
import Spinner from "../main-spinner/Spinner";
import MainPageRecommended from "./main-page-games/MainPageGames";
import MainPageProfile from "./main-page-profile/MainPageProfile";
import MainPageWantToPlay from "./main-page-want-to-play/MainPageWantToPlay";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import MainPageCompleted from "./main-page-completed/MainPageCompleted";

export default function MainPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/authPage");
    }
  }, [status]);

  if (status === "loading")
    return (
      <main className="h-lvh flex justify-center items-center text-text-main">
        <Spinner size={45} />
      </main>
    );
  return (
    <main className="flex-1 min-h-0 grid grid-cols-6 grid-rows-[auto_1fr] text-text-main">
      <MainPageWantToPlay />
      <MainPageProfile />
      <MainPageRecommended />
      <MainPageCompleted />
    </main>
  );
}
