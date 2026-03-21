import { RetroAchievementsGameWithAchievements } from "@/types/types";
import Image from "next/image";

export default function GameInfoHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null;
}) {
  return (
    <section className="bg-bg-main p-5 rounded-xl flex flex-row items-start gap-5 w-[95%]">
      {gameData?.ImageIcon && (
        <Image
          src={`https://retroachievements.org${gameData?.ImageIcon}`}
          alt="game icon"
          width={150}
          height={150}
          className="w-25 h-25 rounded-xl"
        />
      )}
      <div className="flex flex-col">
        <h1 className="text-3xl">{gameData?.Title}</h1>
        <p className="text-lg">{gameData?.ConsoleName}</p>
        <p className="text-lg mt-2">{gameData?.UserCompletion} % completado</p>
        <p className="text-lg">
          {gameData?.UserCompletionHardcore} % completado en hardcore
        </p>
      </div>
    </section>
  );
}
