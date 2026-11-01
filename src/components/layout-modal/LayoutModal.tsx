'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useFontStyle, type FontStyle } from '@/hooks/useFontStyle'
import { useGameCardStyle } from '@/hooks/useGameCardStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useShapeStyle } from '@/hooks/useShapeStyle'
import { lookTransition, sweepEdge } from '@/utils/lookTransition'
import Modal from '@/components/ui/Modal'
import SegmentedControl, { type Segment } from '@/components/ui/SegmentedControl'
import LayoutModalPreview from './layout-modal-preview/LayoutModalPreview'
import LayoutModalThemes from './layout-modal-themes/LayoutModalThemes'

function LayoutChoice<V extends string>({ label, ...control }: { label: string; value: V; onChange: (value: V) => void; options: Segment<V>[] }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-text-secondary">{label}</span>
      <SegmentedControl<V> aria-label={label} size="lg" tone="outline" className="w-full" {...control} />
    </div>
  )
}

const fontName = (font: FontStyle, name: string) => <span data-font={font} className="font-sans">{name}</span>

/**
 * Where the site's look is chosen: every option in view at once, beside a sample
 * home that follows them (fixed on top of them on a phone). Each kind of
 * change moves in its own way, see `LayoutModalPreview` and `LayoutModalThemes`.
 * Each choice is kept the moment it is made; the dialog only closes.
 */
export default function LayoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [shape, setShape] = useShapeStyle()
  const [font, setFont] = useFontStyle()
  const [layout, setLayout] = useHomeLayout()
  const [cards, setCards] = useGameCardStyle()

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" backdrop="opaque" title={T.homeLayout.layoutLabel} hint={T.homeLayout.modalHint} className="gap-0">
      <div className="flex flex-col gap-5 lg:grid lg:h-[min(36rem,calc(92dvh-8rem))] lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <div className="sticky top-0 z-10 h-56 shrink-0 bg-bg-header lg:static lg:h-auto lg:min-h-0 min-w-0">
          <LayoutModalPreview />
        </div>

        <div className="flex min-w-0 flex-col gap-5 lg:overflow-y-auto lg:pr-1">
          <LayoutChoice
            label={T.homeLayout.shapeLabel}
            value={shape}
            onChange={(next) => lookTransition(() => setShape(next), sweepEdge(next))}
            options={[
              { value: 'slanted', label: T.homeLayout.shapeSlanted },
              { value: 'round', label: T.homeLayout.shapeRound },
            ]}
          />
          <LayoutChoice
            label={T.homeLayout.fontLabel}
            value={font}
            onChange={(next) => lookTransition(() => setFont(next))}
            options={[
              { value: 'barlow', label: fontName('barlow', 'Barlow') },
              { value: 'sofia', label: fontName('sofia', 'Sofia') },
              { value: 'fira', label: fontName('fira', 'Fira') },
            ]}
          />
          <LayoutChoice
            label={T.homeLayout.label}
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'classic', label: T.homeLayout.classic },
              { value: 'cover', label: T.homeLayout.cover },
            ]}
          />
          <LayoutChoice
            label={T.homeLayout.cardsLabel}
            value={cards}
            onChange={setCards}
            options={[
              { value: 'tinted', label: T.homeLayout.cardsTinted },
              { value: 'flat', label: T.homeLayout.cardsFlat },
            ]}
          />
          <LayoutModalThemes />
        </div>
      </div>
    </Modal>
  )
}
