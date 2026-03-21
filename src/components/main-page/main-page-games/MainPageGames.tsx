"use client";

import { getRandomGameIds } from "@/utils/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import MainPageGamesList from "./main-page-games-list/MainPageGamesList";
import { RetroAchievementsGame } from "@/types/types";
import recomendedGamesMock from "@/mocks/recomendedGames.json";
import { USE_MOCK } from "@/constants";

export default function MainPageRecommended() {
  const { status } = useSession();
  const [listGames, setListGames] = useState<Array<RetroAchievementsGame>>([]);
  const hasFetched = useRef(false);

  const getListOfGames = async () => {
    if (USE_MOCK) {
      const games = recomendedGamesMock;
      setListGames(games);
      return;
    } else {
      const ids = getRandomGameIds();

      const games = await Promise.all(
        ids.map((id) =>
          fetch(`/api/getGameData?gameId=${id}`)
            .then((res) => res.json())
            .then((game) => ({ ...game, ID: id })),
        ),
      );

      setListGames(games);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getListOfGames();
    }
  }, [status]);

  return (
    <section className="col-start-1 col-end-4 row-start-5 row-end-7 main-content bg-bg-header text-text-main m-3 rounded-xl flex flex-col items-center justify-center">
      <h1 className="text-3xl w-[95%] m-2 py-2 ">Recomendados</h1>
      <MainPageGamesList listGames={listGames} />
      <Link href="/" className="w-[95%] py-2 m-1">
        Ver mas...
      </Link>
    </section>
  );
}
