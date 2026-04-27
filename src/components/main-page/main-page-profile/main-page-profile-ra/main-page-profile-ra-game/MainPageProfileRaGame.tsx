import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'

function CompletionBar({ label, value, color = 'bg-yellow-500' }: { label: string; value: string; color?: string }) {
  const pct = parseFloat(value) || 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-bg-main rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function MainPageProfileRaGame({
  game,
  richPresenceMsg,
}: {
  game: RetroAchievementsGameWithAchievements
  richPresenceMsg?: string
}) {
  return (
    <Link
      className="bg-bg-card rounded-lg p-3 flex flex-col gap-3 w-full hover:scale-[1.02] transition-transform duration-200"
      href={`/gameInfo/${game.ID}`}
    >
      <p className="text-xs text-gray-400 uppercase tracking-wider">Jugando ahora</p>
      {richPresenceMsg && <p className="text-xs text-gray-300 italic">{richPresenceMsg}</p>}
      <div className="flex gap-3 items-center">
        <Image
          src={`https://retroachievements.org/${game.ImageIcon}`}
          alt="GameIcon"
          width={50}
          height={50}
          className="rounded-lg shrink-0"
        />
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-semibold truncate">{game.Title}</span>
          <span className="text-xs text-gray-400">{game.ConsoleName}</span>
        </div>
      </div>
      {game.UserCompletion && (
        <div className="flex flex-col gap-2">
          <CompletionBar label="Normal" value={game.UserCompletion} />
          {game.UserCompletionHardcore && (
            <CompletionBar label="Hardcore" value={game.UserCompletionHardcore} color="bg-orange-500" />
          )}
        </div>
      )}
    </Link>
  )
}
