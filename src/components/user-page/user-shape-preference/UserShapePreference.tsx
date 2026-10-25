'use client'

import { useId } from 'react'
import { IconShape } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useShapeStyle, type ShapeStyle } from '@/hooks/useShapeStyle'
import SegmentedControl from '@/components/ui/SegmentedControl'

/** The shape of the controls, bars and tags: slanted (the default) or rounded; a row with its switch, kept the moment it is made. */
export default function UserShapePreference() {
  const { T } = useLanguage()
  const [shape, setShape] = useShapeStyle()
  const labelId = useId()

  return (
    <div className="flex items-center gap-3.5 px-1 -mx-1 py-1.5">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 flex items-center justify-center text-text-secondary">
        <IconShape size={18} />
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span id={labelId} className="text-[0.9375rem] font-bold">{T.homeLayout.shapeLabel}</span>
        <span className="text-[0.8125rem] text-text-secondary">{T.homeLayout.shapeHint}</span>
      </span>
      <SegmentedControl<ShapeStyle>
        aria-label={T.homeLayout.shapeLabel}
        size="xs"
        value={shape}
        onChange={setShape}
        options={[
          { value: 'slanted', label: T.homeLayout.shapeSlanted },
          { value: 'round', label: T.homeLayout.shapeRound },
        ]}
      />
    </div>
  )
}
