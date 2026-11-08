import type { ReactNode } from 'react'
import Tag, { type TagTone } from '@/components/ui/Tag'

/** A chip of the hero's first row (console, state, missables): the library's 24 px slanted tag. */
export default function GameHeroChip({ tone = 'neutral', className = '', children }: { tone?: TagTone; className?: string; children: ReactNode }) {
  return (
    <Tag slant size="lg" tone={tone} className={className}>
      {children}
    </Tag>
  )
}
