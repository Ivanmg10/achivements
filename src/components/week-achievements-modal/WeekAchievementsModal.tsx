'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { modalOverlay, modalContent } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import Image from 'next/image'
import Link from 'next/link'
import { IconX } from '@tabler/icons-react'

interface Props {
  startDate: string
  achievements: RecentAchievement[]
  onClose: () => void
}

export default function WeekAchievementsModal({ startDate, achievements, onClose }: Props) {
  const { T } = useLanguage()

  const monday = useMemo(() => new Date(startDate + 'T00:00:00'), [startDate])

  const weekDays = useMemo(() => {
    const days: { date: string; label: string; achievements: RecentAchievement[]; pts: number }[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateKey = d.toISOString().split('T')[0]
      const dayAchs = achievements.filter(a => a.Date.split(' ')[0] === dateKey)
      if (dayAchs.length > 0) {
        days.push({
          date: dateKey,
          label: d.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' }),
          achievements: dayAchs,
          pts: dayAchs.reduce((s, a) => s + a.Points, 0),
        })
      }
    }
    return days
  }, [achievements, monday])

  const totalPts = weekDays.reduce((s, d) => s + d.pts, 0)
  const totalAch = weekDays.reduce((s, d) => s + d.achievements.length, 0)

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <motion.div
        className="bg-bg-header rounded-2xl p-4 w-full max-w-2xl max-h-[70vh] flex flex-col gap-3"
        variants={modalContent}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.cards.bestWeek}</p>
            <p className="text-sm font-semibold text-text-main mt-0.5">
              {T.cards.weekOf.replace('{date}', startDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:text-text-main transition-colors mt-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto flex-1 min-h-0">
          {weekDays.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">{T.dayModal.empty}</p>
          ) : (
            weekDays.map(day => (
              <div key={day.date} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-main capitalize">{day.label}</span>
                  <span className="text-[10px] text-text-secondary">
                    {day.pts.toLocaleString()}pts · {day.achievements.length} {T.dayModal.achievements}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {day.achievements.map(ach => (
                    <Link
                      key={ach.AchievementID}
                      href={`/gameInfo/${ach.GameID}`}
                      onClick={onClose}
                      className="flex gap-2 items-center p-3 rounded-xl bg-bg-main hover:bg-bg-card transition-colors group min-w-0"
                    >
                      {ach.BadgeName ? (
                        <Image
                          src={`https://media.retroachievements.org/Badge/${ach.BadgeName}.png`}
                          alt={ach.Title}
                          width={36}
                          height={36}
                          className="rounded shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded bg-white/10 shrink-0" />
                      )}
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors line-clamp-2">
                          {ach.Title}
                        </span>
                        <span className="text-[10px] text-text-secondary line-clamp-1">{ach.GameTitle}</span>
                      </div>
                      <span className={`text-xs shrink-0 ${ach.HardcoreMode === '1' ? 'text-warning font-semibold' : 'text-text-secondary'}`}>
                        {ach.Points}pts
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {totalAch > 0 && (
          <p className="text-xs text-text-secondary text-right pt-2 border-t border-white/5 shrink-0">
            {totalAch} {T.dayModal.achievements} · {totalPts.toLocaleString()}pts
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
