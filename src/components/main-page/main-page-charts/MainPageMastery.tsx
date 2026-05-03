import Image from 'next/image'
import Link from 'next/link'
import { UserAwards } from '@/types/types'

export default function MainPageMastery({ awards, isLoading }: { awards: UserAwards | null; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Mastery & Awards</p>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 bg-bg-main rounded-lg h-14 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!awards) return null

  const mastered = awards.VisibleUserAwards?.filter((a) => a.AwardType === 'Mastery') ?? []
  const beaten = awards.VisibleUserAwards?.filter((a) => a.AwardType === 'GameBeaten' || a.AwardType === 'Completion') ?? []
  const recent = [...mastered].slice(0, 4)

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] uppercase tracking-widest text-text-secondary">Mastery & Awards</p>

      <div className="flex gap-2">
        <div className="flex-1 bg-bg-main rounded-lg px-3 py-2 flex flex-col gap-0.5">
          <span className="text-xl font-bold text-yellow-400">{awards.MasteryAwardsCount}</span>
          <span className="text-[10px] text-text-secondary">Mastered</span>
        </div>
        <div className="flex-1 bg-bg-main rounded-lg px-3 py-2 flex flex-col gap-0.5">
          <span className="text-xl font-bold text-blue-400">{awards.BeatenHardcoreAwardsCount}</span>
          <span className="text-[10px] text-text-secondary">Beaten HC</span>
        </div>
        <div className="flex-1 bg-bg-main rounded-lg px-3 py-2 flex flex-col gap-0.5">
          <span className="text-xl font-bold text-text-main">{awards.BeatenSoftcoreAwardsCount}</span>
          <span className="text-[10px] text-text-secondary">Beaten SC</span>
        </div>
        {awards.EventAwardsCount > 0 && (
          <div className="flex-1 bg-bg-main rounded-lg px-3 py-2 flex flex-col gap-0.5">
            <span className="text-xl font-bold text-purple-400">{awards.EventAwardsCount}</span>
            <span className="text-[10px] text-text-secondary">Events</span>
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] text-text-secondary/60 uppercase tracking-widest">Recent masteries</p>
          {recent.map((a, i) => (
            <Link
              key={i}
              href={`/gameInfo/${a.AwardData}`}
              className="flex items-center gap-2 bg-bg-main rounded-lg p-2 hover:bg-white/5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {a.ImageIcon && (
                <Image
                  src={`https://retroachievements.org${a.ImageIcon}`}
                  alt={a.Title}
                  width={28}
                  height={28}
                  className="rounded shrink-0"
                />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold truncate group-hover:text-accent transition-colors">{a.Title}</span>
                <span className="text-[10px] text-text-secondary">{a.ConsoleName}</span>
              </div>
              <span className="text-[10px] text-yellow-400 shrink-0">★ mastery</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
