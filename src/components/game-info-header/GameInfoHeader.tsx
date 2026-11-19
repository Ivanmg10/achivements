'use client'

import { ReactNode, useMemo, useState } from 'react'
import Image from 'next/image'
import { IconHash, IconExternalLink } from '@tabler/icons-react'
import dynamic from 'next/dynamic'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import { RetroAchievementsGameWithAchievements } from '@/types/types'
import { useLanguage } from '@/context/LanguageContext'
import { CONSOLES } from '@/constants'
import { plural, sumAchievementPoints } from '@/utils/utils'
import { buttonClass } from '@/components/ui/Button'
import { PinToggleButton } from '@/components/pin-toggle-button/PinToggleButton'
import HideGameButton from '@/components/hide-game-button/HideGameButton'
import GameHero, { HERO_TOGGLE } from '@/components/game-hero/GameHero'
import GameHeroChip from '@/components/game-hero/game-hero-chip/GameHeroChip'
import GameHeroProgress from '@/components/game-hero/game-hero-progress/GameHeroProgress'
import GameHeroMedia from '@/components/game-hero/game-hero-media/GameHeroMedia'
import { MISSABLES_ID } from '@/components/missable-panel/MissablePanel'
import { formatDate, formatDay, latestUnlock } from '@/utils/dates'
import { raBoxRatio } from '@/utils/raBoxRatio'
import { raImageUrl } from '@/utils/raAssets'
import { raAchievementList } from '@/utils/gameAchievements'

// Downloaded the first time it opens, not with the page.
const GameHashesModal = dynamic(() => import('./GameHashesModal'), { loading: () => null })

type StatusKey = 'mastered' | 'completed' | 'beatenHC' | 'beaten' | 'inProgress'

const STATUS_TONE: Record<StatusKey, 'warning' | 'success' | 'info'> = {
  mastered: 'warning',
  completed: 'success',
  beatenHC: 'warning',
  beaten: 'success',
  inProgress: 'info',
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

/** The top of an RA game's page, on the shared `GameHero`. */
export default function GameInfoHeader({
  gameData,
  children,
  actions,
  linkMissables = false,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null
  children?: ReactNode
  /** The missables chip opens their panel, on the page that has one (the viewer's own). */
  linkMissables?: boolean
  /** The AI export, first among the buttons. */
  actions?: ReactNode
}) {
  const { T, lang } = useLanguage()
  const [hashesOpen, setHashesOpen] = useState(false)
  const consoleDef = CONSOLES.find((c) => c.id === gameData?.ConsoleID)

  const status = gameData ? deriveStatus(gameData) : null
  const points = useMemo(() => sumAchievementPoints(gameData?.Achievements ?? {}), [gameData])
  const missables = useMemo(
    () => raAchievementList(gameData).filter((a) => a.Type === 'missable' && !a.DateEarned && !a.DateEarnedHardcore).length,
    [gameData],
  )
  const lastUnlock = useMemo(() => latestUnlock(raAchievementList(gameData).flatMap((a) => [a.DateEarnedHardcore, a.DateEarned])), [gameData])
  const earned = gameData?.NumAwardedToUser ?? 0
  const total = gameData?.NumAchievements ?? 0
  const hcPct = parseFloat(gameData?.UserCompletionHardcore ?? '0') || 0
  const scPct = parseFloat(gameData?.UserCompletion ?? '0') || 0
  const pct = (n: number) => `${n.toLocaleString(lang, { maximumFractionDigits: 1 })} %`
  const released = gameData?.Released && /^\d{4}-\d{2}-\d{2}/.test(gameData.Released)
    ? formatDay(gameData.Released.slice(0, 10), lang)
    : gameData?.Released

  return (
    <>
      <GameHero
        cover={{ sources: [raImageUrl(gameData?.ImageBoxArt)], alt: gameData?.Title ?? '', natural: true, ratio: raBoxRatio(gameData?.ConsoleName), optimized: true }}
        title={gameData?.Title ?? ''}
        chips={
          <>
            {gameData?.ConsoleName && (
              <GameHeroChip>
                {consoleDef?.icon && <Image src={consoleDef.icon} alt="" width={14} height={14} className="object-contain shrink-0" />}
                {gameData.ConsoleName}
              </GameHeroChip>
            )}
            {status && <GameHeroChip tone={STATUS_TONE[status]}>{T.gameStatus[status]}</GameHeroChip>}
            {missables > 0 && <GameHeroChip tone="danger" href={linkMissables ? `#${MISSABLES_ID}` : undefined}>{plural(missables, T.plurals.missables, lang)}</GameHeroChip>}
          </>
        }
        progress={
          total > 0 && (
            <GameHeroProgress
              pct={hcPct}
              softPct={scPct}
              label={gameData?.Title ?? ''}
              left={<><strong className="text-text-main font-bold">{pct(hcPct)}</strong> {T.achievement.inHardcore}</>}
              right={T.gameInfoPage.ofAchievements.replace('{n}', String(earned)).replace('{total}', String(total))}
            />
          )
        }
        facts={[
          { label: T.gameInfoPage.released, value: released },
          { label: T.gameInfoPage.developer, value: gameData?.Developer },
          { label: T.gameInfoPage.publisher, value: gameData?.Publisher },
          { label: T.gameInfoPage.genre, value: gameData?.Genre },
          // RA's game answer has no last-played date for the reader: only the last unlock.
          { label: T.gameInfoPage.lastAchievement, value: lastUnlock && formatDate(lastUnlock, lang) },
        ]}
        actions={
          gameData?.ID && (
            <>
              {actions}
              <a
                href={`https://retroachievements.org/game/${gameData.ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass('secondary')}
              >
                <IconExternalLink className="w-4 h-4" aria-hidden="true" />
                {T.profileRa.viewOnRA}
              </a>
              <button type="button" onClick={() => setHashesOpen(true)} className={buttonClass('secondary')}>
                <IconHash className="w-4 h-4" aria-hidden="true" />
                {T.gameInfoPage.hashesCompatible}
              </button>
            </>
          )
        }
        toggles={
          gameData?.ID ? (
            <>
              <PinToggleButton gameId={gameData.ID} className={HERO_TOGGLE} />
              <HideGameButton source="ra" gameId={gameData.ID} title={gameData.Title ?? ''} image={raImageUrl(gameData.ImageIcon) ?? null} className={HERO_TOGGLE} />
            </>
          ) : undefined
        }
        tiles={
          gameData?.ID
            ? [
                ...(total > 0 ? [{ label: T.gameInfoPage.achievements, value: earned, of: total, done: earned === total }] : []),
                ...(points.total > 0 ? [{ label: T.gameInfoPage.points, value: points.earned, of: points.total, done: points.earned === points.total }] : []),
              ]
            : []
        }
        media={
          <GameHeroMedia
            shots={[
              gameData?.ImageTitle ? { src: raImageUrl(gameData.ImageTitle)!, alt: T.gameInfoPage.titleScreen, caption: T.gameInfoPage.titleScreen } : null,
              gameData?.ImageIngame ? { src: raImageUrl(gameData.ImageIngame)!, alt: T.gameInfoPage.inGame, caption: T.gameInfoPage.inGame } : null,
            ]}
          />
        }
      >
        {children}
      </GameHero>

      {gameData?.ID && (
        <LazyWhenOpened open={hashesOpen}>
          <GameHashesModal
            isOpen={hashesOpen}
            onClose={() => setHashesOpen(false)}
            gameId={gameData.ID}
            gameTitle={gameData.Title ?? ''}
          />
        </LazyWhenOpened>
      )}
    </>
  )
}
