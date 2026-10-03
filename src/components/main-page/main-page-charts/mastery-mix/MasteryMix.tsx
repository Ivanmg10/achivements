'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { UserAwards } from '@/types/types'

/**
 * RA's awards as parts of one whole, in fixed order: mastered, completed
 * (softcore), beaten hardcore, beaten softcore. The four hues were checked
 * with the palette validator: they clear the colourblind and lightness bands
 * on both themes, and every band is labelled besides, with its count.
 */
export default function MasteryMix({ awards }: { awards: UserAwards }) {
  const { T } = useLanguage()
  const mix = [
    { value: awards.MasteryAwardsCount ?? 0, label: T.cards.mastered, color: 'bg-[#D97706]' },
    { value: awards.CompletionAwardsCount ?? 0, label: T.cards.completedSC, color: 'bg-[#2563EB]' },
    { value: awards.BeatenHardcoreAwardsCount ?? 0, label: T.userStats.beatenHC, color: 'bg-[#15803D]' },
    { value: awards.BeatenSoftcoreAwardsCount ?? 0, label: T.userStats.beatenSC, color: 'bg-[#9333EA]' },
  ]
  const total = mix.reduce((sum, m) => sum + m.value, 0)
  if (total === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-0.5 h-2.5" role="img" aria-label={mix.map((m) => `${m.label}: ${m.value}`).join(', ')}>
        {mix.map(
          (m) =>
            m.value > 0 && (
              <div key={m.label} className={`${m.color} first:rounded-l-full last:rounded-r-full`} style={{ width: `${(m.value / total) * 100}%` }} />
            ),
        )}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1">
        {mix.map((m) => (
          <li key={m.label} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <span className={`w-2 h-2 rounded-sm shrink-0 ${m.color}`} aria-hidden="true" />
            {m.label}
            <span className="text-text-main tabular-nums">{m.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
