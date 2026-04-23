import { CONSOLES } from "@/constants";
import {
  RetroAchievementsGame,
  RetroAchievementsGameCompleted,
  WantToPlayGame,
} from "@/types/types";
import Image from "next/image";
import Link from "next/link";

export default function MainPageGamesList({
  listGames,
}: {
  listGames:
    | Array<RetroAchievementsGame>
    | Array<WantToPlayGame>
    | Array<RetroAchievementsGameCompleted>;
}) {
  return listGames.map(
    (
      game:
        | RetroAchievementsGame
        | WantToPlayGame
        | RetroAchievementsGameCompleted,
      index: number,
    ) => {
      const consoleIcon = CONSOLES.find((c) => c.id === game.ConsoleID)?.icon;

      return (
        <Link
          key={index}
          className="flex flex-row justify-between gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-1 border-2 border-bg-main cursor-pointer hover:scale-[1.02] transition-transform duration-200"
          href={`/gameInfo/${game.ID ? game.ID : game.GameID}`}
        >
          <div className="flex flex-row gap-3">
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
              <div className="flex flex-row items-center gap-1">
                {consoleIcon && (
                  <Image
                    src={consoleIcon}
                    alt={game.ConsoleName}
                    width={16}
                    height={16}
                    className="object-contain"
                  />
                )}
                <p className="text-lg">{game?.ConsoleName}</p>
              </div>
            </div>
          </div>
        </Link>
      );
    },
  );
}
