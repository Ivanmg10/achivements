import { RetroAchievementsGameWithAchievements } from "@/types/types";

export default function GameInfoProgressionHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null;
}) {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>Standard</span>
          <span>{gameData?.UserCompletion ?? '0%'}</span>
        </div>
        <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: gameData?.UserCompletion ?? '0%' }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-text-secondary">
          <span>Hardcore</span>
          <span>{gameData?.UserCompletionHardcore ?? '0%'}</span>
        </div>
        <div className="w-full h-2 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
            style={{ width: gameData?.UserCompletionHardcore ?? '0%' }}
          />
        </div>
      </div>
    </div>
  );
}
