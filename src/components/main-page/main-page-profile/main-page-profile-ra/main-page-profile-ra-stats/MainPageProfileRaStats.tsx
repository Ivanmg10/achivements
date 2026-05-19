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
  const { T } = useLanguage()

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label={T.profileStats.hardcorePoints} value={user.TotalPoints ?? 0} accent="text-yellow-400" />
      <StatCard label={T.profileStats.truePoints} value={user.TotalTruePoints ?? 0} accent="text-blue-400" />
      <StatCard label={T.profileStats.softcorePoints} value={user.TotalSoftcorePoints ?? 0} />
      <StatCard label={T.profileStats.hardcoreRatio} value={`${hardcoreRatio}%`} accent="text-green-400" />
    </div>
  )
}
