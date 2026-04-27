'use client'

import { RetroAchievementsUserProfile } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-1">
      <span className={`text-xl font-bold ${accent ?? 'text-white'}`}>
        {value.toLocaleString()}
      </span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  )
}

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
      <StatCard label={T.profileStats.hardcorePoints} value={user.TotalPoints} accent="text-yellow-400" />
      <StatCard label={T.profileStats.truePoints} value={user.TotalTruePoints} accent="text-blue-400" />
      <StatCard label={T.profileStats.softcorePoints} value={user.TotalSoftcorePoints} />
      <div className="bg-bg-card rounded-lg p-3 flex flex-col gap-1">
        <span className="text-xl font-bold text-green-400">{hardcoreRatio}%</span>
        <span className="text-xs text-gray-400">{T.profileStats.hardcoreRatio}</span>
      </div>
    </div>
  )
}
