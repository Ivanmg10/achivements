"use client";

import {
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from "@/types/types";
import { useSession } from "next-auth/react";
import { use, useEffect, useRef, useState } from "react";
import MainPageProfileRa from "./main-page-profile-ra/MainPageProfileRa";
import MainPageProfileSt from "./main-page-profile-st/MainPageProfileSt";
import { USE_MOCK } from "@/constants";
import userRAMock from "@/mocks/userRA.json";
import { getGamesInfo, getUserInfo } from "@/utils/apiCallsUtils";

export default function MainPageProfile() {
  const { status, data: session } = useSession();
  const [user, setUser] = useState<RetroAchievementsUserProfile | null>(null);
  const [game, setGame] =
    useState<RetroAchievementsGameWithAchievements | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getUserInfo(setUser, session);
    }
  }, [status]);

  useEffect(() => {
    if (user) {
      getGamesInfo(user.LastGameID.toString(), session, setGame);
    }
  }, [user]);

  return (
    <section className="col-start-4 col-end-6 row-start-3 row-end-7 main-content bg-bg-header text-text-main m-3 rounded-xl break-all flex flex-col items-center">
      <MainPageProfileRa user={user} game={game} />

      <MainPageProfileSt />
    </section>
  );
}
