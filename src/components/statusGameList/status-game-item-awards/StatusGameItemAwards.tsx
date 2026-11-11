'use client'

import { useLanguage } from '@/context/LanguageContext'
import { formatDate } from '@/utils/dates'
import type { GameExtraData } from '../StatusGameList'

/**
 * An RA game's awards as chips: mastered or completed, beaten (each in hardcore or softcore), with the
 * date. Any other kind of award is left out.
 */
export default function StatusGameItemAwards({ awards }: { awards: GameExtraData['awards'] }) {
  const { T, lang } = useLanguage()
  return (
    <>
      {awards.map((award, i) => {
        const date = formatDate(award.AwardedAt, lang)
        const hardcore = award.AwardDataExtra === 1
        if (award.AwardType === 'Mastery/Completion') {
          return (
            <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${hardcore ? 'bg-warning/10 text-warning/90' : 'bg-success/10 text-success/90'}`}>
              <span aria-hidden="true">{hardcore ? '★' : '✓'}</span> {hardcore ? T.statusGameItem.mastered : T.statusGameItem.completed} · {date}
            </span>
          )
        }
        if (award.AwardType === 'Game Beaten') {
          return (
            <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${hardcore ? 'bg-warning/10 text-warning/80' : 'bg-info/10 text-info/90'}`}>
              <span aria-hidden="true">⚔</span> {hardcore ? T.statusGameItem.beatenHardcore : T.statusGameItem.beaten} · {date}
            </span>
          )
        }
        return null
      })}
    </>
  )
}
