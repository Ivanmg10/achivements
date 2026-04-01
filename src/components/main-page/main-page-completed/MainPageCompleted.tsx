"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { RetroAchievementsGameCompleted } from "@/types/types";

import MainPageGamesList from "../main-page-games/main-page-games-list/MainPageGamesList";
import { getGamesCompleted } from "@/utils/apiCallsUtils";
import { USE_MOCK } from "@/constants";

import gamesCompletedSoftcore from "@/mocks/gamesCompletedSoftcore.json";
import gamesCompletedHardcore from "@/mocks/gamesCompletedHardcore.json";

export default function MainPageCompleted() {
  const { status, data: session } = useSession();
  const [listGames, setListGames] = useState<
    Array<RetroAchievementsGameCompleted>
  >([]);
  const [listGamesHardcore, setListGamesHardcore] = useState<
    Array<RetroAchievementsGameCompleted>
  >([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current && !USE_MOCK) {
      hasFetched.current = true;
      getGamesCompleted(session, setListGames, setListGamesHardcore);
    } else if (USE_MOCK) {
      setListGames(gamesCompletedSoftcore);
      setListGamesHardcore(gamesCompletedHardcore);
    }
  }, [status]);

  console.log("listGames", listGames);

  return (
    <>
      <section className="col-start-4 col-end-7 row-start-4 row-end-6 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col justify-between">
        <div className="flex flex-col items-center justify-start">
          <h1 className="text-3xl w-[95%] m-2 py-2 ">Completados</h1>
          {listGames.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              <MainPageGamesList listGames={listGames} />{" "}
              <Link href="/" className="w-[95%] p-2">
                Ver mas...
              </Link>
            </div>
          ) : (
            <>No hay juegos completados en softcore</>
          )}

          <hr className="w-[95%] border-text-main my-4" />
          <h1 className="text-3xl w-[95%] m-2 py-2 ">Completados hardocre</h1>
          {listGamesHardcore.length > 0 ? (
            <div className="w-full flex flex-col items-center">
              <MainPageGamesList listGames={listGamesHardcore} />
              <Link href="/" className="w-[95%] p-2 pb-5">
                Ver mas...
              </Link>
            </div>
          ) : (
            <>No hay juegos completados en modo hardcore</>
          )}
        </div>
      </section>
    </>
  );
}
