"use client";

import GameInfoAchivement from "@/components/game-info-achivement/GameInfoAchivement";
import GameInfoHeader from "@/components/game-info-header/GameInfoHeader";
import {
  RetroAchievement,
  RetroAchievementsGameWithAchievements,
} from "@/types/types";
import { getGamesInfo } from "@/utils/apiCallsUtils";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function GameInfo() {
  const { data: session } = useSession();
  const [gameData, setGameData] =
    useState<RetroAchievementsGameWithAchievements | null>(null);
  const { gameId } = useParams();

  useEffect(() => {
    if (session && gameId) {
      getGamesInfo(gameId as string, session, setGameData);
    }
  }, [gameId, session?.user?.rausername]);

  return (
    <main className="flex flex-col justify-center items-center text-text-main">
      <GameInfoHeader gameData={gameData} />

      <section className="bg-bg-main p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5">
        {gameData && (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-text-secondary text-sm border-b border-bg-header">
                <th className="p-2 w-20">Icono</th>
                <th className="p-2">Logro</th>
                <th className="p-2 w-56">Jugadores</th>
                <th className="p-2 w-20">Puntos</th>
                <th className="p-2 w-20">Obtenido</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(gameData.Achievements ?? {})
                .filter((a): a is RetroAchievement => a !== undefined)
                .map((achievement) => (
                  <GameInfoAchivement
                    achievement={achievement}
                    key={achievement.ID}
                  />
                ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
