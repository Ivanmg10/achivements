'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { RecentAchievement } from '@/types/types'
import { modalOverlay, modalContent } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import { useUserAwards } from '@/hooks/useUserAwards'
import Image from 'next/image'
import Link from 'next/link'
import { IconX, IconStar, IconCheck } from '@tabler/icons-react'

interface Props {
  date: string
  achievements: RecentAchievement[]
  onClose: () => void
}

const COMPLETION_TYPES = new Set(['Mastery/Completion', 'Game Beaten'])

function awardDate(awardedAt: string): string {
  return new Date(awardedAt).toISOString().split('T')[0]
}

export default function DayAchievementsModal({ date, achievements, onClose }: Props) {
  const { T } = useLanguage()
  const { awards } = useUserAwards()
  const dayAchs = achievements.filter(a => a.Date.startsWith(date))
  const formatted = new Date(date + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const dayAwards = useMemo(() => {
    if (!awards?.VisibleUserAwards) return []
    return awards.VisibleUserAwards.filter(
      a => COMPLETION_TYPES.has(a.AwardType) && awardDate(a.AwardedAt) === date
    )
  }, [awards, date])

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
            <p className="text-[10px] uppercase tracking-widest text-text-secondary">{T.dayModal.title}</p>
            <p className="text-sm font-semibold text-text-main mt-0.5">{formatted}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text-secondary hover:text-text-main transition-colors mt-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconX size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0">
          {/* Completion awards */}
          {dayAwards.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {dayAwards.map(award => {
                const isMastery = award.AwardType === 'Mastery/Completion'
                const isHardcore = award.AwardDataExtra === 1
                return (
                  <Link
                    key={`${award.AwardType}-${award.AwardData}`}
                    href={`/gameInfo/${award.AwardData}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl bg-bg-main hover:bg-bg-card transition-colors group ring-1 ring-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    <div className="relative shrink-0">
                      {award.ImageIcon ? (
                        <Image
                          src={`https://retroachievements.org${award.ImageIcon}`}
                          alt={award.Title}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-white/5" />
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${isMastery ? 'bg-yellow-400' : 'bg-green-500'}`}>
                        {isMastery
                          ? <IconStar className="w-2.5 h-2.5 text-black" aria-hidden />
                          : <IconCheck className="w-2.5 h-2.5 text-white" aria-hidden />
                        }
                      </div>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors line-clamp-1">{award.Title}</span>
                      <span className="text-[10px] text-text-secondary">{award.ConsoleName}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isMastery ? 'bg-yellow-400/15 text-yellow-400' : 'bg-green-500/15 text-green-400'}`}>
                        {isMastery ? T.streak.mastery : T.streak.beaten}
                      </span>
                      {isHardcore && <span className="text-[10px] text-warning font-semibold">HC</span>}
                    </div>
                  </Link>
                )
              })}
              {dayAchs.length > 0 && <div className="border-t border-white/5 mt-1" />}
            </div>
          )}

          {/* Achievement grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {dayAchs.length === 0 && dayAwards.length === 0 ? (
              <p className="col-span-3 text-sm text-text-secondary text-center py-6">{T.dayModal.empty}</p>
            ) : (
              dayAchs.map(ach => (
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
              ))
            )}
          </div>
        </div>

        {(dayAchs.length > 0 || dayAwards.length > 0) && (
          <p className="text-xs text-text-secondary text-right pt-2 border-t border-white/5 shrink-0">
            {dayAchs.length} {T.dayModal.achievements}
            {dayAwards.length > 0 && ` · ${dayAwards.length} ${T.streak.completions.split(' ')[0].toLowerCase()}`}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}
