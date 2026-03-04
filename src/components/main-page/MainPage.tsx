"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import MainPageCarousel from "./main-page-carousel/MainPageCarousel";
import MainPageGames from "./main-page-games/MainPageGames";
import MainPageHot from "./main-page-hot/MainPageHot";
import MainPageProfile from "./main-page-profile/MainPageProfile";

export default function MainPage() {
  const { theme } = useTheme();
  const { data: session } = useSession();

  if (!session)
    return (
      <main
        className={`min-h-screen flex justify-center items-center main-body-${theme}`}
      >
        <h1 className="text-4xl">Registrate para ver esta pantalla</h1>
      </main>
    );
  return (
    <main
      className={`min-h-screen grid grid-cols-5 grid-rows-5 main-body-${theme}`}
    >
      <h1 className="text-4xl m-7">Hola {session?.user?.name}</h1>
      <button
        onClick={() => signOut()}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        Desconectar
      </button>
      <MainPageCarousel theme={theme} />
      <MainPageGames theme={theme} />
      <MainPageHot theme={theme} />
      <MainPageProfile theme={theme} />
    </main>
  );
}
