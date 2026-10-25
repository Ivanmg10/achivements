'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useShapeStyle, type ShapeStyle } from '@/hooks/useShapeStyle'
import ChoiceCards from '@/components/ui/ChoiceCards'
import UserShapePreferencePreview from './user-shape-preference-preview/UserShapePreferencePreview'

/** The shape of the controls, bars and tags, as two cards with a drawing each: slanted (the default) or round. Kept the moment it is chosen. */
export default function UserShapePreference() {
  const { T } = useLanguage()
  const [shape, setShape] = useShapeStyle()

  return (
    <ChoiceCards<ShapeStyle>
      legend={T.homeLayout.shapeLabel}
      value={shape}
      onChange={setShape}
      options={[
        { value: 'slanted', label: T.homeLayout.shapeSlanted, hint: T.homeLayout.shapeSlantedHint, preview: <UserShapePreferencePreview shape="slanted" /> },
        { value: 'round', label: T.homeLayout.shapeRound, hint: T.homeLayout.shapeRoundHint, preview: <UserShapePreferencePreview shape="round" /> },
      ]}
    />
  )
}
