'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconStar, IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { UserAward } from '@/types/types'

interface Props {
  award: UserAward
}

export default function StreakCompletionCard({ award }: Props) {
  const { T } = useLanguage()
  const isMastery = award.AwardType === 'Mastery/Completion'
  const isHardcore = award.AwardDataExtra === 1

  return (
    <Link
      href={`/gameInfo/${award.AwardData}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-bg-main hover:bg-white/5 transition-colors group ring-1 ring-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <div className="relative shrink-0">
        {award.ImageIcon ? (
          <Image
            src={`https://retroachievements.org${award.ImageIcon}`}
            alt={award.Title}
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg object-cover"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-white/5" />
        )}
        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${isMastery ? 'bg-yellow-400' : 'bg-green-500'}`}>
          {isMastery
            ? <IconStar className="w-2.5 h-2.5 text-black" aria-hidden />
            : <IconCheck className="w-2.5 h-2.5 text-white" aria-hidden />
          }
        </div>
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors line-clamp-1">
          {award.Title}
        </span>
        <span className="text-[10px] text-text-secondary line-clamp-1">{award.ConsoleName}</span>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isMastery ? 'bg-yellow-400/15 text-yellow-400' : 'bg-green-500/15 text-green-400'}`}>
          {isMastery ? T.streak.mastery : T.streak.beaten}
        </span>
        {isHardcore && (
          <span className="text-[10px] text-warning font-semibold">HC</span>
        )}
      </div>
    </Link>
  )
}
