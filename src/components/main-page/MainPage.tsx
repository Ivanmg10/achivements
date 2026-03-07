"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import MainPageCarousel from "./main-page-carousel/MainPageCarousel";
import MainPageGames from "./main-page-games/MainPageGames";
import MainPageHot from "./main-page-hot/MainPageHot";
import MainPageProfile from "./main-page-profile/MainPageProfile";
import Spinner from "../main-spinner/Spinner";

export default function MainPage() {
  const { theme } = useTheme();
  const { status, data: session } = useSession();

  console.log(session);

  if (status === "unauthenticated")
    return (
      <main
        className={`min-h-screen flex justify-center items-center main-body-${theme}`}
      >
        <h1 className="text-4xl">Registrate para ver esta pantalla</h1>
      </main>
    );
  if (status === "loading")
    return (
      <main
        className={`h-lvh flex justify-center items-center main-body-${theme}`}
      >
        <Spinner />
      </main>
    );
  return (
    <main
      className={`min-h-screen grid grid-cols-5 grid-rows-5 main-body-${theme}`}
    >
      <MainPageCarousel theme={theme} />
      <MainPageGames theme={theme} />
      <MainPageHot theme={theme} />
      <MainPageProfile theme={theme} />
    </main>
  );
}
