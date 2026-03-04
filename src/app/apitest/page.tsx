"use client";

import {
  RetroAchievementsGame,
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from "@/types/types";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function ApiTest() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RetroAchievementsUserProfile | null>(null);
  const [gameData, setGameData] =
    useState<RetroAchievementsGameWithAchievements | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/getUserProfile")
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    fetch("/api/getGameProgression")
      .then((res) => res.json())
      .then((data) => setGameData(data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [data]);

  console.log(gameData);

  if (isLoading) return <p>Loading...</p>;
  return (
    <main className="min-h-screen">
      <section className="main-content text-center">
        <h1 className="text-4xl font-bold p-5">User</h1>

        <aside className="flex flex-row items-center justify-center gap-5 p-5">
          <Image
            src={"https://retroachievements.org/" + data?.UserPic}
            alt="UserPic"
            width={200}
            height={200}
          />
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

      <section className="main-content text-center">
        <h1 className="text-4xl font-bold p-5">Game</h1>

        <aside className="flex flex-row items-center justify-center gap-5 p-5">
          <Image
            src={"https://retroachievements.org/" + gameData?.ImageIcon}
            alt="UserPic"
            width={200}
            height={200}
          />
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
