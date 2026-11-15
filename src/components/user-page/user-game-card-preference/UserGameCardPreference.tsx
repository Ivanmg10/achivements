'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useGameCardStyle, type GameCardStyle } from '@/hooks/useGameCardStyle'
import ChoiceCards from '@/components/ui/ChoiceCards'
import UserGameCardPreferencePreview from './user-game-card-preference-preview/UserGameCardPreferencePreview'

/** How a game's card is drawn, as two cards with a drawing each: with the colour of its art (the default) or flat. */
export default function UserGameCardPreference() {
  const { T } = useLanguage()
  const [style, setStyle] = useGameCardStyle()

  return (
    <ChoiceCards<GameCardStyle>
      legend={T.homeLayout.cardsLabel}
      value={style}
      onChange={setStyle}
      options={[
        { value: 'tinted', label: T.homeLayout.cardsTinted, hint: T.homeLayout.cardsTintedHint, preview: <UserGameCardPreferencePreview style="tinted" /> },
        { value: 'flat', label: T.homeLayout.cardsFlat, hint: T.homeLayout.cardsFlatHint, preview: <UserGameCardPreferencePreview style="flat" /> },
      ]}
    />
  )
}
