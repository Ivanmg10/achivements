'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useId } from 'react'
import { CategoryGame } from '../../hooks/useGamesByCategory'
import { GameExtraData } from './StatusGameList'
import { useGameProgression } from '@/hooks/useGameProgression'
import { useExclusiveOpen } from '@/hooks/useExclusiveOpen'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import { useSpotlight } from '@/hooks/useSpotlight'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import LibraryDetailRow from '@/components/library-detail-row/LibraryDetailRow'
import RaLibraryDetail from '@/components/ra-library-detail/RaLibraryDetail'

function getGameId(g: CategoryGame): number | string {
  return g.ID ?? g.GameID!
}

function getAchievementMeta(g: CategoryGame): { earned: number | null; total: number; pct: number | null } {
  if ('AchievementsPublished' in g) {
    return { earned: null, total: g.AchievementsPublished, pct: null }
  }
  const pct = parseFloat(g.PctWon) * 100
  return { earned: g.NumAwarded, total: g.MaxPossible, pct }
}

export default function StatusGameItem({
  game,
  extra,
  category,
}: {
  game: CategoryGame
  extra?: GameExtraData
  category?: string
}) {
  const { T, lang } = useLanguage()
  const panelId = useId()
  const onPointerMove = useSpotlight()

  const gameId = getGameId(game)
  const [open, handleToggle] = useExclusiveOpen(`ra:${gameId}`)
  // Asked for on first open; the hook keeps the result when the row closes again.
  const { game: gameData, isLoading, error, refetch } = useGameProgression(open ? String(gameId) : null)
  const loading = isLoading || (open && !gameData && !error)
  const { earned, total, pct } = getAchievementMeta(game)
  const isComplete = earned !== null && earned === total && total > 0
  const consoleDef = CONSOLES.find((c) => c.id === Number(game.ConsoleID))
  const consoleIcon = consoleDef?.icon
  const consoleColor = consoleDef?.color

  const isHardcore = 'HardcoreMode' in game && Number(game.HardcoreMode) === 1

  return (
    <>
      <div
        onPointerMove={onPointerMove}
        className={`spotlight bg-bg-card rounded-2xl overflow-hidden transition-shadow duration-150 ${open ? 'ring-2 ring-accent/60' : 'ring-1 ring-ink/5 hover:ring-ink/15'}`}
      >
        <GameCardBackdrop src={game.ImageIcon ? `https://retroachievements.org${game.ImageIcon}` : null} surface="card" />
        {/* relative: the expand button stretches over this whole header (see the chevron). */}
        <div className="relative flex flex-row items-start gap-3 sm:gap-5 p-4 sm:p-5 hover:bg-bg-header/20 transition-colors">
          {/* Same destination as the title link, so it is kept out of the tab order. */}
          <Link href={`/gameInfo/${gameId}`} tabIndex={-1} aria-hidden="true" className="relative z-10 shrink-0">
            {game.ImageIcon && (
              <div
                className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden transition-all duration-150 ${
                  isHardcore ? 'ring-2 ring-yellow-400/70 hover:ring-yellow-400' : 'hover:ring-2 hover:ring-ink/40'
                }`}
              >
                <Image
                  src={`https://retroachievements.org${game.ImageIcon}`}
                  alt=""
                  width={96}
                  height={96}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl object-cover block"
                />
              </div>
            )}
          </Link>

          <div className="flex flex-col flex-1 min-w-0 gap-1">
            <Link
              href={`/gameInfo/${gameId}`}
              className="relative z-10 self-start max-w-full min-w-0 hover:underline decoration-ink/50 underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <p title={game.Title} className="text-lg sm:text-xl font-semibold leading-tight sm:truncate">{game.Title}</p>
            </Link>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${consoleColor ?? 'bg-bg-main text-text-secondary'}`}>
                {consoleIcon && (
                  <Image src={consoleIcon} alt="" width={12} height={12} className="w-3 h-3 object-contain shrink-0" />
                )}
                {game.ConsoleName}
              </span>
              {extra?.awards.map((award, i) => {
                const date = new Date(award.AwardedAt).toLocaleDateString(lang)
                if (award.AwardType === 'Mastery/Completion') {
                  const isHC = award.AwardDataExtra === 1
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isHC ? 'bg-warning/10 text-warning/90' : 'bg-success/10 text-success/90'
                    }`}>
                      <span aria-hidden="true">{isHC ? '★' : '✓'}</span> {isHC ? T.statusGameItem.mastered : T.statusGameItem.completed} · {date}
                    </span>
                  )
                }
                if (award.AwardType === 'Game Beaten') {
                  const isHC = award.AwardDataExtra === 1
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                      isHC ? 'bg-warning/10 text-warning/80' : 'bg-info/10 text-info/90'
                    }`}>
                      <span aria-hidden="true">⚔</span> {isHC ? T.statusGameItem.beatenHardcore : T.statusGameItem.beaten} · {date}
                    </span>
                  )
                }
                return null
              })}
            </div>
            <p className={`text-sm mt-0.5 ${isComplete ? 'text-green-400' : 'text-text-secondary'}`}>
              {earned !== null ? `${earned} / ${total}` : total} {T.statusGameItem.achievements}
            </p>
            {pct !== null && (
              <div className="flex items-center gap-2 mt-1">
                <ProgressBar
                  pct={isHardcore ? pct : 0}
                  softPct={isHardcore ? 0 : pct}
                  label={game.Title}
                  trackClass="bg-bg-main"
                  className="flex-1"
                />
                <span className={`text-xs tabular-nums ${pct >= 100 ? 'text-success font-semibold' : 'text-text-secondary'}`}>{Math.round(pct)}%</span>
              </div>
            )}
            {'AchievementsPublished' in game
              ? game.PointsTotal > 0 && (
                <p className="text-xs text-text-secondary mt-1">
                  {game.PointsTotal} {T.statusGameItem.pointsTotal}
                  {extra?.lastPlayed && (
                    <> · {T.statusGameItem.lastPlayed} {new Date(extra.lastPlayed).toLocaleDateString(lang)}</>
                  )}
                </p>
              )
              : extra?.possibleScore != null ? (
                <p className="text-xs text-text-secondary mt-1">
                  {`${extra.scoreAchievedHardcore || extra.scoreAchieved || 0} / ${extra.possibleScore} ${T.statusGameItem.pointsEarned}`}
                </p>
              ) : (
                // No score to tell: the line stays, empty, so every closed card is
                // the same height and the masonry columns stay level.
                <p aria-hidden="true" className="text-xs mt-1">{'\u00a0'}</p>
              )}
            {!('AchievementsPublished' in game) && (extra || category === 'playing') && (
              <p className="text-xs text-text-secondary mt-1">
                {T.statusGameItem.lastPlayed} · {extra?.lastPlayed ? new Date(extra.lastPlayed).toLocaleDateString(lang) : T.statusGameItem.longAgo}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0 self-start sm:self-center -mr-2 sm:mr-0">
            <HideGameButton
              source="ra"
              gameId={typeof gameId === 'string' ? parseInt(gameId) : gameId}
              title={game.Title}
              image={game.ImageIcon ? `https://retroachievements.org${game.ImageIcon}` : null}
              className="relative z-10"
            />
            <PinToggleButton gameId={typeof gameId === 'string' ? parseInt(gameId) : gameId} className="relative z-10" />
            {/* The expand control: a real button, its hit area stretched over the whole header. */}
            <button
              type="button"
              onClick={handleToggle}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? T.steam.hideAchievements : T.steam.showAchievements}: ${game.Title}`}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-main cursor-pointer before:absolute before:inset-0 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <span
                aria-hidden="true"
                className="block text-xs transition-transform duration-300"
                style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                ▼
              </span>
            </button>
          </div>
        </div>
      </div>
      <LibraryDetailRow open={open} id={panelId} title={game.Title}>
        <RaLibraryDetail
          game={game}
          gameId={gameId}
          category={category}
          data={gameData}
          loading={loading}
          error={!!error}
          onRetry={refetch}
        />
      </LibraryDetailRow>
    </>
  )
}
