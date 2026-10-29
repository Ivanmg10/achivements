'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useFontStyle, type FontStyle } from '@/hooks/useFontStyle'
import ChoiceCards from '@/components/ui/ChoiceCards'
import UserFontPreferencePreview from './user-font-preference-preview/UserFontPreferencePreview'

/** The type family, as three cards with a sample each: Barlow (the default), Sofia Sans or Fira Sans. Kept the moment it is chosen. */
export default function UserFontPreference() {
  const { T } = useLanguage()
  const [font, setFont] = useFontStyle()

  return (
    <ChoiceCards<FontStyle>
      legend={T.homeLayout.fontLabel}
      value={font}
      onChange={setFont}
      columns={3}
      options={[
        { value: 'barlow', label: `${T.homeLayout.fontBarlow} (${T.homeLayout.byDefault})`, hint: T.homeLayout.fontBarlowHint, preview: <UserFontPreferencePreview font="barlow" /> },
        { value: 'sofia', label: T.homeLayout.fontSofia, hint: T.homeLayout.fontSofiaHint, preview: <UserFontPreferencePreview font="sofia" /> },
        { value: 'fira', label: T.homeLayout.fontFira, hint: T.homeLayout.fontFiraHint, preview: <UserFontPreferencePreview font="fira" /> },
      ]}
    />
  )
}
