'use client'

import Image from 'next/image'
import Link from 'next/link'
import { IconStar, IconCheck } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { gameHref } from '@/utils/gameRef'
import { raImageUrl } from '@/utils/raAssets'
import Tag from '@/components/ui/Tag'

export type DayAward = { AwardType: string; AwardData: number; AwardDataExtra: number; Title: string; ConsoleName: string; ImageIcon?: string }

/** The mastery and beaten awards of a day, each a link to its game. */
export default function DayAchievementsAwards({ awards, onNavigate }: { awards: DayAward[]; onNavigate: () => void }) {
  const { T } = useLanguage()
  const subject = useSubject()
  return (
    <div className="flex flex-col gap-1.5">
      {awards.map(award => {
        const isMastery = award.AwardType === 'Mastery/Completion'
        const isHardcore = award.AwardDataExtra === 1
        return (
          <Link
            key={`${award.AwardType}-${award.AwardData}`}
            href={gameHref('ra', award.AwardData, subject)}
            onClick={onNavigate}
            className="flex items-center gap-3 p-3 rounded-tile bg-bg-main hover:bg-bg-card transition-colors group ring-1 ring-ink/5 focus-ring"
          >
            <div className="relative shrink-0">
              {award.ImageIcon ? (
                <Image
                  src={raImageUrl(award.ImageIcon)!}
                  alt=""
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-box object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-9 h-9 rounded-box bg-ink/5" />
              )}
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-bg-main ring-1 ring-ink/10 flex items-center justify-center ${isMastery ? 'text-hardcore' : 'text-success'}`}>
                {isMastery
                  ? <IconStar className="w-2.5 h-2.5" aria-hidden />
                  : <IconCheck className="w-2.5 h-2.5" aria-hidden />
                }
              </div>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors line-clamp-1">{award.Title}</span>
              <span className="text-[10px] text-text-secondary">{award.ConsoleName}</span>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Tag tone={isMastery ? 'hardcore' : 'success'} size="xs">{isMastery ? T.streak.mastery : T.streak.beaten}</Tag>
              {isHardcore && <span className="text-[10px] text-hardcore font-semibold">{T.achievement.hardcoreShort}</span>}
            </div>
          </Link>
        )
      })}
    </div>
  )
}
