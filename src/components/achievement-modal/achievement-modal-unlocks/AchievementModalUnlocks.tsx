'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { AchievementUnlock } from '@/hooks/useAchievementDetail'
import { formatDate } from '@/utils/dates'
import { raAvatarUrl } from '@/utils/raAssets'
import Avatar from '@/components/ui/Avatar'
import Tag from '@/components/ui/Tag'
import AccordionItem from '@/components/ui/Accordion'

/** The recent unlocks of an RA achievement, folded away under their count ("6,147 / 6,616") in the library's accordion. */
export default function AchievementModalUnlocks({ unlocks, count, total }: { unlocks: AchievementUnlock[]; count: number; total: number }) {
  const { T, lang } = useLanguage()

  return (
    <AccordionItem title={`${T.achievement.recentUnlocks} (${count.toLocaleString(lang)} / ${total.toLocaleString(lang)})`}>
      <ul className="flex flex-col gap-2">
        {unlocks.map((u, i) => (
          <li key={i} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 min-w-0">
              {u.User ? <Avatar src={raAvatarUrl(u.User)} name={u.User} size={28} /> : <span aria-hidden="true" className="w-7 h-7 rounded-full bg-ink/10 shrink-0" />}
              <span className="text-sm text-text-main truncate">{u.User}</span>
              {u.HardcoreMode === '1' && <Tag tone="hardcore" size="xs">{T.achievement.hardcoreShort}</Tag>}
            </span>
            <span className="text-xs text-text-secondary tabular-nums shrink-0">{formatDate(u.DateAwarded, lang)}</span>
          </li>
        ))}
      </ul>
    </AccordionItem>
  )
}
