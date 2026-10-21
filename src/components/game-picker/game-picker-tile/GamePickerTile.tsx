import Image from 'next/image'
import { IconCheck } from '@tabler/icons-react'
import { candidateIconUrl, GameCandidate } from '@/utils/gameCandidates'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { ProgressBar } from '@/components/ui/ProgressBar'

/**
 * One selectable game as a cover: art, title, platform line and progress. A
 * toggle button, so being picked is announced; picked also shows a check, not
 * only the ring.
 */
export default function GamePickerTile({
  candidate: c,
  selected,
  onToggle,
}: {
  candidate: GameCandidate
  selected: boolean
  onToggle: () => void
}) {
  const icon = candidateIconUrl(c)
  const pct = Math.min(100, Math.round(c.pctWon * 100))

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className="group flex flex-col gap-1.5 text-left min-w-0 rounded-xl p-1 -m-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
    >
      <span className={`relative block aspect-square rounded-xl overflow-hidden bg-bg-main ring-2 transition-all ${selected ? 'ring-accent' : 'ring-transparent group-hover:ring-ink/30'}`}>
        {icon && <Image src={icon} alt="" width={128} height={128} className={`w-full h-full object-cover transition-opacity ${selected ? 'opacity-70' : ''}`} unoptimized />}
        <span
          aria-hidden="true"
          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
            selected ? 'bg-accent text-bg-main' : 'bg-bg-main/80 ring-1 ring-ink/20 text-transparent [@media(hover:hover)]:opacity-0 group-hover:opacity-100'
          }`}
        >
          <IconCheck className="w-3.5 h-3.5" />
        </span>
      </span>
      <span className="text-xs font-medium text-text-main line-clamp-2 leading-tight">{c.title}</span>
      <span className="text-[11px] text-text-secondary truncate flex items-center gap-1">
        {c.source !== 'ra' && <PlatformLogo source={c.source} size={10} />}
        {c.subtitle}
      </span>
      {c.maxPossible > 0 && <ProgressBar pct={pct} label={c.title} height="h-1" />}
    </button>
  )
}
