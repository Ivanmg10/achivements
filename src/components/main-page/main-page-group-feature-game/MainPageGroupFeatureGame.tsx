import Image from 'next/image'
import Link from 'next/link'
import type { GameGroupItem } from '@/types/types'
import type { ItemProgress } from '@/utils/groupItems'
import { gameHref } from '@/utils/gameRef'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { coverSrc } from '@/components/groups/group-cover-mosaic/GroupCoverMosaic'

/** One of the featured group's games: its cover, name and progress, opening its page. */
export default function MainPageGroupFeatureGame({ item, progress }: { item: GameGroupItem; progress: ItemProgress }) {
  const src = coverSrc(item)
  const pct = Math.min(100, Math.round(progress.pct * 100))
  const done = pct >= 100

  return (
    <Link href={gameHref(item.source ?? 'ra', item.game_id)} className="group flex flex-col gap-1.5 min-w-0 rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
      <span className={`block aspect-square rounded-tile overflow-hidden bg-bg-main ring-2 transition-all ${done ? 'ring-progress' : 'ring-transparent group-hover:ring-ink/30'}`}>
        {src && <Image src={src} alt="" width={128} height={128} className="w-full h-full object-cover" unoptimized />}
      </span>
      <span className="text-xs font-medium truncate">{item.title}</span>
      <span className="flex items-center gap-1.5">
        <ProgressBar pct={progress.hard != null ? progress.hard * 100 : pct} softPct={progress.hard != null ? pct : 0} label={item.title} height="h-1" className="flex-1" />
        <span className={`text-[10px] tabular-nums ${done ? 'text-success font-semibold' : 'text-text-secondary'}`}>{pct}%</span>
      </span>
    </Link>
  )
}
