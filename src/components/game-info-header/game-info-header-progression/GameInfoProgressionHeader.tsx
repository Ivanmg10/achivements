import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { DualProgressBar } from '@/components/ui/DualProgressBar'

export default function GameInfoProgressionHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
}) {
  const scPct = parseFloat(gameData?.UserCompletion ?? '0') || 0
  const hcPct = parseFloat(gameData?.UserCompletionHardcore ?? '0') || 0

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-xs">
      <div className="flex justify-between text-xs text-text-secondary">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
          <span>{gameData?.UserCompletion ?? '0%'}</span>
        </div>
        {hcPct > 0 && (
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
            <span>{gameData?.UserCompletionHardcore}</span>
          </div>
        )}
      </div>
      <DualProgressBar
        softcorePct={scPct}
        hardcorePct={hcPct}
        trackClass="bg-bg-card"
      />
    </div>
  )
}
