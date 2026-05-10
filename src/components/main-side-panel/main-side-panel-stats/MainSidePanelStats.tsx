import { useLanguage } from '@/context/LanguageContext'
import { RetroAchievementsUserProfile } from '@/types/types'
import { StatPill } from '@/components/ui/StatPill'

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
      <StatPill size="sm" label="HC" value={raUser.TotalPoints} />
      <StatPill size="sm" label="SC" value={raUser.TotalSoftcorePoints} />
      <StatPill size="sm" label={T.sidePanel.streak} value={`${streak}d`} />
    </section>
  )
}
