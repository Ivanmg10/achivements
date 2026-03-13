"use client";

import { RetroAchievementsGameWithAchievements } from "@/types/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gameProgression from "@/mocks/gameProgression.json";
import { USE_MOCK } from "@/constants";

export default function MainPageProgression() {
  const { status, data: session } = useSession();
  const [games, setGames] = useState<
    Array<RetroAchievementsGameWithAchievements>
  >([]);
  const hasFetched = useRef(false);

  const getGamesInfo = async (gameId: string) => {
    const newGame = await fetch(
      `/api/getGameProgression?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}&gameId=${gameId}`,
    ).then((res) => res.json());

    setGames((prev) => [...prev, newGame]);
  };

  //Por ahora solo se muestran 3 juegos a pelo
  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      if (USE_MOCK) {
        setGames(gameProgression);
      } else {
        getGamesInfo("5578");
        getGamesInfo("788");
        getGamesInfo("19010");
      }
    }
  }, [status]);

  return (
    <section className="col-start-1 col-end-6 row-start-1 row-end-3 main-content bg-bg-header text-text-main m-3 rounded-xl flex flex-col justify-start items-center">
      <h1 className="text-3xl w-[98%] m-2 py-2">
        Bienvenido {session?.user?.name}
      </h1>

      {games.map((game) => (
        <aside
          className="flex flex-col items-center justify-left gap-5 p-5 bg-bg-main rounded-xl w-[98%] m-2 hover:bg-bg-header transition-all duration-300 hover:border-bg-main border-2 border-bg-main cursor-pointer"
          key={game.ID}
        >
          <div className="flex items-center justify-left gap-5 w-full">
            {game?.ImageIcon && (
              <Image
                src={`https://retroachievements.org${game?.ImageIcon}`}
                alt="UserPic"
                width={100}
                height={100}
                className="w-18 h-18"
              />
            )}
            <div className="w-full">
              <div>
                <p className="text-xl">
                  {game?.GameTitle ? game?.GameTitle : game?.Title}
                </p>
                <p className="text-lg">{game?.ConsoleName}</p>
              </div>

              <div className="flex gap-3">
                <p className="">{game?.UserCompletion}</p>
                <div className="w-[90%] m-auto mt-2 h-3 border bg- border-white rounded-full bg-transparent overflow-hidden">
                  <div
                    className="h-full bg-white"
                    style={{ width: game?.UserCompletion ?? undefined }}
                  />
                </div>
                <p>{game?.UserCompletion}</p>
              </div>
            </div>
          </div>
        </aside>
      ))}
    </section>
  );
}
