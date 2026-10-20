'use client'

import { useLanguage } from '@/context/LanguageContext'

const W = 96
const H = 28
const PAD = 3

/**
 * Someone's last weeks of Vault Points as a small line, oldest on the left, in
 * the theme's colour, the latest week marked. A flat dashed line when they
 * earned nothing in that time. Its name reads the numbers out.
 */
export default function VaultSparkline({ weeks, className = '' }: { weeks: number[]; className?: string }) {
  const { T, lang } = useLanguage()
  const max = Math.max(0, ...weeks)
  const label = T.rankings.trendA11y.replace('{n}', String(weeks.length)).replace('{list}', weeks.map((w) => w.toLocaleString(lang)).join(', '))
  const step = weeks.length > 1 ? (W - PAD * 2) / (weeks.length - 1) : 0
  const points = weeks.map((w, i) => [PAD + i * step, max > 0 ? H - PAD - (w / max) * (H - PAD * 2) : H - PAD] as const)
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = points.at(-1)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className={`overflow-visible ${className}`}>
      {max === 0 ? (
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} className="stroke-ink/20" strokeWidth={1.5} strokeDasharray="3 3" />
      ) : (
        <>
          <polygon points={`${PAD},${H} ${line} ${W - PAD},${H}`} className="fill-progress/10" />
          <polyline points={line} fill="none" className="stroke-progress" strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
          {last && <circle cx={last[0]} cy={last[1]} r={2.5} className="fill-progress" />}
        </>
      )}
    </svg>
  )
}
