'use client'

import { RetroAchievementsUserProfile } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { StatCard } from '@/components/ui/StatPill'

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
      <StatCard label={T.profileStats.hardcorePoints} value={n(user.TotalPoints)} accent="text-hardcore" />
      <StatCard label={T.profileStats.truePoints} value={n(user.TotalTruePoints)} />
      <StatCard label={T.profileStats.softcorePoints} value={n(user.TotalSoftcorePoints)} />
      <StatCard label={T.profileStats.hardcoreRatio} value={`${hardcoreRatio.toLocaleString(lang)} %`} />
    </div>
  )
}
