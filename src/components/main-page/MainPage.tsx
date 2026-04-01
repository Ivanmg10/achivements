"use client";

import { useSession } from "next-auth/react";
import MainPageProgression from "./main-page-progression/MainPageProgression";
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
    <main className="min-h-screen grid grid-cols-6 grid-rows-5 text-text-main">
      <MainPageProgression />
      <MainPageProfile />
      <MainPageWantToPlay />
      <MainPageRecommended />
      <MainPageCompleted />
    </main>
  );
}
