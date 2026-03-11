"use client";

import { getRandomGameIds } from "@/utils/utils";
import { Game } from "@retroachievements/api";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export default function MainPageGames() {
  const { status } = useSession();
  const [listGames, setListGames] = useState<Array<Game | undefined>>([]);
  const hasFetched = useRef(false);

  const getListOfGames = async () => {
    const ids = getRandomGameIds();

    const games = await Promise.all(
      ids.map((id) =>
        fetch(`/api/getGameData?gameId=${id}`).then((res) => res.json()),
      ),
    );

    setListGames(games);
  };

  useEffect(() => {
    if (status === "authenticated" && !hasFetched.current) {
      hasFetched.current = true;
      getListOfGames();
    }
  }, [status]);

  console.log(listGames);

  return (
    <section className="col-start-1 col-end-4 row-start-2 row-end-4 main-content bg-bg-header text-text-main m-3 rounded-xl flex flex-col items-center justify-center">
      <h1 className="text-3xl w-[95%] m-2 py-2 ">Recomendados</h1>
      {listGames.map((game: Game | undefined, index: number) => (
        <div
          key={index}
          className="flex flex-row gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-1 hover:bg-bg-header transition-all duration-300 hover:border-bg-main border-2 border-bg-main cursor-pointer"
        >
          <Image
            src={"https://retroachievements.org/" + game?.ImageIcon}
            alt="imagen"
            width={50}
            height={50}
            className="w-15 h-15 rounded-bl-xl rounded-tl-xl"
          />
          <div>
            <p className="text-xl">{game?.GameTitle}</p>
            <p className="text-lg">{game?.ConsoleName}</p>
          </div>
        </div>
      ))}
      <Link href="/" className="w-[95%] py-2 m-1">
        Ver mas...
      </Link>
    </section>
  );
}
