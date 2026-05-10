import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'
import { DualProgressBar } from '@/components/ui/DualProgressBar'

export default function MainPageProgressionCard({
  game,
}: {
  game: RetroAchievementsGameWithAchievements
}) {
  const scPct = parseFloat(game.UserCompletion ?? '0') || 0
  const hcPct = parseFloat(game.UserCompletionHardcore ?? '0') || 0

  return (
    <Link
      className="flex flex-col items-center justify-center gap-5 p-5 bg-bg-main rounded-xl w-[98%] m-2 border-2 border-bg-main cursor-pointer min-h-1/3 hover:scale-[1.01] transition-transform duration-200"
      key={game.ID}
      href={`/gameInfo/${game.ID}`}
    >
      <div className="flex items-center justify-left gap-5 w-full">
        {game?.ImageIcon && (
          <Image
            src={`https://retroachievements.org${game?.ImageIcon}`}
            alt="UserPic"
            width={100}
            height={100}
            className="w-20 h-20"
          />
        )}
        <div className="w-full flex flex-col gap-2">
          <div>
            <p className="text-xl">{game?.GameTitle ? game?.GameTitle : game?.Title}</p>
            <p className="text-lg">{game?.ConsoleName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{game?.UserCompletion ?? '0%'}</span>
            {hcPct > 0 && (
              <span className="text-xs text-yellow-400">{game?.UserCompletionHardcore} HC</span>
            )}
          </div>
          <DualProgressBar softcorePct={scPct} hardcorePct={hcPct} trackClass="bg-bg-card" height="h-3" />
        </div>
      </div>
    </Link>
  )
}
