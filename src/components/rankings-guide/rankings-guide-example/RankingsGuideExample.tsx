'use client'

import { useLanguage } from '@/context/LanguageContext'
import type { VaultGuideText } from '@/translations/vaultGuide'
import { PLATFORM_FILL } from '@/components/vault-platform-split/VaultPlatformSplit'
import { exampleScores } from '@/utils/vaultExamples'

const SLANT = { clipPath: 'polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%)' }

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
    <div className="bg-bg-main/60 ring-1 ring-inset ring-ink/[0.06] rounded-[0.875rem] p-4 flex flex-col gap-3">
      <p className="text-[0.6875rem] uppercase tracking-[0.08em] font-bold text-text-secondary">{text.aaa}</p>
      <ul className="flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <li key={r.label} className={`grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm ${i === 4 ? 'mt-2 pt-3 border-t border-ink/[0.07]' : ''}`}>
            <span className="leading-tight">{r.label}</span>
            <span aria-hidden="true" className="h-3 bg-ink/[0.08]" style={SLANT}>
              <span className={`block h-full ${r.fill}`} style={{ ...SLANT, width: `${(r.value / max) * 100}%` }} />
            </span>
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
