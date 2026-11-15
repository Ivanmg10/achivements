import Link from 'next/link'
import type { GameSource } from '@/types/game'
import { gameHref } from '@/utils/gameRef'
import GameIcon from '@/components/game-icon/GameIcon'
import { Skeleton } from '@/components/ui/Skeleton'

const PREVIEW = 6

export type NavGame = { id: number; title: string; imageIcon?: string | null }

/** One list of the navigation card: its name and count, then the first few games (or the line that says there are none). */
export default function MainPagePlatformNavSection({
  source,
  slug,
  emoji,
  label,
  countTone,
  games,
  loading,
  empty,
}: {
  source: Exclude<GameSource, 'ra'>
  slug: string
  emoji: string
  label: string
  /** The platform's colour for the count. */
  countTone: string
  games: NavGame[]
  loading: boolean
  empty: string
}) {
  return (
    <div className="bg-bg-main rounded-box p-3 flex flex-col gap-2.5">
      <Link href={`/${slug}`} className="flex items-center justify-between group focus-ring rounded">
        <span className="flex items-center gap-1.5">
          <span className="text-sm leading-none" aria-hidden="true">{emoji}</span>
          <span className="text-xs font-semibold text-text-main group-hover:text-accent transition-colors">{label}</span>
        </span>
        {loading ? <Skeleton className="h-2.5 w-4" /> : <span className={`text-[10px] font-semibold tabular-nums ${countTone}`}>{games.length}</span>}
      </Link>

      {loading ? (
        <div className="flex gap-1.5" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} radius="tag" className="w-8 h-8" />)}
        </div>
      ) : games.length === 0 ? (
        <p className="text-[10px] text-text-secondary">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {games.slice(0, PREVIEW).map((g) => (
            <Link key={g.id} href={gameHref(source, g.id)} title={g.title} aria-label={g.title} className="rounded focus-ring">
              <GameIcon source={source} id={g.id} imageUrl={g.imageIcon} size={32} className="w-8 h-8 rounded-box-sm hover:scale-110 transition-transform" />
            </Link>
          ))}
          {games.length > PREVIEW && (
            <Link
              href={`/${slug}`}
              className="w-8 h-8 rounded-box-sm bg-bg-card/60 flex items-center justify-center text-[10px] text-text-secondary hover:text-text-main transition-colors"
            >
              +{games.length - PREVIEW}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
