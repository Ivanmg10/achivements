"use client";

import { RetroAchievementsUserProfile } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import MainPageProfileRa from "./main-page-profile-ra/MainPageProfileRa";
import MainPageProfileSt from "./main-page-profile-st/MainPageProfileSt";
import { USE_MOCK } from "@/constants";
import userRAMock from "@/mocks/userRA.json";

export default function MainPageProfile() {
  const { status, data: session } = useSession();
  const [user, setUser] = useState<RetroAchievementsUserProfile | null>();
  const hasFetched = useRef(false);

  const getUserInfo = async () => {
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

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getUserInfo();
    }
  }, [status]);

  return (
    <section className="col-start-4 col-end-6 row-start-3 row-end-7 main-content bg-bg-header text-text-main m-3 rounded-xl break-all">
      <MainPageProfileRa user={user} />

      <MainPageProfileSt />
    </section>
  );
}
