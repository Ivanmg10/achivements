'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useFontStyle, type FontStyle } from '@/hooks/useFontStyle'
import { useGameCardStyle } from '@/hooks/useGameCardStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useShapeStyle } from '@/hooks/useShapeStyle'
import { lookTransition, sweepEdge } from '@/utils/lookTransition'
import Modal from '@/components/ui/Modal'
import SegmentedControl, { type Segment } from '@/components/ui/SegmentedControl'
import LayoutModalPreview from './layout-modal-preview/LayoutModalPreview'

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
 * home that follows them (fixed on top of them on a phone). Each kind of change
 * moves in its own way, see `LayoutModalPreview`. The theme has its own dialog.
 * Each choice is kept the moment it is made, but for the font: it is tried in
 * the sample, and the page takes it on the way out, however the dialog closes,
 * so its text does not change behind (the user's call, 2026-11-01).
 */
export default function LayoutModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { T } = useLanguage()
  const [shape, setShape] = useShapeStyle()
  const [font, setFont] = useFontStyle()
  const [layout, setLayout] = useHomeLayout()
  const [cards, setCards] = useGameCardStyle()
  const [triedFont, setTriedFont] = useState<FontStyle | null>(null)
  const shownFont = triedFont ?? font

  function close() {
    const leave = () => {
      if (triedFont) setFont(triedFont)
      setTriedFont(null)
      onClose()
    }
    if (shownFont === font) leave()
    else lookTransition(leave)
  }

  return (
    <Modal isOpen={isOpen} onClose={close} size="2xl" backdrop="opaque" title={T.homeLayout.layoutLabel} hint={T.homeLayout.modalHint} className="gap-0">
      <div className="flex flex-col gap-5 lg:grid lg:h-[min(30rem,calc(92dvh-8rem))] lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[minmax(0,1fr)] lg:gap-5">
        <div className="sticky -top-5 z-10 -mt-5 h-[17.5rem] shrink-0 bg-bg-header pt-5 pb-3 lg:static lg:mt-0 lg:h-auto lg:min-h-0 lg:p-0 min-w-0">
          <LayoutModalPreview font={shownFont} />
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
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
            value={shownFont}
            onChange={(next) => lookTransition(() => setTriedFont(next))}
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
        </div>
      </div>
    </Modal>
  )
}
