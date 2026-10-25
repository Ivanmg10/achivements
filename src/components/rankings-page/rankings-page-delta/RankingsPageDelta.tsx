'use client'

import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** The design's 22 px tag. */
const TAG = 'inline-flex items-center gap-0.5 h-[1.375rem] px-2 rounded-[0.375rem] text-xs font-bold'

/** Places moved since Monday: up in green, down in red, each said in words too; null is someone new this week. */
export default function RankingsPageDelta({ delta }: { delta: number | null }) {
  const { T } = useLanguage()
  if (delta === null) return <span className={`${TAG} bg-accent/[0.14] text-accent`}>{T.rankings.isNew}</span>
  if (delta === 0) return <span className={`${TAG} bg-ink/[0.06] text-text-secondary`} aria-label={T.rankings.same}>—</span>
  const up = delta > 0
  const Icon = up ? IconArrowUp : IconArrowDown
  return (
    <span className={`${TAG} tabular-nums ${up ? 'bg-success/[0.12] text-success' : 'bg-danger/[0.12] text-danger'}`}>
      <Icon size={12} aria-hidden="true" />
      <span aria-hidden="true">{Math.abs(delta)}</span>
      <span className="sr-only">{(up ? T.rankings.up : T.rankings.down).replace('{n}', String(Math.abs(delta)))}</span>
    </span>
  )
}
