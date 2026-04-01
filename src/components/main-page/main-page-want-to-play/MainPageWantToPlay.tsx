"use client";

import { WantToPlayGame } from "@/types/types";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import MainPageGamesList from "../main-page-games/main-page-games-list/MainPageGamesList";
import Link from "next/link";

import Spinner from "@/components/main-spinner/Spinner";
import { getWantGames } from "@/utils/apiCallsUtils";

export default function MainPageWantToPlay() {
  const { status, data: session } = useSession();
  const [wantGames, setWantGames] = useState<Array<WantToPlayGame>>([]);
  const [error, setError] = useState<string>();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getWantGames(session, setWantGames, setError);
    }
  }, [status]);

  if (error) return <p>Error: {error}</p>;
  return (
    <section className=" col-start-1 col-end-5 row-start-2 row-end-4 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col items-center justify-between">
      {wantGames.length > 0 ? (
        <>
          {wantGames && (
            <div className="flex flex-col items-center justify-start w-full mb-5">
              <h1 className="text-3xl w-[95%] m-2 py-2 ">Quiero jugar</h1>
              <MainPageGamesList listGames={wantGames} />
            </div>
          )}
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
