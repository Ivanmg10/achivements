'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { GameCardStyle } from '@/hooks/useGameCardStyle'
import Button from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import GameCardBackdrop from '@/components/game-card-backdrop/GameCardBackdrop'
import { SAMPLE_ART, SAMPLE_GAMES, samplePct } from '../layout-modal-preview-sample'

/** The big game-on-top block of the sample home in its cover layout. */
export default function LayoutModalPreviewCoverHero({ cards, kicker, open }: { cards: GameCardStyle; kicker: string; open: string }) {
  const { lang } = useLanguage()
  const game = SAMPLE_GAMES[0]
  return (
    <section className="relative isolate overflow-hidden rounded-card bg-bg-card p-5 ring-1 ring-ink/[0.08] sm:p-6">
      <GameCardBackdrop src={SAMPLE_ART} style={cards} />
      <p className="text-[0.625rem] font-bold uppercase tracking-[0.16em] text-accent">{kicker}</p>
      <h3 className="mt-1 font-display italic font-extrabold text-4xl leading-[0.9] text-text-main pr-2">{game.title}</h3>
      <div className="mt-4 flex max-w-sm items-center gap-3">
        <ProgressBar pct={samplePct(game)} label={game.title} className="flex-1" />
        <span className="text-sm font-extrabold tabular-nums text-text-main">{game.earned.toLocaleString(lang)} / {game.total.toLocaleString(lang)}</span>
      </div>
      <Button size="sm" disabled className="mt-4">{open}</Button>
    </section>
  )
}
