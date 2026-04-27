import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsUserProfile } from '@/types/types'

function StatPill({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-bg-main rounded-xl p-2 flex flex-col items-center gap-0.5">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className="text-sm font-bold">
        {value}{suffix}
      </span>
    </div>
  )
}

export default function MainSidePanelStats({
  raUser,
  streak,
}: {
  raUser: RetroAchievementsUserProfile
  streak: number
}) {
  const { T } = useLanguage()

  return (
    <section className="w-[90%] grid grid-cols-3 gap-2">
      <StatPill label="HC" value={raUser.TotalPoints} />
      <StatPill label="SC" value={raUser.TotalSoftcorePoints} />
      <StatPill label={T.sidePanel.streak} value={streak} suffix="d" />
    </section>
  )
}
