'use client'

import { useMemo } from 'react'
import { RecentAchievement } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { useUserAwards } from '@/hooks/useUserAwards'
import RecentAchievementRow from '@/components/recent-achievement-row/RecentAchievementRow'
import Image from 'next/image'
import Link from 'next/link'
import { IconStar, IconCheck } from '@tabler/icons-react'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import Modal from '@/components/ui/Modal'
import { formatDay, utcDay } from '@/utils/dates'
import { raImageUrl } from '@/utils/raAssets'

interface Props {
  date: string
  achievements: RecentAchievement[]
  onClose: () => void
}

const COMPLETION_TYPES = new Set(['Mastery/Completion', 'Game Beaten'])

function awardDate(awardedAt: string): string {
  return utcDay(new Date(awardedAt))
}

export default function DayAchievementsModal({ date, achievements, onClose }: Props) {
  const { T, lang } = useLanguage()
  const subject = useSubject()
  const { awards } = useUserAwards()
  const dayAchs = achievements.filter(a => a.Date.startsWith(date))
  const formatted = formatDay(date, lang, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const dayAwards = useMemo(() => {
    // Mastery/beaten awards are RA's; Steam unlocks in the list simply have none.
    if (!awards?.VisibleUserAwards) return []
    return awards.VisibleUserAwards.filter(
      a => COMPLETION_TYPES.has(a.AwardType) && awardDate(a.AwardedAt) === date
    )
  }, [awards, date])

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
      title={T.dayModal.title}
      hint={formatted}
      className="gap-3"
      footer={
        dayAchs.length > 0 || dayAwards.length > 0 ? (
          <p className="text-xs text-text-secondary">
            {dayAchs.length} {T.dayModal.achievements}
            {dayAwards.length > 0 && ` · ${dayAwards.length} ${T.dayModal.completions}`}
          </p>
        ) : undefined
      }
    >
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
                    href={gameHref('ra', award.AwardData, subject)}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-tile bg-bg-main hover:bg-bg-card transition-colors group ring-1 ring-ink/5 focus-ring"
                  >
                    <div className="relative shrink-0">
                      {award.ImageIcon ? (
                        <Image
                          src={raImageUrl(award.ImageIcon)!}
                          alt={award.Title}
                          width={36}
                          height={36}
                          className="w-9 h-9 rounded-box object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-box bg-ink/5" />
                      )}
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${isMastery ? 'bg-hardcore' : 'bg-success'}`}>
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isMastery ? 'bg-hardcore/15 text-hardcore' : 'bg-success/15 text-success'}`}>
                        {isMastery ? T.streak.mastery : T.streak.beaten}
                      </span>
                      {isHardcore && <span className="text-[10px] text-warning font-semibold">{T.achievement.hardcoreShort}</span>}
                    </div>
                  </Link>
                )
              })}
              {dayAchs.length > 0 && <div className="border-t border-ink/5 mt-1" />}
            </div>
          )}

          {/* Achievement grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {dayAchs.length === 0 && dayAwards.length === 0 ? (
              <p className="col-span-3 text-sm text-text-secondary text-center py-6">{T.dayModal.empty}</p>
            ) : (
              dayAchs.map(ach => (
                <RecentAchievementRow key={ach.AchievementID} ach={ach} onNavigate={onClose} />
              ))
            )}
          </div>
        </div>
    </Modal>
  )
}
