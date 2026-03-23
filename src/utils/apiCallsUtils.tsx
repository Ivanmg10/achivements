import { Dispatch, SetStateAction } from "react";
import { Session } from "next-auth";
import {
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from "@/types/types";
import { USE_MOCK } from "@/constants";
import userRAMock from "@/mocks/userRA.json";

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

export const getGamesInfoList = async (
  gameId: string,
  session: Session | null,
  setGames: Dispatch<SetStateAction<RetroAchievementsGameWithAchievements[]>>,
) => {
  const newGame = await fetch(
    `/api/getGameProgression?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}&gameId=${gameId}`,
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
    const user = await fetch(
      `/api/getUserProfile?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}`,
    ).then((res) => res.json());

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
