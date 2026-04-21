import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import {
  RecentAchievement,
  RetroAchievementsGameCompleted,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
  WantToPlayGame,
} from "@/types/types";
import { USE_MOCK } from "@/constants";
import userRAMock from "@/mocks/userRA.json";
import wantToPlayMock from "@/mocks/wantToPlay.json";

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
  if (USE_MOCK) {
    const user = userRAMock;
    setUser(user);
    return;
  } else {
    const user = await fetch(`/api/getUserProfile`).then((res) => res.json());

    setUser(user);
  }
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

  const softcore = completedGames
    .filter((g) => g.HardcoreMode === "0" && g.PctWon === "1.0000")
    .slice(0, 3);
  const hardcore = completedGames
    .filter((g) => g.HardcoreMode === "1" && g.PctWon === "1.0000")
    .slice(0, 3);

  setGames(softcore);
  setHardcoreGames(hardcore);
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

export const groupByConsole = (games: RetroAchievementsGameCompleted[]) => {
  const grouped = games.reduce(
    (acc, game) => {
      acc[game.ConsoleName] = (acc[game.ConsoleName] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
};

export const getWantGames = async (
  session: Session | null,
  setWantGames: Dispatch<SetStateAction<Array<WantToPlayGame>>>,
  setError: Dispatch<SetStateAction<string | undefined>>,
) => {
  try {
    let games;

    //FORZAR MOCK
    if (USE_MOCK) {
      games = wantToPlayMock;
    } else {
      games = await fetch(
        `/api/getWantPlayGames`,
      ).then((res) => res.json());
    }

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
  const data: RecentAchievement[] = await fetch(
    `/api/getRecentAchievements`,
  ).then((res) => res.json());

  setAchievements(data);
};
