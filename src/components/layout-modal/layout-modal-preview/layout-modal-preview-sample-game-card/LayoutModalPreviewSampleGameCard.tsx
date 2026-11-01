'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import type { GameCardStyle } from '@/hooks/useGameCardStyle'
import { FadeImage } from '@/components/ui/FadeImage'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { sampleCover, samplePct, type SampleGame } from '../layout-modal-preview-sample'

/**
 * One fixed game row in the Layout chooser's sample home. The tint is always
 * under a flat surface that wipes across it (`order` staggers the cards), since
 * a gradient cannot ease into a plain colour.
 */
export default function LayoutModalPreviewSampleGameCard({ game, cards, order, layoutId }: { game: SampleGame; cards: GameCardStyle; order: number; layoutId?: string }) {
  const { lang } = useLanguage()
  return (
    <motion.div layout={layoutId ? undefined : 'position'} layoutId={layoutId} className="relative isolate shrink-0 overflow-hidden rounded-tile p-2.5">
      <GameCardBackdrop src={sampleCover(game)} style="tinted" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-[inherit] bg-bg-main shadow-[inset_0_0_0_1px_rgb(var(--ink)/0.08)] transition-[clip-path] duration-(--motion-indicator) ease-(--enter-ease) motion-reduce:transition-none"
        style={{ clipPath: cards === 'flat' ? 'inset(0)' : 'inset(0 0 0 100%)', transitionDelay: `${order * 50}ms` }}
      />
      <div className="flex items-center gap-3">
        <FadeImage src={sampleCover(game)} alt="" width={46} height={62} className="h-[3.875rem] w-[2.875rem] shrink-0 overflow-hidden rounded-box" />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-sm font-bold text-text-main">{game.title}</span>
          <ProgressBar pct={samplePct(game)} label={game.title} height="h-1.5" />
          <span className="text-xs tabular-nums text-text-secondary">
            {game.earned.toLocaleString(lang)} / {game.total.toLocaleString(lang)}
          </span>
        </span>
      </div>
    </motion.div>
  )
}
