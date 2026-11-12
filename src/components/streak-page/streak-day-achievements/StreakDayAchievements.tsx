'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { achievementBadgeUrl } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import ListRow from '@/components/ui/ListRow'
import Button from '@/components/ui/Button'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'

// Downloaded the first time a day with more than fits is opened.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })

const MAX_ROWS = 6

/**
 * What was unlocked on the picked day of a streak: the achievement and its game
 * per row, each opening the game; past six, "and 4 more" opens the whole day.
 * A hardcore unlock (RA) has its badge ringed.
 */
export default function StreakDayAchievements({ date, achievements }: { date: string; achievements: RecentAchievement[] }) {
  const { T, lang } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)
  const overflow = achievements.length - MAX_ROWS

  return (
    <>
      <ul className="flex flex-col">
        {achievements.slice(0, MAX_ROWS).map((ach) => {
          const badge = achievementBadgeUrl(ach)
          return (
            // A Steam unlock has no id of its own, so its number is only
            // unique within its own list: the source has to be in the key.
            <li key={`${ach.Source ?? 'ra'}:${ach.GameID}:${ach.AchievementID}`}>
              <ListRow
                href={gameHref(ach.Source ?? 'ra', ach.GameID)}
                title={ach.Title}
                sub={ach.GameTitle}
                media={
                  <span className="relative w-full h-full">
                    {badge && <Image src={badge} alt="" width={40} height={40} className="w-10 h-10 object-cover" unoptimized />}
                    {ach.HardcoreMode === '1' && <span aria-hidden="true" className="absolute inset-0 rounded-box ring-2 ring-inset ring-hardcore/70" />}
                  </span>
                }
              />
            </li>
          )
        })}
      </ul>
      {overflow > 0 && (
        <Button variant="quiet" size="sm" className="self-start" onClick={() => setModalOpen(true)}>
          {T.streak.dayMore.replace('{n}', overflow.toLocaleString(lang))}
        </Button>
      )}

      <LazyWhenOpened open={modalOpen}>
        <AnimatePresence>
          {modalOpen && <DayAchievementsModal date={date} achievements={achievements} onClose={() => setModalOpen(false)} />}
        </AnimatePresence>
      </LazyWhenOpened>
    </>
  )
}
