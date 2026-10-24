'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { VaultGuideText } from '@/translations/vaultGuide'
import { PLATFORM_FILL } from '@/components/vault-platform-split/VaultPlatformSplit'
import { exampleScores } from '@/utils/vaultExamples'

/**
 * The example games, finished, as bars on one scale: the same demanding game
 * on each platform, then a one-hour platinum and a 5,000-achievement game.
 * The points come from the real formula.
 */
export default function RankingsGuideExample({ text }: { text: VaultGuideText['example'] }) {
  const { T, lang } = useLanguage()
  const score = exampleScores()
  const max = Math.max(...Object.values(score))
  const rows: { label: string; value: number; fill: string }[] = [
    ...(['psn', 'steam', 'xbox', 'ra'] as const).map((k) => ({ label: text.platforms[k], value: score[k], fill: PLATFORM_FILL[k] })),
    { label: text.quick, value: score.quick, fill: 'bg-ink/30' },
    { label: text.spam, value: score.spam, fill: 'bg-ink/30' },
  ]

  return (
    <div className="bg-bg-card rounded-card p-4 flex flex-col gap-3">
      <p className="text-xs uppercase tracking-wider font-bold text-text-secondary">{text.aaa}</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <li key={r.label} className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm ${i === 4 ? 'mt-2 pt-3 border-t border-ink/[0.07]' : ''}`}>
            <span className="leading-tight">{r.label}</span>
            <span aria-hidden="true" className="h-2.5 rounded-full bg-ink/10 overflow-hidden">
              <span className={`block h-full rounded-full ${r.fill}`} style={{ width: `${(r.value / max) * 100}%` }} />
            </span>
            <span className="text-right font-bold tabular-nums">
              {r.value.toLocaleString(lang)} <span className="text-[10px] font-semibold text-text-secondary">{T.rankings.vp}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-text-secondary">{text.easyNote}</p>
    </div>
  )
}
