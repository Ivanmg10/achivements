"use client";

import { RetroAchievementsGameWithAchievements } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import gameProgression from "@/mocks/gameProgression.json";
import { USE_MOCK } from "@/constants";
import MainPageProgressionCard from "./main-page-progression-card/MainPageProgressionCard";
import { getGamesInfoList } from "@/utils/apiCallsUtils";

export default function MainPageProgression() {
  const { status, data: session } = useSession();
  const [games, setGames] = useState<
    Array<RetroAchievementsGameWithAchievements>
  >([]);
  const hasFetched = useRef(false);

  //Por ahora solo se muestran 3 juegos a pelo
  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      /* istanbul ignore else */
      if (USE_MOCK) {
        setGames(gameProgression);
      } else {
        getGamesInfoList("5578", session, setGames);
        getGamesInfoList("2762", session, setGames);
        getGamesInfoList("20580", session, setGames);
        // getGamesInfoList("3152", session, setGames);
      }
    }
  }, [status]);

  return (
    <section className="col-start-1 col-end-7 row-start-1 row-end-2 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col justify-arround items-center">
      <h1 className="text-3xl w-[98%] m-2 py-2">Tus progresos recientes</h1>

      <div className="flex flex-col justify-start items-center w-full mb-5">
        {games &&
          games
            .slice(0, 2)
            .map((game) => (
              <MainPageProgressionCard game={game} key={game.ID} />
            ))}
      </div>
    </section>
  );
}
