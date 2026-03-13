"use client";

import { WantToPlayGame } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import MainPageGamesList from "../main-page-games/main-page-games-list/MainPageGamesList";
import Link from "next/link";
import wantToPlayMock from "@/mocks/wantToPlay.json";

export default function MainPageWantToPlay() {
  const { status, data: session } = useSession();
  const [wantGames, setWantGames] = useState<Array<WantToPlayGame>>();
  const [error, setError] = useState<string>();
  const hasFetched = useRef(false);

  const USE_MOCK = true;

  const getWantGames = async () => {
    try {
      let user;

      //FORZAR MOCK
      if (USE_MOCK) {
        user = wantToPlayMock;
      } else {
        user = await fetch(
          `/api/getWantPlayGames?username=${session?.user?.rausername}&publicKey=${session?.user?.raid}`,
        ).then((res) => res.json());
      }

      // Solo devuelve los 5 primeros
      const getFiveGames = user.Results.slice(0, 5);

      setWantGames(getFiveGames);
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

  if (error) return <p>Error: {error}</p>;
  return (
    <section className=" col-start-1 col-end-4 row-start-3 row-end-5 main-content bg-bg-header text-text-main m-3 rounded-xl flex flex-col items-center justify-center">
      <h1 className="text-3xl w-[95%] m-2 py-2 ">Want to play</h1>
      {wantGames && <MainPageGamesList listGames={wantGames} />}
      <Link href="/" className="w-[95%] py-2 m-1">
        Ver mas...
      </Link>
    </section>
  );
}
