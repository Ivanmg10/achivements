import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import {
  RecentAchievement,
  RetroAchievementsGameCompleted,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
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

export const getUserInfo = async (
  setUser: Dispatch<SetStateAction<RetroAchievementsUserProfile | null>>,
  session: Session | null,
) => {
  const user = await fetch(`/api/getUserProfile`).then((res) => res.json());
  setUser(user);
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

export const getGamesCompleted = async (
  session: Session | null,
  setGames: Dispatch<SetStateAction<RetroAchievementsGameCompleted[]>>,
  setHardcoreGames: Dispatch<SetStateAction<RetroAchievementsGameCompleted[]>>,
) => {
  const completedGames: RetroAchievementsGameCompleted[] = await fetch(
    `/api/getGamesCompleted`,
  ).then((res) => res.json());

  const hardcore = completedGames
    .filter((g) => Number(g.HardcoreMode) === 1 && parseFloat(g.PctWon) >= 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const hardcoreIds = new Set(hardcore.map((g) => g.GameID));
  const softcore = completedGames
    .filter(
      (g) =>
        Number(g.HardcoreMode) === 0 &&
        parseFloat(g.PctWon) >= 1 &&
        !hardcoreIds.has(g.GameID),
    )
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  setGames(softcore);
  setHardcoreGames(hardcore);
};

export const getGamesInProgress = async (
  session: Session | null,
  setGames: Dispatch<SetStateAction<RetroAchievementsGameCompleted[]>>,
) => {
  const games: RetroAchievementsGameCompleted[] = await fetch(
    `/api/getGamesCompleted`,
  ).then((res) => res.json());

  if (!Array.isArray(games)) return;

  const inProgress = games
    .filter(
      (g) => Number(g.HardcoreMode) === 0 &&
             parseFloat(g.PctWon) > 0 &&
             parseFloat(g.PctWon) < 1,
    )
    .sort(() => Math.random() - 0.5);

  setGames(inProgress);
};

export const getAllGamesPlayed = async (
  session: Session | null,
  setGames: Dispatch<SetStateAction<RetroAchievementsGameCompleted[]>>,
  setHardcoreGames: Dispatch<SetStateAction<RetroAchievementsGameCompleted[]>>,
) => {
  const completedGames: RetroAchievementsGameCompleted[] = await fetch(
    `/api/getGamesCompleted`,
  ).then((res) => res.json());

  if (!Array.isArray(completedGames)) return;

  const softcore = completedGames.filter((g) => g.HardcoreMode === "0");
  const hardcore = completedGames.filter((g) => g.HardcoreMode === "1");

  setGames(softcore);
  setHardcoreGames(hardcore);
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

export const getRecentAchievements = async (
  session: Session | null,
  setAchievements: Dispatch<SetStateAction<RecentAchievement[]>>,
) => {
  const data = await fetch(`/api/getRecentAchievements`).then((res) => res.json());
  if (!Array.isArray(data)) return;
  const sorted = [...data].sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime(),
  );
  setAchievements(sorted);
};
