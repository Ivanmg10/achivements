'use client'

import { useLanguage } from '@/context/LanguageContext'
import GameCardLine from '@/components/game-card-line/GameCardLine'
import { formatDate } from '@/utils/dates'
import type { CategoryGame } from '@/hooks/useGamesByCategory'
import type { GameExtraData } from '../StatusGameList'

/**
 * The lines under an RA card's bar. A want-to-play game (it has `AchievementsPublished`) tells its
 * total points and when it was last played; any other tells the points earned, or keeps the line's room
 * empty so every closed card is as tall and the masonry columns stay level, and when it was last played.
 */
export default function StatusGameItemLines({ game, extra, category }: { game: CategoryGame; extra?: GameExtraData; category?: string }) {
  const { T, lang } = useLanguage()

  if ('AchievementsPublished' in game) {
    if (game.PointsTotal <= 0) return null
    return (
      <GameCardLine>
        {game.PointsTotal} {T.statusGameItem.pointsTotal}
        {extra?.lastPlayed && <> · {T.statusGameItem.lastPlayed} {formatDate(extra.lastPlayed, lang)}</>}
      </GameCardLine>
    )
  }

  return (
    <>
      {extra?.possibleScore != null ? (
        <GameCardLine>{`${extra.scoreAchievedHardcore || extra.scoreAchieved || 0} / ${extra.possibleScore} ${T.statusGameItem.pointsEarned}`}</GameCardLine>
      ) : (
        <span aria-hidden="true" className="text-xs mt-1">{' '}</span>
      )}
      {(extra || category === 'playing') && (
        <GameCardLine>
          {T.statusGameItem.lastPlayed} · {extra?.lastPlayed ? formatDate(extra.lastPlayed, lang) : T.statusGameItem.longAgo}
        </GameCardLine>
      )}
    </>
  )
}
