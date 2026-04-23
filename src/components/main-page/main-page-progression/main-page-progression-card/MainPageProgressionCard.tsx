import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import Link from 'next/link'

export default function MainPageProgressionCard({
  game,
}: {
  game: RetroAchievementsGameWithAchievements
}) {
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
        <div className="w-full">
          <div>
            <p className="text-xl">{game?.GameTitle ? game?.GameTitle : game?.Title}</p>
            <p className="text-lg">{game?.ConsoleName}</p>
          </div>

          <div className="flex gap-3">
            <p className="">{game?.UserCompletion}</p>
            <div className="w-[90%] m-auto mt-2 h-3 border bg- border-white rounded-full bg-transparent overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: game?.UserCompletion ?? undefined }}
              />
            </div>
            <p>100%</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
