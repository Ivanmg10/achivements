'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { RecentlyPlayedGame } from '@/types/types'
import { CONSOLES } from '@/constants'
import { formatDate } from '@/utils/dates'
import { gameHref } from '@/utils/gameRef'
import { raImageUrl } from '@/utils/raAssets'
import FeedGameCard from '@/components/feed-game-card/FeedGameCard'

const CONSOLE_BY_NAME = new Map(CONSOLES.map((c) => [c.name, c.icon]))

function pct(achieved: number, total: number) {
  return total ? (achieved / total) * 100 : 0
}

/**
 * One RA game as a row in the recent feed, its bar showing the hardcore share over the softcore one. A
 * mastered game (every achievement in hardcore) gets a gold ring on the icon, alongside the 100%, so it
 * is not told by colour alone. The opened achievements are `children`.
 */
export default function RaGameItem({
  game,
  expanded,
  onToggle,
  children,
  className,
}: {
  game: RecentlyPlayedGame
  expanded: boolean
  onToggle: () => void
  /** The expanded panel, rendered only while expanded. */
  children?: ReactNode
  className?: string
}) {
  const subject = useSubject()
  const { T, lang } = useLanguage()
  const art = raImageUrl(game.ImageIcon) ?? null
  const consoleIcon = CONSOLE_BY_NAME.get(game.ConsoleName)
  const total = game.NumPossibleAchievements
  const earnedAch = game.NumAchievedHardcore || game.NumAchieved
  const earnedPts = game.ScoreAchievedHardcore || game.ScoreAchieved
  const percent = Math.round(pct(earnedAch, total))
  const mastered = total > 0 && game.NumAchievedHardcore >= total

  return (
    <FeedGameCard
      href={gameHref('ra', game.GameID, subject)}
      title={game.Title}
      backdrop={art}
      icon={(cls) =>
        art ? (
          <Image src={art} alt="" width={64} height={64} className={`object-cover ${cls}`} />
        ) : (
          <span className={`block bg-ink/10 ${cls}`} />
        )
      }
      iconBadge={
        consoleIcon && (
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-box-md bg-bg-card ring-1 ring-ink/10 flex items-center justify-center">
            <Image src={consoleIcon} alt="" width={12} height={12} className="w-3 h-3 object-contain" />
          </span>
        )
      }
      ring={mastered ? 'warning' : undefined}
      platform={{ label: game.ConsoleName }}
      progress={total > 0 ? { pct: pct(game.NumAchievedHardcore, total), softPct: pct(game.NumAchieved, total), percent, done: percent >= 100 } : null}
      facts={[
        total > 0 && <span key="a" className="whitespace-nowrap">{earnedAch}/{total} {T.statusGameItem.achievements}</span>,
        total > 0 && <span key="p" className="whitespace-nowrap">{earnedPts}/{game.PossibleScore} {T.libraryDetail.pointsShort}</span>,
        <span key="d" className="whitespace-nowrap">{formatDate(game.LastPlayed, lang)}</span>,
      ]}
      expand={{ show: T.cards.showAchievements, hide: T.cards.hideAchievements }}
      pin={{ gameId: game.GameID }}
      expanded={expanded}
      onToggle={onToggle}
      className={className}
    >
      {children}
    </FeedGameCard>
  )
}
