'use client'

import { useLanguage } from '@/context/LanguageContext'
import { decimal } from '@/utils/utils'

/** "12.3% have it" in a badge's tooltip; nothing when the platform gave no rarity. */
export default function BadgeRarity({ pct }: { pct: number | null }) {
  const { T, lang } = useLanguage()
  if (pct === null) return null
  return (
    <span className="text-xs text-text-secondary">
      {decimal(pct, lang)}
      {T.achievement.haveIt}
    </span>
  )
}
