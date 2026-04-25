import { CONSOLES } from "@/constants";
import {
  RetroAchievementsGame,
  RetroAchievementsGameCompleted,
  WantToPlayGame,
} from "@/types/types";
import Image from "next/image";
import Link from "next/link";

type AnyGame = RetroAchievementsGame | WantToPlayGame | RetroAchievementsGameCompleted;

function isCompleted(game: AnyGame): game is RetroAchievementsGameCompleted {
  return 'PctWon' in game && game.PctWon !== undefined;
}

function ringColor(pct: number): string {
  if (pct >= 100) return 'ring-2 ring-yellow-400';
  if (pct >= 75)  return 'ring-2 ring-blue-400';
  if (pct >= 50)  return 'ring-2 ring-gray-500';
  return '';
}

function getBadge(game: AnyGame): { top: string; bottom: string } | null {
  if (isCompleted(game)) {
    const pct = (parseFloat(game.PctWon) || 0) * 100;
    return {
      top: `${pct.toFixed(0)}%`,
      bottom: `${game.NumAwarded}/${game.MaxPossible}`,
    };
  }
  const achievements = (game as RetroAchievementsGame).AchievementsPublished
    ?? (game as WantToPlayGame).AchievementsPublished;
  if (achievements != null && achievements > 0) {
    return { top: `${achievements}`, bottom: 'logros' };
  }
  return null;
}

function badgeAccent(game: AnyGame): string {
  if (!isCompleted(game)) return 'text-gray-400';
  const pct = (parseFloat(game.PctWon) || 0) * 100;
  if (pct >= 100) return 'text-yellow-400';
  if (pct >= 75)  return 'text-blue-400';
  return 'text-gray-400';
}

export default function MainPageGamesList({
  listGames,
}: {
  listGames: Array<AnyGame>;
}) {
  return listGames.map((game: AnyGame, index: number) => {
    const consoleIcon = CONSOLES.find((c) => c.id === game.ConsoleID)?.icon;
    const completed = isCompleted(game);
    const pct = completed ? (parseFloat(game.PctWon) || 0) * 100 : null;
    const badge = getBadge(game);

    return (
      <Link
        key={index}
        className="flex flex-row justify-between p-1 m-2 bg-bg-main rounded-xl w-[95%] border-2 border-bg-main cursor-pointer hover:scale-[1.02] transition-transform duration-200"
        href={`/gameInfo/${game.ID ? game.ID : game.GameID}`}
      >
        <div className="flex flex-row gap-3">
          {game?.ImageIcon && (
            <Image
              src={`https://retroachievements.org${game?.ImageIcon}`}
              alt="imagen"
              width={50}
              height={50}
              className={`w-15 h-15 rounded-bl-xl rounded-tl-xl ${completed && pct !== null ? ringColor(pct) : ''}`}
            />
          )}
          <div className="flex flex-col justify-center">
            <p className="text-xl leading-tight">
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
              <p className="text-sm text-gray-400">{game?.ConsoleName}</p>
            </div>
          </div>
        </div>

        {badge && (
          <div className="flex flex-col items-end justify-center pr-2 shrink-0">
            <span className={`text-sm font-bold ${badgeAccent(game)}`}>{badge.top}</span>
            <span className="text-xs text-gray-500">{badge.bottom}</span>
          </div>
        )}
      </Link>
    );
  });
}
