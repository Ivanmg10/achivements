'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { AchievementMeta } from '@/hooks/useAchievementDetail'
import { formatDate } from '@/utils/dates'
import { decimal, plural } from '@/utils/utils'
import Figure from '@/components/ui/Figure'

/**
 * An RA achievement's six figures as one row of `Figure`s that fits the dialog: points, players and rarity (known
 * from the game's list), then author, true points and creation date, which come with the detail and hold their
 * place as `loading` figures until it arrives (a dash when it could not be read).
 */
export default function AchievementModalFigures({
  points,
  players,
  numDistinctPlayers,
  meta,
  loading,
}: {
  points: number
  players: number
  numDistinctPlayers: number
  meta: AchievementMeta | null
  loading: boolean
}) {
  const { T, lang } = useLanguage()
  const rarity = numDistinctPlayers > 0 ? `${decimal((players / numDistinctPlayers) * 100, lang)}%` : '—'

  return (
    <dl className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      <Figure term look="tile" label={plural(points, T.plurals.pointsLabel, lang)} value={points} />
      <Figure term look="tile" label={T.achievement.players} value={players} />
      <Figure term look="tile" label={T.achievement.rarity} value={rarity} />
      <Figure term look="tile" label={T.achievement.author} value={meta?.Author || '—'} loading={loading} className="min-w-0 *:max-w-full *:truncate" />
      <Figure term look="tile" label={T.profileStats.truePoints} value={meta ? meta.TrueRatio.toLocaleString(lang) : '—'} loading={loading} />
      <Figure term look="tile" label={T.achievement.created} value={meta?.DateCreated ? formatDate(meta.DateCreated, lang) : '—'} loading={loading} />
    </dl>
  )
}
