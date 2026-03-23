"use client";

import { RetroAchievementsGameWithAchievements } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import MainPageProfileRa from "./main-page-profile-ra/MainPageProfileRa";
import MainPageProfileSt from "./main-page-profile-st/MainPageProfileSt";

import { getGamesInfo } from "@/utils/apiCallsUtils";

export default function MainPageProfile() {
  const { data: session } = useSession();
  const [game, setGame] =
    useState<RetroAchievementsGameWithAchievements | null>(null);

  useEffect(() => {
    if (session?.user?.raUser?.User) {
      getGamesInfo(
        session?.user?.raUser.LastGameID.toString(),
        session,
        setGame,
      );
    }
  }, []);

  return (
    <section className="col-start-4 col-end-6 row-start-3 row-end-7 main-content bg-bg-card text-text-main m-3 rounded-xl break-all flex flex-col items-center">
      <MainPageProfileRa user={session?.user?.raUser} game={game} />

      <MainPageProfileSt />
    </section>
  );
}
