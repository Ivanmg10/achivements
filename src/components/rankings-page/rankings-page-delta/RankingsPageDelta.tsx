'use client'

import { IconArrowDown, IconArrowUp } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Tag from '@/components/ui/Tag'

/** Places moved since Monday: up in green, down in red, each said in words too; null is someone new this week. */
export default function RankingsPageDelta({ delta }: { delta: number | null }) {
  const { T } = useLanguage()
  if (delta === null) return <Tag tone="accent">{T.rankings.isNew}</Tag>
  if (delta === 0) return <span aria-label={T.rankings.same}><Tag>—</Tag></span>
  const up = delta > 0
  const Icon = up ? IconArrowUp : IconArrowDown
  return (
    <Tag tone={up ? 'success' : 'danger'} className="tabular-nums">
      <Icon size={12} aria-hidden="true" />
      <span aria-hidden="true">{Math.abs(delta)}</span>
      <span className="sr-only">{(up ? T.rankings.up : T.rankings.down).replace('{n}', String(Math.abs(delta)))}</span>
    </Tag>
  )
}
