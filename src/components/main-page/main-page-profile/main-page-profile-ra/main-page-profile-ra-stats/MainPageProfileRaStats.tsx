'use client'

import { RetroAchievementsUserProfile } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import Figure from '@/components/ui/Figure'
import { decimal } from '@/utils/utils'
import { retroRatio } from '@/utils/raRatio'

export default function MainPageProfileRaStats({
  user,
}: {
  user: RetroAchievementsUserProfile
}) {
  const { T, lang } = useLanguage()
  const n = (v: number | null | undefined) => (v ?? 0).toLocaleString(lang)
  // RA's own term and figure, "2,85": it was shown as "285 %", read as a hardcore share it is not (#128).
  const ratio = retroRatio(user)

  return (
    <div className="grid grid-cols-2 gap-2">
      <Figure look="card" label={T.profileStats.hardcorePoints} value={n(user.TotalPoints)} tone="hardcore" />
      <Figure look="card" label={T.profileStats.truePoints} value={n(user.TotalTruePoints)} />
      <Figure look="card" label={T.profileStats.softcorePoints} value={n(user.TotalSoftcorePoints)} />
      <Figure look="card" label={T.profileStats.retroRatio} value={ratio === null ? '—' : decimal(ratio, lang, 2)} />
    </div>
  )
}
