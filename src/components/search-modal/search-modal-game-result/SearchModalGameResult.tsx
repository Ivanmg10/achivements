'use client'

import Image from 'next/image'
import { IconBrandSteam } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { candidateIconUrl, CandidateStatus, GameCandidate } from '@/utils/gameCandidates'

const STATUS_CLASSES: Record<CandidateStatus, string> = {
  'completed-hc': 'bg-amber-500/20 text-amber-400',
  'completed-sc': 'bg-green-500/20 text-green-400',
  'perfect': 'bg-[#a4d007]/20 text-[#a4d007]',
  'in-progress': 'bg-blue-500/20 text-blue-400',
  'want-to-play': 'bg-purple-500/20 text-purple-400',
}

/**
 * One game in the header search: icon, title, platform line (console, or
 * Steam with its logo) and a status pill in words, so it is not colour alone.
 */
export default function SearchModalGameResult({
  game,
  onSelect,
}: {
  game: GameCandidate
  onSelect: () => void
}) {
  const { T } = useLanguage()
  const icon = candidateIconUrl(game)

  const STATUS_LABELS: Record<CandidateStatus, string> = {
    'completed-hc': T.search.completedHC,
    'completed-sc': T.search.completedSC,
    'perfect': T.steam.perfect,
    'in-progress': T.search.inProgress,
    'want-to-play': T.search.wantToPlay,
  }

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-main transition-colors text-left cursor-pointer focus-visible:outline-none focus-visible:bg-bg-main"
      onClick={onSelect}
    >
      {icon ? (
        <Image src={icon} alt="" width={32} height={32} className="w-8 h-8 rounded object-cover shrink-0" unoptimized />
      ) : (
        <div className="w-8 h-8 rounded bg-white/10 shrink-0" aria-hidden="true" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main line-clamp-1">{game.title}</p>
        <p className="text-xs text-text-secondary line-clamp-1 flex items-center gap-1">
          {game.source === 'steam' && (
            <IconBrandSteam size={11} className="text-[#66c0f4] shrink-0" aria-hidden="true" />
          )}
          {game.subtitle}
        </p>
      </div>
      {game.status && (
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${STATUS_CLASSES[game.status]}`}
        >
          {STATUS_LABELS[game.status]}
        </span>
      )}
    </button>
  )
}
