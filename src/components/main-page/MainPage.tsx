"use client";

import { useSession } from "next-auth/react";
import MainPageProgression from "./main-page-progression/MainPageProgression";
import Spinner from "../main-spinner/Spinner";
import MainPageRecommended from "./main-page-games/MainPageGames";
import MainPageProfile from "./main-page-profile/MainPageProfile";
import MainPageWantToPlay from "./main-page-want-to-play/MainPageWantToPlay";

export default function MainPage() {
  const { status } = useSession();

  if (status === "unauthenticated")
    return (
      <main className="min-h-screen flex justify-center items-center text-text-main">
        <h1 className="text-4xl">Registrate para ver esta pantalla</h1>
      </main>
    );
  if (status === "loading")
    return (
      <main className="h-lvh flex justify-center items-center text-text-main">
        <Spinner />
      </main>
    );
  return (
    <main className="min-h-screen grid grid-cols-5 grid-rows-6 text-text-main">
      <MainPageProgression />
      <MainPageProfile />
      <MainPageWantToPlay />
      <MainPageRecommended />
    </main>
  );
}
