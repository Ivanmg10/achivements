'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useFontStyle } from '@/hooks/useFontStyle'
import { useGameCardStyle } from '@/hooks/useGameCardStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useShapeStyle } from '@/hooks/useShapeStyle'
import LayoutModalPreviewCoverHero from './layout-modal-preview-cover-hero/LayoutModalPreviewCoverHero'
import LayoutModalPreviewSampleGameCard from './layout-modal-preview-sample-game-card/LayoutModalPreviewSampleGameCard'
import LayoutModalPreviewSampleProfile from './layout-modal-preview-sample-profile/LayoutModalPreviewSampleProfile'
import { SAMPLE_GAMES } from './layout-modal-preview-sample'

/**
 * A sample home made from the library's pieces, scoped to the choices being
 * tried so every change is visible before it is saved. The sample data is
 * fixed on purpose: the page behind the dialog never leaks into the preview.
 */
export default function LayoutModalPreview() {
  const { T } = useLanguage()
  const [shape] = useShapeStyle()
  const [font] = useFontStyle()
  const [layout] = useHomeLayout()
  const [cards] = useGameCardStyle()

  return (
    <section
      aria-label={T.homeLayout.previewLabel}
      data-shape={shape}
      data-font={font}
      data-layout={layout}
      data-cards={cards}
      className="overflow-hidden rounded-card bg-bg-main ring-1 ring-ink/[0.1] shadow-2xl shadow-black/30"
    >
      <div className="flex h-11 items-center gap-2 border-b border-ink/[0.08] bg-bg-header px-3">
        <span className="font-display italic font-extrabold text-lg leading-none text-accent pr-1">CV</span>
        <span className="h-5 w-16 rounded-tag bg-ink/[0.08]" />
        <span className="h-5 w-10 rounded-tag bg-ink/[0.08]" />
        <span className="ml-auto h-7 w-7 rounded-full bg-accent/20 ring-1 ring-inset ring-ink/10" />
      </div>

      <div className="flex flex-col gap-3 p-3 sm:p-4">
        {layout === 'cover' && <LayoutModalPreviewCoverHero cards={cards} kicker={T.homeLayout.continueKicker} open={T.homeLayout.openGame} />}

        <div className="grid gap-3 lg:grid-cols-[1.6fr_1fr]">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">{T.homeLayout.continueKicker}</p>
              <span className="h-1.5 w-12 rounded-full bg-ink/10" />
            </div>
            {SAMPLE_GAMES.map((game) => (
              <LayoutModalPreviewSampleGameCard key={game.title} game={game} cards={cards} />
            ))}
          </div>
          <LayoutModalPreviewSampleProfile />
        </div>
      </div>
    </section>
  )
}
