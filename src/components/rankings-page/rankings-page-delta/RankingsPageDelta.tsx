'use client'

import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** Places moved since Monday: up in green, down in red, each said in words too; null is someone new this week. */
export default function RankingsPageDelta({ delta }: { delta: number | null }) {
  const { T } = useLanguage()
  if (delta === null) return <span className="text-[11px] font-semibold text-accent">{T.rankings.isNew}</span>
  if (delta === 0) return <span className="text-xs text-text-secondary" aria-label={T.rankings.same}>—</span>
  const up = delta > 0
  const Icon = up ? IconArrowUp : IconArrowDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold tabular-nums ${up ? 'text-success' : 'text-danger'}`}>
      <Icon size={12} aria-hidden="true" />
      <span aria-hidden="true">{Math.abs(delta)}</span>
      <span className="sr-only">{(up ? T.rankings.up : T.rankings.down).replace('{n}', String(Math.abs(delta)))}</span>
    </span>
  )
}
