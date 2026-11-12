'use client'

import { useLanguage } from '@/context/LanguageContext'
import Figure from '@/components/ui/Figure'

/** Three a row on a phone, all six in one from lg: the figures and their skeleton share it, so nothing moves when they land. */
export const KPIS_ROW = 'grid grid-cols-3 lg:grid-cols-6 gap-y-3'

/** The six figures of a profile while the year comes in: their labels and their room, the numbers on their way. */
export default function PublicUserKpisSkeleton() {
  const { T } = useLanguage()
  const labels = [T.userProfile.today, T.userProfile.week, T.userProfile.month, T.userProfile.perDay, T.userProfile.streak, T.userProfile.bestStreak]
  return (
    <div aria-busy="true" className={KPIS_ROW}>
      {labels.map((label) => (
        <Figure key={label} label={label} value="" loading />
      ))}
      {/* Last, so the first figure is first and draws no mark before it. */}
      <span className="sr-only">{T.userProfile.loadingActivity}</span>
    </div>
  )
}
