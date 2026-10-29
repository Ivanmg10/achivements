'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { GameCardStyle } from '@/hooks/useGameCardStyle'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { SAMPLE_ART, samplePct, type SampleGame } from '../layout-modal-preview-sample'

/** One fixed game row in the Layout chooser's sample home. */
export default function LayoutModalPreviewSampleGameCard({ game, cards }: { game: SampleGame; cards: GameCardStyle }) {
  const { lang } = useLanguage()
  return (
    <div className="relative isolate overflow-hidden rounded-card p-3 ring-1 ring-ink/[0.08]">
      <GameCardBackdrop src={SAMPLE_ART} style={cards} />
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-14 w-11 shrink-0 rounded-tile bg-ink/15 ring-1 ring-inset ring-ink/10" />
        <span className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="truncate text-sm font-bold text-text-main">{game.title}</span>
          <ProgressBar pct={samplePct(game)} label={game.title} height="h-1" />
        </span>
        <span className="text-xs font-bold tabular-nums text-text-secondary">
          {game.earned.toLocaleString(lang)}/{game.total.toLocaleString(lang)}
        </span>
      </div>
    </div>
  )
}
