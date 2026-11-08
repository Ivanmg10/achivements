'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import type { VaultGuideText } from '@/translations/vaultGuide'
import { PLATFORM_COLOR } from '@/components/vault-platform-split/VaultPlatformSplit'
import { exampleScores } from '@/utils/vaultExamples'
import DataBar from '@/components/ui/DataBar'
import Kicker from '@/components/ui/Kicker'

const PLATFORMS = ['psn', 'steam', 'ra'] as const

/**
 * The example games, finished, as bars on one scale: the same demanding game
 * on each platform, then a one-hour platinum and a 5,000-achievement game.
 * The points come from the real formula. The page is public, so Xbox is in it only for
 * whoever may see Xbox (an admin, while it is admin-only).
 */
export default function RankingsGuideExample({ text }: { text: VaultGuideText['example'] }) {
  const { T, lang } = useLanguage()
  const xbox = useXboxEnabled()
  const score = exampleScores()
  const max = Math.max(...Object.values(score))
  const rows: { label: string; value: number; color: string }[] = [
    ...(xbox ? (['psn', 'steam', 'xbox', 'ra'] as const) : PLATFORMS).map((k) => ({ label: text.platforms[k], value: score[k], color: PLATFORM_COLOR[k] })),
    { label: text.quick, value: score.quick, color: 'rgb(var(--ink) / 0.3)' },
    { label: text.spam, value: score.spam, color: 'rgb(var(--ink) / 0.3)' },
  ]

  return (
    <div className="bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] rounded-pane p-4 flex flex-col gap-3">
      <Kicker size="sm">{text.aaa}</Kicker>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <li key={r.label} className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm ${i === rows.length - 2 ? 'mt-2 pt-3 border-t border-ink/[0.07]' : ''}`}>
            <span className="leading-tight">{r.label}</span>
            <DataBar track share={r.value / max} cut={5} color={r.color} className="h-3" />
            <span className="text-right text-base font-extrabold tabular-nums">
              {r.value.toLocaleString(lang)} <span className="text-[0.6875rem] font-semibold text-text-secondary">{T.rankings.vp}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-secondary">{text.easyNote}</p>
    </div>
  )
}
