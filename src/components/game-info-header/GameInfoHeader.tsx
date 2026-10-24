'use client'

import { RetroAchievementsGameWithAchievements } from '@/types/types'
import Image from 'next/image'
import { FadeImage } from '@/components/ui/FadeImage'
import { ReactNode, useMemo, useState } from 'react'
import GameInfoProgressionHeader from './game-info-header-progression/GameInfoProgressionHeader'
import GameHashesModal from './GameHashesModal'
import { CONSOLES } from '@/constants'
import { IconHash, IconExternalLink } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { sumAchievementPoints } from '@/utils/utils'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import GameInfoHeaderStatsBadge from './game-info-header-stats-badge/GameInfoHeaderStatsBadge'
import { buttonClass } from '@/components/ui/Button'

type StatusKey = 'mastered' | 'completed' | 'beatenHC' | 'beaten' | 'inProgress'

const STATUS_CLASSES: Record<StatusKey, string> = {
  mastered: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
  beatenHC: 'bg-warning/15 text-warning',
  beaten: 'bg-success/15 text-success',
  inProgress: 'bg-info/20 text-info',
}

function deriveStatus(gameData: RetroAchievementsGameWithAchievements): StatusKey | null {
  const kind = gameData.HighestAwardKind
  if (kind === 'mastered') return 'mastered'
  if (kind === 'completed') return 'completed'
  if (kind === 'beaten-hardcore') return 'beatenHC'
  if (kind === 'beaten-softcore') return 'beaten'
  if ((gameData.NumAwardedToUser ?? 0) > 0) return 'inProgress'
  return null
}

export default function GameInfoHeader({
  gameData,
  children,
  actions,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
  children?: ReactNode
  /** Extra buttons beside the links (the AI export). */
  actions?: ReactNode
}) {
  const { T } = useLanguage()
  const consoleDef = CONSOLES.find((c) => c.id === gameData?.ConsoleID)
  const consoleIcon = consoleDef?.icon
  const consoleColor = consoleDef?.color
  const [hashesOpen, setHashesOpen] = useState(false)

  const status = gameData ? deriveStatus(gameData) : null
  const points = useMemo(() => sumAchievementPoints(gameData?.Achievements ?? {}), [gameData])
  const achievementsDone = (gameData?.NumAchievements ?? 0) > 0 && gameData?.NumAwardedToUser === gameData?.NumAchievements
  const pointsDone = points.total > 0 && points.earned === points.total

  return (
    <section className="relative p-5 lg:px-8 min-w-[95%] grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 mt-5">

      {/* Content — above background layers */}
      <div className="relative z-10 flex flex-row items-start gap-6 lg:gap-9">
        {gameData?.ImageBoxArt && (
          <FadeImage
            src={`https://retroachievements.org${gameData.ImageBoxArt}`}
            alt={gameData.Title ?? ''}
            width={150}
            height={150}
            className="w-28 lg:w-60 rounded-control shrink-0 overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-ink/10"
            imgClassName="w-full h-auto"
            placeholderClassName="aspect-[3/4]"
          />
        )}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          {/* Console + status row */}
          <div className="flex items-center gap-2 flex-wrap">
            {gameData?.ConsoleName && (
              <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-chip text-xs font-bold bg-ink/[0.08] ${consoleColor ?? 'text-text-main'}`}>
                {consoleIcon && (
                  <Image
                    src={consoleIcon}
                    alt={gameData.ConsoleName}
                    width={14}
                    height={14}
                    className="object-contain shrink-0"
                  />
                )}
                {gameData.ConsoleName}
              </span>
            )}
            {status && (
              <span className={`inline-flex items-center h-7 px-2.5 rounded-chip text-xs font-bold ${STATUS_CLASSES[status]}`}>
                {T.gameStatus[status]}
              </span>
            )}
            {gameData?.ID && <PinToggleButton gameId={gameData.ID} />}
          </div>

          <h1 className="font-display italic font-extrabold text-4xl lg:text-6xl leading-[0.9] pr-2 text-text-main">{gameData?.Title}</h1>

          <GameInfoProgressionHeader gameData={gameData} />
          {children}
          <ul className="grid grid-cols-2 sm:grid-cols-5 gap-x-6 gap-y-2 text-sm max-w-3xl">
            <li className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-text-secondary">{T.gameInfoPage.id}</span>
              <span className="font-semibold truncate">{gameData?.ID}</span>
            </li>
            <li className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-text-secondary">{T.gameInfoPage.publisher}</span>
              <span className="font-semibold truncate">{gameData?.Publisher ?? '—'}</span>
            </li>
            <li className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-text-secondary">{T.gameInfoPage.developer}</span>
              <span className="font-semibold truncate">{gameData?.Developer ?? '—'}</span>
            </li>
            <li className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-text-secondary">{T.gameInfoPage.genre}</span>
              <span className="font-semibold truncate">{gameData?.Genre ?? '—'}</span>
            </li>
            <li className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs text-text-secondary">{T.gameInfoPage.released}</span>
              <span className="font-semibold truncate">{gameData?.Released ?? '—'}</span>
            </li>
          </ul>
          {gameData?.ID && (
            <div className="flex items-center gap-2.5 flex-wrap mt-1">
              {actions}
              <button
                onClick={() => setHashesOpen(true)}
                className={buttonClass('secondary', 'sm')}
              >
                <IconHash className="w-3.5 h-3.5" aria-hidden="true" />
                {T.gameInfoPage.hashesCompatible}
              </button>
              <a
                href={`https://retroachievements.org/game/${gameData.ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass('secondary', 'sm')}
              >
                <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                {T.profileRa.viewOnRA}
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="relative z-10 flex flex-col items-center lg:items-end gap-4 lg:justify-between mt-4 lg:mt-0">
        {gameData?.ID && (
          <div className="flex flex-wrap justify-center lg:justify-end gap-2">
            <GameInfoHeaderStatsBadge
              label={T.gameInfoPage.achievements}
              value={`${gameData.NumAwardedToUser ?? 0} / ${gameData.NumAchievements ?? 0}`}
              done={achievementsDone}
            />
            {points.total > 0 && (
              <GameInfoHeaderStatsBadge label={T.gameInfoPage.points} value={`${points.earned} / ${points.total}`} done={pointsDone} />
            )}
          </div>
        )}
        {(gameData?.ImageTitle || gameData?.ImageIngame) && (
          <div className="grid grid-cols-2 gap-2 w-full max-w-sm lg:max-w-none">
            {gameData.ImageTitle && (
              <div className="flex flex-col gap-0.5">
                <FadeImage
                  src={`https://retroachievements.org${gameData.ImageTitle}`}
                  alt={T.gameInfoPage.titleScreen}
                  width={200}
                  height={150}
                  className="w-full rounded-control aspect-4/3 ring-1 ring-ink/10"
                />
                <span className="text-xs text-text-secondary">{T.gameInfoPage.titleScreen}</span>
              </div>
            )}
            {gameData.ImageIngame && (
              <div className="flex flex-col gap-0.5">
                <FadeImage
                  src={`https://retroachievements.org${gameData.ImageIngame}`}
                  alt={T.gameInfoPage.inGame}
                  width={200}
                  height={150}
                  className="w-full rounded-control aspect-4/3 ring-1 ring-ink/10"
                />
                <span className="text-xs text-text-secondary">{T.gameInfoPage.inGame}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {gameData?.ID && (
        <GameHashesModal
          isOpen={hashesOpen}
          onClose={() => setHashesOpen(false)}
          gameId={gameData.ID}
          gameTitle={gameData.Title ?? ''}
        />
      )}
    </section>
  )
}
