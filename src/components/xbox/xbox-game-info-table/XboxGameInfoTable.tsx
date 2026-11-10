'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { XboxAchievement } from '@/types/xbox'
import type { AchievementColumn } from '@/types/achievementTable'
import { useXboxFavoriteAchievements } from '@/hooks/useXboxFavoriteAchievements'
import { useRevealedAchievements } from '@/hooks/useRevealedAchievements'
import { xboxCompareItem } from '@/utils/gameCompare'
import AchievementTable from '@/components/achievement-table/AchievementTable'

/**
 * An Xbox game's achievements on the shared table, in the order Xbox sends them
 * (its ids are not always numbers): a gamerscore column (what Xbox is about), and
 * secret achievements that stay hidden until the viewer reveals them.
 */
export default function XboxGameInfoTable({
  achievements,
  gameId,
  gameTitle,
}: {
  achievements: XboxAchievement[]
  gameId: number
  gameTitle: string
}) {
  const { T } = useLanguage()
  const { pinned, leading, toggle, canPin } = useXboxFavoriteAchievements(gameId, gameTitle)
  const { isRevealed, toggle: toggleOne, setAll } = useRevealedAchievements()
  const score = (a: XboxAchievement) => <span className="font-semibold text-success">{a.gamerscore} G</span>
  const gamerscore: AchievementColumn<XboxAchievement> = {
    key: 'gamerscore',
    label: T.xbox.score,
    align: 'right',
    width: 'w-24',
    cell: ({ item }) => (
      <>
        <span className="text-base font-extrabold">{item.gamerscore}</span> <span className="text-xs text-text-secondary">G</span>
      </>
    ),
    card: ({ item }) => score(item),
  }

  return (
    <AchievementTable
      source="xbox"
      gameId={gameId}
      gameTitle={gameTitle}
      items={achievements}
      toRow={xboxCompareItem}
      texts={{
        label: T.xbox.achievements,
        name: T.xbox.achievement,
        none: T.xbox.noAchievements,
        earned: T.xbox.earned,
        locked: T.xbox.locked,
        secret: T.xbox.secretAchievement,
        secretText: T.xbox.secretAchievementDesc,
        reveal: T.xbox.revealAchievement,
        conceal: T.xbox.concealAchievement,
        revealAll: T.xbox.showSecretAchievements,
        concealAll: T.xbox.hideSecretAchievements,
      }}
      pins={{ canPin, isPinned: (a) => pinned.has(a.id), leads: (a) => leading.has(a.id), toggle }}
      reveal={{ isRevealed: (a) => isRevealed(a.id), toggle: (a) => toggleOne(a.id), setAll: (as, on) => setAll(as.map((a) => a.id), on) }}
      columns={[gamerscore]}
      detail={{ tags: score }}
    />
  )
}
