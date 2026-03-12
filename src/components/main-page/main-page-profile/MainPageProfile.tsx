"use client";

import { RetroAchievementsUserProfile } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import MainPageProfileRa from "./main-page-profile-ra/MainPageProfileRa";
import MainPageProfileSt from "./main-page-profile-st/MainPageProfileSt";

export default function MainPageProfile() {
  const { status, data: session } = useSession();
  const [user, setUser] = useState<RetroAchievementsUserProfile | null>();
  const hasFetched = useRef(false);

  const getUserInfo = async () => {
    const user = await fetch("/api/getUserProfile").then((res) => res.json());

    setUser(user);
  };

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getUserInfo();
    }
  }, [status]);

  return (
    <section className="col-start-4 col-end-6 row-start-2 row-end-4 main-content bg-bg-header text-text-main m-3 rounded-xl">
      <h1 className="text-3xl w-[95%] m-2 py-2">
        Bienvenido {session?.user?.name}
      </h1>
      <MainPageProfileRa user={user} />

      <MainPageProfileSt />
    </section>
  );
}
