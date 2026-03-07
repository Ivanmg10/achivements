"use client";

import { useSession } from "next-auth/react";
import MainPageCarousel from "./main-page-carousel/MainPageCarousel";
import MainPageGames from "./main-page-games/MainPageGames";
import MainPageHot from "./main-page-hot/MainPageHot";
import MainPageProfile from "./main-page-profile/MainPageProfile";
import Spinner from "../main-spinner/Spinner";

export default function MainPage() {
  const { status } = useSession();

  if (status === "unauthenticated")
    return (
      <main className="min-h-screen flex justify-center items-center bg-bg-main text-text-main">
        <h1 className="text-4xl">Registrate para ver esta pantalla</h1>
      </main>
    );
  if (status === "loading")
    return (
      <main className="h-lvh flex justify-center items-center bg-bg-main text-text-main">
        <Spinner />
      </main>
    );
  return (
    <main className="min-h-screen grid grid-cols-5 grid-rows-5 bg-bg-main text-text-main">
      <MainPageCarousel />
      <MainPageGames />
      <MainPageHot />
      <MainPageProfile />
    </main>
  );
}
