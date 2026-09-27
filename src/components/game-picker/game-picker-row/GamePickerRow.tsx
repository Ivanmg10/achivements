'use client'

import Image from 'next/image'
import { IconCheck } from '@tabler/icons-react'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { candidateIconUrl, GameCandidate } from '@/utils/gameCandidates'

/**
 * One selectable game in a picker (pin a game, add to a group): icon, title,
 * platform line, and a check that fills when selected. A toggle button, so
 * the selected state is announced — not only drawn.
 */
export default function GamePickerRow({
  candidate: c,
  selected,
  onToggle,
}: {
  candidate: GameCandidate
  selected: boolean
  onToggle: () => void
}) {
  const icon = candidateIconUrl(c)

  return (
    <button
      onClick={onToggle}
      aria-pressed={selected}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left focus-visible:outline-none focus-visible:bg-bg-main ${selected ? 'bg-accent/10' : 'hover:bg-bg-main'}`}
    >
      {icon ? (
        <Image src={icon} alt="" width={32} height={32} className="w-8 h-8 rounded object-cover shrink-0" unoptimized />
      ) : (
        <div className="w-8 h-8 rounded bg-white/10 shrink-0" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main truncate">{c.title}</p>
        <p className="text-xs text-text-secondary truncate flex items-center gap-1">
          {c.source === 'steam' && <SteamLogo size={11} className="text-[#66c0f4] shrink-0" aria-hidden="true" />}
          {c.subtitle}
        </p>
      </div>
      <div
        aria-hidden="true"
        className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${selected ? 'bg-accent border-accent' : 'border-white/20'}`}
      >
        {selected && <IconCheck className="w-3 h-3 text-bg-main" />}
      </div>
    </button>
  )
}
