'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement, UserAward } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import DayAchievementsModal from '@/components/day-achievements-modal/DayAchievementsModal'
import StreakCompletionCard from '../streak-completion-card/StreakCompletionCard'

const MAX_BADGES = 20

interface Props {
  date: string
  achievements: RecentAchievement[]
  awards?: UserAward[]
}

function formatDateFull(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function StreakDayRow({ date, achievements, awards = [] }: Props) {
  const { T } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)
  const visible = achievements.slice(0, MAX_BADGES)
  const overflow = achievements.length - MAX_BADGES

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-text-main capitalize">{formatDateFull(date)}</p>
        <span className="text-xs text-text-secondary shrink-0 ml-2">
          {achievements.length} {T.streak.achievements}
        </span>
      </div>

      {awards.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {awards.map((award) => (
            <StreakCompletionCard key={`${award.AwardType}-${award.AwardData}`} award={award} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {visible.map((ach) => (
          <Link
            key={ach.AchievementID}
            href={`/gameInfo/${ach.GameID}`}
            aria-label={`${ach.Title} — ${ach.GameTitle}`}
            className={`relative rounded-lg overflow-hidden shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${ach.HardcoreMode === '1' ? 'ring-2 ring-yellow-400/70' : ''}`}
          >
            {ach.BadgeName ? (
              <Image
                src={`https://media.retroachievements.org/Badge/${ach.BadgeName}.png`}
                alt={ach.Title}
                width={40}
                height={40}
                className="w-10 h-10 object-cover"
                unoptimized
              />
            ) : (
              <div className="w-10 h-10 bg-bg-main rounded-lg" />
            )}
          </Link>
        ))}

        {overflow > 0 && (
          <button
            onClick={() => setModalOpen(true)}
            aria-label={`+${overflow} ${T.streak.achievements}`}
            className="w-10 h-10 rounded-lg bg-bg-main ring-1 ring-white/10 flex items-center justify-center shrink-0 cursor-pointer hover:ring-accent/40 hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 group"
          >
            <span className="text-[10px] font-bold text-text-secondary group-hover:text-accent transition-colors leading-none">
              +{overflow}
            </span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <DayAchievementsModal
            date={date}
            achievements={achievements}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
