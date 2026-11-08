'use client'

import { RetroAchievementsUserProfile } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import Figure from '@/components/ui/Figure'

export default function MainPageProfileRaStats({
  user,
  hardcoreRatio,
}: {
  user: RetroAchievementsUserProfile
  hardcoreRatio: number
}) {
  const { T, lang } = useLanguage()
  const n = (v: number | null | undefined) => (v ?? 0).toLocaleString(lang)

  return (
    <div className="grid grid-cols-2 gap-2">
      <Figure look="card" label={T.profileStats.hardcorePoints} value={n(user.TotalPoints)} tone="hardcore" />
      <Figure look="card" label={T.profileStats.truePoints} value={n(user.TotalTruePoints)} />
      <Figure look="card" label={T.profileStats.softcorePoints} value={n(user.TotalSoftcorePoints)} />
      <Figure look="card" label={T.profileStats.hardcoreRatio} value={`${hardcoreRatio.toLocaleString(lang)} %`} />
    </div>
  )
}
