'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useHomeLayout, type HomeLayout } from '@/hooks/useHomeLayout'
import ChoiceCards from '@/components/ui/ChoiceCards'
import UserHomeLayoutPreferencePreview from './user-home-layout-preference-preview/UserHomeLayoutPreferencePreview'

/** How the home looks, as two cards with a drawing each: classic (the default) or with the game played last in big on top. */
export default function UserHomeLayoutPreference() {
  const { T } = useLanguage()
  const [layout, setLayout] = useHomeLayout()

  return (
    <ChoiceCards<HomeLayout>
      legend={T.homeLayout.label}
      value={layout}
      onChange={setLayout}
      options={[
        {
          value: 'classic',
          label: `${T.homeLayout.classic} (${T.homeLayout.byDefault})`,
          hint: T.homeLayout.classicHint,
          preview: <UserHomeLayoutPreferencePreview layout="classic" />,
        },
        { value: 'cover', label: T.homeLayout.cover, hint: T.homeLayout.coverHint, preview: <UserHomeLayoutPreferencePreview layout="cover" /> },
      ]}
    />
  )
}
