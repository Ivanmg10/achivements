"use client";

import { WantToPlayGame } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import MainPageGamesList from "../main-page-games/main-page-games-list/MainPageGamesList";
import Link from "next/link";
import wantToPlayMock from "@/mocks/wantToPlay.json";
import { USE_MOCK } from "@/constants";
import Spinner from "@/components/main-spinner/Spinner";

export default function MainPageWantToPlay() {
  const { status, data: session } = useSession();
  const [wantGames, setWantGames] = useState<Array<WantToPlayGame>>();
  const [error, setError] = useState<string>();
  const hasFetched = useRef(false);

  const getWantGames = async () => {
    try {
      let games;

      //FORZAR MOCK
      if (USE_MOCK) {
        games = wantToPlayMock;
      } else {
        games = await fetch(
          `/api/getWantPlayGames?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}`,
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

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getWantGames();
    }
  }, []);

  console.log(wantGames);

  if (error) return <p>Error: {error}</p>;
  return (
    <section className=" col-start-1 col-end-5 row-start-2 row-end-4 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col items-center justify-center">
      {wantGames ? (
        <>
          <h1 className="text-3xl w-[95%] m-2 py-2 ">Quier@ jugar</h1>
          {wantGames && <MainPageGamesList listGames={wantGames} />}
          <Link href="/" className="w-[95%] py-2 m-1">
            Ver mas...
          </Link>
        </>
      ) : (
        <Spinner size={45} />
      )}
    </section>
  );
}
