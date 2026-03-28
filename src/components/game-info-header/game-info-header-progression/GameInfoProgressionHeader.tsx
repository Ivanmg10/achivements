import { RetroAchievementsGameWithAchievements } from "@/types/types";

export default function GameInfoProgressionHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null;
}) {
  return (
    <div className="w-1/2">
      <div className="flex gap-3">
        <p className="text-sm text-text-secondary">Standard:</p>
        {/* <p className="">{gameData?.UserCompletion}</p> */}
        <div className="w-[90%] m-auto mt-2 h-3 border bg-border-white rounded-full bg-transparent overflow-hidden">
          <div
            className="h-full bg-white"
            style={{ width: gameData?.UserCompletion ?? undefined }}
          />
        </div>
        <p>100%</p>
      </div>
      <div className="flex gap-3">
        <p className="text-sm text-text-secondary">Hardcore:</p>
        {/* <p className="">{gameData?.UserCompletionHardcore}</p> */}
        <div className="w-[90%] m-auto mt-2 h-3 border bg-border-white rounded-full bg-transparent overflow-hidden">
          <div
            className="h-full bg-white"
            style={{ width: gameData?.UserCompletionHardcore ?? undefined }}
          />
        </div>
        <p>100%</p>
      </div>
    </div>
  );
}
