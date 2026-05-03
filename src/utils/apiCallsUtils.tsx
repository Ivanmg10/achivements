import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import {
  RetroAchievementsGameWithAchievements,
  WantToPlayGame,
} from "@/types/types";

export const getGamesInfo = async (
  gameId: string,
  session: Session | null,
  setGameData: Dispatch<
    SetStateAction<RetroAchievementsGameWithAchievements | null>
  >,
) => {
  const newGame = await fetch(
    `/api/getGameProgression?gameId=${gameId}`,
  ).then((res) => res.json());

  setGameData(newGame);
};

export const getGamesInfoList = async (
  gameId: string,
  session: Session | null,
  setGames: Dispatch<SetStateAction<RetroAchievementsGameWithAchievements[]>>,
) => {
  const newGame = await fetch(
    `/api/getGameProgression?gameId=${gameId}`,
  ).then((res) => res.json());

  setGames((prev) => [...prev, newGame]);
};

export const unlinkRaUser = async (
  update: (data: Partial<Session>) => Promise<Session | null>,
) => {
  await fetch("/api/updateRaUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raUser: {} }),
  });

  await update({ raUser: {} } as Partial<Session>);
};

export const getWantGames = async (
  session: Session | null,
  setWantGames: Dispatch<SetStateAction<Array<WantToPlayGame>>>,
  setError: Dispatch<SetStateAction<string | undefined>>,
) => {
  try {
    const games = await fetch(`/api/getWantPlayGames`).then((res) =>
      res.json(),
    );

    const getSliceGames = [...(games?.Results ?? [])]
      .sort(() => Math.random() - 0.5)
      .slice(0, 7);

    setWantGames(getSliceGames);
  } catch (err) {
    if (err instanceof Error) {
      setError(err.message);
    } else {
      setError("Unknown error");
    }
  }
};
