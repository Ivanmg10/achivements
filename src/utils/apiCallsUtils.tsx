import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import { RetroAchievementsGameWithAchievements } from "@/types/types";

export const getGamesInfo = async (
  gameId: string,
  session: Session | null,
  setGameData: Dispatch<
    SetStateAction<RetroAchievementsGameWithAchievements | null>
  >,
) => {
  const newGame = await fetch(
    `/api/getGameProgression?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}&gameId=${gameId}`,
  ).then((res) => res.json());

  setGameData(newGame);
};

export const getGamesInfoList = async (gameId: string, session: Session | null, setGames: Dispatch<SetStateAction<RetroAchievementsGameWithAchievements[]>>) => {
  const newGame = await fetch(
    `/api/getGameProgression?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}&gameId=${gameId}`,
  ).then((res) => res.json());

  setGames((prev) => [...prev, newGame]);
};
