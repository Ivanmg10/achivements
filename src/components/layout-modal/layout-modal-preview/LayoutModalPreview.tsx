'use client'

import { LayoutGroup, MotionConfig, motion } from 'framer-motion'
import { useLanguage } from '@/context/LanguageContext'
import type { FontStyle } from '@/hooks/useFontStyle'
import { useGameCardStyle } from '@/hooks/useGameCardStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useShapeStyle } from '@/hooks/useShapeStyle'
import LayoutModalPreviewCoverHero from './layout-modal-preview-cover-hero/LayoutModalPreviewCoverHero'
import LayoutModalPreviewHeader from './layout-modal-preview-header/LayoutModalPreviewHeader'
import LayoutModalPreviewSampleGameCard from './layout-modal-preview-sample-game-card/LayoutModalPreviewSampleGameCard'
import LayoutModalPreviewSampleProfile from './layout-modal-preview-sample-profile/LayoutModalPreviewSampleProfile'
import { SAMPLE_GAMES, SAMPLE_LEAD_ID } from './layout-modal-preview-sample'

const GROW = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }

/**
 * A sample home made from the library's pieces, scoped to the choices being
 * tried. Two choices move it from here: the first game grows into the cover,
 * and the flat style wipes across the cards. The sample data is fixed on
 * purpose: the page behind the dialog never leaks into the preview.
 */
export default function LayoutModalPreview({ font }: { font: FontStyle }) {
  const { T } = useLanguage()
  const [shape] = useShapeStyle()
  const [layout] = useHomeLayout()
  const [cards] = useGameCardStyle()
  const [lead, ...rest] = SAMPLE_GAMES
  const cover = layout === 'cover'

  return (
    <section
      aria-label={T.homeLayout.previewLabel}
      data-shape={shape}
      data-font={font}
      data-layout={layout}
      data-cards={cards}
      className="@container flex h-full flex-col overflow-hidden rounded-card bg-bg-main ring-1 ring-ink/[0.1]"
    >
      <LayoutModalPreviewHeader />

      <MotionConfig reducedMotion="user" transition={GROW}>
        <LayoutGroup>
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
            {cover && <LayoutModalPreviewCoverHero game={lead} kicker={T.homeLayout.continueKicker} open={T.homeLayout.openGame} />}

            <div className="grid min-w-0 items-start gap-3 @2xl:grid-cols-[1.55fr_1fr]">
              <div className="flex min-w-0 flex-col gap-2">
                {!cover && (
                  <motion.p layout="position" className="text-xs font-bold uppercase tracking-[0.14em] text-text-secondary">
                    {T.homeLayout.continueKicker}
                  </motion.p>
                )}
                {!cover && <LayoutModalPreviewSampleGameCard game={lead} cards={cards} order={0} layoutId={SAMPLE_LEAD_ID} />}
                {rest.map((game, i) => (
                  <LayoutModalPreviewSampleGameCard key={game.appId} game={game} cards={cards} order={i + 1} />
                ))}
              </div>
              <motion.div layout="position" className="hidden @2xl:block">
                <LayoutModalPreviewSampleProfile />
              </motion.div>
            </div>
          </div>
        </LayoutGroup>
      </MotionConfig>
    </section>
  )
}
