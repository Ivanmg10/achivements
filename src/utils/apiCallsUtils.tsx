import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import {
  RetroAchievementsGameWithAchievements,
  WantToPlayGame,
} from "@/types/types";
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { gameKey } from "@/utils/gameRef";
import type { GameCandidate } from "@/utils/gameCandidates";

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
    const res = await fetch('/api/unlinkRaUser', { method: 'POST' })
    if (!res.ok) throw new Error('Failed to unlink RA user')
    await update({ raUser: null } as Partial<Session>)
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

/**
 * An RA game looked up by id, as a picker candidate — for pasting an id to
 * pin or group a game outside the user's own lists. Null when RA has no such
 * game or the lookup fails.
 */
export const fetchRaCandidateById = async (id: number): Promise<GameCandidate | null> => {
  try {
    const res = await fetch(`/api/getGameData?gameId=${id}`)
    if (!res.ok) throw new Error(`Game lookup failed (${res.status})`)
    const data = await res.json()
    if (!data?.Title) return null
    return {
      key: gameKey('ra', id),
      source: 'ra',
      id,
      title: data.Title,
      subtitle: data.ConsoleName ?? '',
      imageRef: data.ImageIcon ?? '',
      pctWon: 0,
      numAwarded: 0,
      maxPossible: data.NumAchievements ?? 0,
      status: null,
    }
  } catch (err) {
    console.error('[fetchRaCandidateById]', id, err)
    return null
  }
};
