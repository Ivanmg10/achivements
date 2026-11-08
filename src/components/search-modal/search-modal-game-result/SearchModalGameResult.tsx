'use client'

import { useLanguage } from '@/context/LanguageContext'
import { candidateIconUrl, CandidateStatus, GameCandidate } from '@/utils/gameCandidates'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'
import { FadeImage } from '@/components/ui/FadeImage'
import Tag, { type TagTone } from '@/components/ui/Tag'
import SearchModalRow from '../search-modal-row/SearchModalRow'

const STATUS_TONES: Record<CandidateStatus, TagTone> = {
  'completed-hc': 'hardcore',
  'completed-sc': 'success',
  'perfect': 'success',
  'in-progress': 'info',
  'want-to-play': 'neutral',
}

/**
 * One game in the header search, as a `SearchModalRow`: icon, title (what
 * matches drawn in the accent), platform line (console, or Steam with its
 * logo) and a status tag in words, so it is not colour alone.
 */
export default function SearchModalGameResult({
  game,
  query = '',
  onSelect,
}: {
  game: GameCandidate
  query?: string
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
    <SearchModalRow
      media={icon ? <FadeImage src={icon} alt="" width={40} height={40} className="w-full h-full" unoptimized /> : null}
      title={game.title}
      query={query}
      sub={
        <span className="inline-flex items-center gap-1 max-w-full">
          <PlatformLogo source={game.source} size={13} className={game.source === 'ra' ? 'opacity-60' : ''} />
          <span className="truncate">{game.subtitle}</span>
        </span>
      }
      right={
        game.status && (
          <Tag size="lg" tone={STATUS_TONES[game.status]} className="shrink-0">
            {STATUS_LABELS[game.status]}
          </Tag>
        )
      }
      onSelect={onSelect}
    />
  )
}
