import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import {
  RetroAchievementsGameWithAchievements,
  WantToPlayGame,
} from "@/types/types";
import { fetchWithRetry } from "@/lib/fetchWithRetry";

export const getGamesInfo = async (
  gameId: string,
  session: Session | null,
  setGameData: Dispatch<
    SetStateAction<RetroAchievementsGameWithAchievements | null>
  >,
) => {
  try {
    const res = await fetch(`/api/getGameProgression?gameId=${gameId}`)
    if (!res.ok) throw new Error(`Failed to fetch game ${gameId}`)
    const newGame = await res.json()
    setGameData(newGame)
  } catch (err) {
    console.error('[getGamesInfo]', err)
  }
};

export const getGamesInfoList = async (
  gameId: string,
  session: Session | null,
  setGames: Dispatch<SetStateAction<RetroAchievementsGameWithAchievements[]>>,
) => {
  try {
    const res = await fetch(`/api/getGameProgression?gameId=${gameId}`)
    if (!res.ok) throw new Error(`Failed to fetch game ${gameId}`)
    const newGame = await res.json()
    setGames((prev) => [...prev, newGame])
  } catch (err) {
    console.error('[getGamesInfoList]', err)
  }
};

export const unlinkRaUser = async (
  update: (data: Partial<Session>) => Promise<Session | null>,
) => {
  try {
    const res = await fetch("/api/updateRaUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raUser: {} }),
    })
    if (!res.ok) throw new Error('Failed to unlink RA user')
    await update({ raUser: {} } as Partial<Session>)
  } catch (err) {
    console.error('[unlinkRaUser]', err)
  }
};

export const getWantGames = async (
  session: Session | null,
  setWantGames: Dispatch<SetStateAction<Array<WantToPlayGame>>>,
  setError: Dispatch<SetStateAction<string | undefined>>,
) => {
  try {
    const games = await fetchWithRetry(`/api/getWantPlayGames`) as { Results?: WantToPlayGame[] };

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
