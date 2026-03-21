import { RetroAchievementsGame, WantToPlayGame } from "@/types/types";
import Image from "next/image";
import Link from "next/link";

export default function MainPageGamesList({
  listGames,
}: {
  listGames: Array<RetroAchievementsGame> | Array<WantToPlayGame>;
}) {
  return listGames.map(
    (game: RetroAchievementsGame | WantToPlayGame, index: number) => (
      <Link
        key={index}
        className="flex flex-row gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-1 hover:bg-bg-header transition-all duration-300 hover:border-bg-main border-2 border-bg-main cursor-pointer"
        href={`/gameInfo/${game.ID}`}
      >
        {game?.ImageIcon && (
          <Image
            src={`https://retroachievements.org${game?.ImageIcon}`}
            alt="imagen"
            width={50}
            height={50}
            className="w-15 h-15 rounded-bl-xl rounded-tl-xl"
          />
        )}
        <div>
          <p className="text-xl">
            {game?.GameTitle ? game?.GameTitle : game?.Title}
          </p>
          <p className="text-lg">{game?.ConsoleName}</p>
        </div>
      </Link>
    ),
  );
}
