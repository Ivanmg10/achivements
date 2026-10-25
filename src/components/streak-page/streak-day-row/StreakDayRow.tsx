'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { RecentAchievement, UserAward } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { achievementBadgeUrl, formatDay, plural } from '@/utils/utils'
import { gameHref } from '@/utils/gameRef'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import StreakCompletionCard from '../streak-completion-card/StreakCompletionCard'

// Downloaded the first time a day with more than fits is opened.
const DayAchievementsModal = dynamic(() => import('@/components/day-achievements-modal/DayAchievementsModal'), { loading: () => null })

const MAX_BADGES = 8

interface Props {
  date: string
  today: string
  achievements: RecentAchievement[]
  awards?: UserAward[]
}

/**
 * The day picked in a streak, as a card: the day in big, how many were
 * unlocked (and "today" when it is), the game and the achievement when there
 * was one or the games when more, and their badges; a game finished that day
 * above it.
 */
export default function StreakDayRow({ date, today, achievements, awards = [] }: Props) {
  const { T, lang } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)
  const visible = achievements.slice(0, MAX_BADGES)
  const overflow = achievements.length - MAX_BADGES
  const first = achievements[0]
  const games = [...new Set(achievements.map((a) => a.GameTitle))]
  const time = first ? new Date(first.Date.replace(' ', 'T')).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }) : ''
  const detail =
    achievements.length === 1 && first ? `${first.GameTitle} · ${first.Title}, ${time}` : games.join(', ')

  return (
    <div className="flex flex-col gap-2">
      {awards.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {awards.map((award) => (
            <StreakCompletionCard key={`${award.AwardType}-${award.AwardData}`} award={award} />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 rounded-[0.875rem] bg-bg-main px-4 py-3 min-w-0">
        <span aria-hidden="true" className="flex flex-col items-center shrink-0 w-12">
          <span className="font-display italic font-extrabold text-[2rem] leading-none tabular-nums pr-1">{formatDay(date, lang, { day: 'numeric' })}</span>
          <span className="text-xs text-text-secondary">{formatDay(date, lang, { month: 'short' })}</span>
        </span>
        <span className="flex flex-col min-w-0 flex-1">
          <h3 className="font-bold">
            <span className="sr-only">{formatDay(date, lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}: </span>
            {plural(achievements.length, T.plurals.achievements, lang)}
            {date === today && ` · ${T.streak.today.toLowerCase()}`}
          </h3>
          {detail && <span className="text-[0.8125rem] text-text-secondary truncate">{detail}</span>}
        </span>
        <span className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[50%]">
          {visible.map((ach) => {
            const badge = achievementBadgeUrl(ach)
            return (
              <Link
                // A Steam unlock has no id of its own, so its number is only
                // unique within its own list — the source has to be in the key.
                key={`${ach.Source ?? 'ra'}:${ach.GameID}:${ach.AchievementID}`}
                href={gameHref(ach.Source ?? 'ra', ach.GameID)}
                aria-label={`${ach.Title} — ${ach.GameTitle}`}
                className={`relative rounded-lg overflow-hidden shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${ach.HardcoreMode === '1' ? 'ring-2 ring-hardcore/70' : ''}`}
              >
                {badge ? (
                  <Image src={badge} alt="" width={40} height={40} className="w-10 h-10 object-cover" unoptimized />
                ) : (
                  <div className="w-10 h-10 bg-bg-card rounded-lg" />
                )}
              </Link>
            )
          })}
          {overflow > 0 && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              aria-label={`+${plural(overflow, T.plurals.achievements, lang)}`}
              className="w-10 h-10 rounded-lg bg-bg-card ring-1 ring-ink/10 flex items-center justify-center shrink-0 cursor-pointer hover:ring-accent/40 hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 group"
            >
              <span className="text-[10px] font-bold text-text-secondary group-hover:text-accent transition-colors leading-none">+{overflow}</span>
            </button>
          )}
        </span>
      </div>

      <LazyWhenOpened open={modalOpen}>
        <AnimatePresence>
          {modalOpen && <DayAchievementsModal date={date} achievements={achievements} onClose={() => setModalOpen(false)} />}
        </AnimatePresence>
      </LazyWhenOpened>
    </div>
  )
}
