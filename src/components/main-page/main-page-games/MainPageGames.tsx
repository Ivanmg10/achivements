"use client";

import { getRandomGameIds } from "@/utils/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import MainPageGamesList from "./main-page-games-list/MainPageGamesList";
import { RetroAchievementsGame } from "@/types/types";
import recomendedGamesMock from "@/mocks/recomendedGames6.json";
import { USE_MOCK } from "@/constants";

const MAX_GAMES = 3;
const CARD_HEIGHT_PX = 70;
const HEADER_PX = 60;
const FOOTER_PX = 40;

export default function MainPageRecommended() {
  const { status } = useSession();
  const [listGames, setListGames] = useState<Array<RetroAchievementsGame>>([]);
  const [visibleCount, setVisibleCount] = useState(MAX_GAMES);
  const sectionRef = useRef<HTMLElement>(null);
  const hasFetched = useRef(false);

  const getListOfGames = async () => {
    /* istanbul ignore else */
    if (USE_MOCK) {
      setListGames(recomendedGamesMock);
      return;
    } else {
      const ids = getRandomGameIds(7);
      const games = await Promise.all(
        ids.map((id) =>
          fetch(`/api/getGameData?gameId=${id}`)
            .then((res) => res.json())
            .then((game) => ({ ...game, ID: id })),
        ),
      );
      setListGames(games);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getListOfGames();
    }
  }, [status]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new ResizeObserver(() => {
      const height = sectionRef.current?.clientHeight ?? 0;
      const available = height - HEADER_PX - FOOTER_PX;
      setVisibleCount(Math.min(MAX_GAMES, Math.max(1, Math.floor(available / CARD_HEIGHT_PX))));
    });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section
        ref={sectionRef}
        className="col-start-1 col-end-4 row-start-2 row-end-3 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col items-center"
      >
        <div className="w-full flex flex-col items-center">
          <h1 className="text-3xl w-[95%] m-2 py-2">Estoy jugando</h1>
          <MainPageGamesList listGames={listGames.slice(0, visibleCount)} />
        </div>
        <Link href="/" className="w-[95%] py-2 m-1 mt-auto">
          Ver mas...
        </Link>
      </section>
    </>
  );
}
