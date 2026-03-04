"use client";

import { useTheme } from "@/context/ThemeContext";
import MainPageCarousel from "./main-page-carousel/MainPageCarousel";
import MainPageGames from "./main-page-games/MainPageGames";
import MainPageHot from "./main-page-hot/MainPageHot";
import MainPageProfile from "./main-page-profile/MainPageProfile";

export default function MainPage() {
  const { theme } = useTheme();

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
