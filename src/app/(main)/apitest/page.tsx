"use client";

import Spinner from "@/components/main-spinner/Spinner";
import {
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from "@/types/types";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ApiTest() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RetroAchievementsUserProfile | null>(null);
  const [gameData, setGameData] =
    useState<RetroAchievementsGameWithAchievements | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(
      `/api/getUserProfile?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}`,
    )
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const gameId = "5578";

    fetch(`/api/getGameProgression?gameId=${gameId}`)
      .then((res) => res.json())
      .then((data) => setGameData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [data]);

  if (isLoading)
    return (
      <main className="min-h-screen bg-bg-main text-text-main flex justify-center items-center">
        <Spinner />
      </main>
    );
  return (
    <main className="min-h-screen bg-bg-main text-text-main">
      <section className="text-center">
        <h1 className="text-4xl font-bold p-5">User</h1>

        <aside className="flex flex-row items-center justify-center gap-5 p-5">
          {data?.UserPic && (
            <Image
              src={`https://retroachievements.org${data?.UserPic}`}
              alt="UserPic"
              width={200}
              height={200}
            />
          )}
          <div className="text-left m-5">
            <p className="text-3xl mb-5">{data?.User}</p>
            <p>ULID: {data?.ULID}</p>
            <p>MemberSince: {data?.MemberSince}</p>
            <p>TotalPoints: {data?.TotalPoints}</p>
            <p>TotalSoftcorePoints: {data?.TotalSoftcorePoints}</p>
            <p>TotalTruePoints: {data?.TotalTruePoints}</p>
          </div>
        </aside>
      </section>

      <hr className="w-3/4 m-auto mt-5 mb-5" />

      <section className="text-center">
        <h1 className="text-4xl font-bold p-5">Game</h1>

        <aside className="flex flex-row items-center justify-center gap-5 p-5">
          {gameData?.ImageIcon && (
            <Image
              src={`https://retroachievements.org${gameData?.ImageIcon}`}
              alt="UserPic"
              width={200}
              height={200}
            />
          )}
          <div className="text-left m-5">
            <p className="text-3xl mb-5 break-words">{gameData?.Title}</p>
            <p>Console: {gameData?.ConsoleName}</p>
            <p>Developer: {gameData?.Developer}</p>
            <p>Publisher: {gameData?.Publisher}</p>
            <p>Genre: {gameData?.Genre}</p>
            <p>Released: {gameData?.Released}</p>

            <hr className="mb-4 mt-4"></hr>

            <p>NumAchievements: {gameData?.NumAchievements}</p>
            <p>NumAwardedToUser: {gameData?.NumAwardedToUser}</p>
            <p>UserCompletion: {gameData?.UserCompletion}</p>
            <p>UserTotalPlaytime: {gameData?.UserTotalPlaytime}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
