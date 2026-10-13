import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { ProgressBar } from '@/components/ui/ProgressBar'

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
          <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-progress-soft" />
          <span className={scPct >= 100 ? 'text-success font-semibold' : ''}>{gameData?.UserCompletion ?? '0%'}</span>
        </div>
        {hcPct > 0 && (
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block w-2 h-2 rounded-full bg-progress" />
            <span className={hcPct >= 100 ? 'text-success font-semibold' : ''}>{gameData?.UserCompletionHardcore}</span>
          </div>
        )}
      </div>
      <ProgressBar pct={hcPct} softPct={scPct} label={gameData?.Title ?? ''} trackClass="bg-bg-card" />
    </div>
  )
}
