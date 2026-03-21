import { RetroAchievementsGameWithAchievements } from "@/types/types";
import Image from "next/image";

export default function GameInfoHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null;
}) {
  return (
    <section className="bg-bg-main p-5 rounded-xl flex flex-row items-start gap-5 min-w-[95%]">
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
        {/* //TODO: meter esto en un componente aparte */}
        <div className="flex gap-3">
          <p className="text-sm text-text-secondary">Progreso:</p>
          <p className="">{gameData?.UserCompletion}</p>
          <div className="w-[90%] m-auto mt-2 h-3 border bg- border-white rounded-full bg-transparent overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: gameData?.UserCompletion ?? undefined }}
            />
          </div>
          <p>{gameData?.UserCompletion}</p>
        </div>
        <div className="flex gap-3">
          <p className="text-sm text-text-secondary">Hardcore:</p>
          <p className="">{gameData?.UserCompletionHardcore}</p>
          <div className="w-[90%] m-auto mt-2 h-3 border bg- border-white rounded-full bg-transparent overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: gameData?.UserCompletionHardcore ?? undefined }}
            />
          </div>
          <p>{gameData?.UserCompletionHardcore}</p>
        </div>
      </div>
    </section>
  );
}
