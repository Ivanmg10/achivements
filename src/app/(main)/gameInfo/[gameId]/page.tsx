"use client";

import GameInfoHeader from "@/components/game-info-header/GameInfoHeader";
import GameInfoTable from "@/components/game-info-table/GameInfoTable";
import Spinner from "@/components/main-spinner/Spinner";
import NoMainHeader from "@/components/no-main-header/NoMainHeader";
import { RetroAchievementsGameWithAchievements } from "@/types/types";
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

  if (gameData !== null) {
    return (
      <main className="flex flex-col justify-center items-center text-text-main">
        <NoMainHeader />
        <GameInfoHeader gameData={gameData} />
        <GameInfoTable gameData={gameData} />
      </main>
    );
  }

  return (
    <main className="flex flex-col justify-center items-center text-text-main min-h-screen">
      <Spinner size={45} />
    </main>
  );
}
