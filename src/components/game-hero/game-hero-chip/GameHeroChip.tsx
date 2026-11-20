import type { ReactNode } from 'react'
import Tag, { type TagTone } from '@/components/ui/Tag'

/**
 * A chip of the hero's first row (console, state, missables): the library's 24 px tag, upright like every tag.
 * With `href` it is a link to a place on the page (the missables chip opens their panel).
 */
export default function GameHeroChip({ tone = 'neutral', href, className = '', children }: { tone?: TagTone; href?: string; className?: string; children: ReactNode }) {
  const tag = (
    <Tag size="lg" tone={tone} className={className}>
      {children}
    </Tag>
  )
  if (!href) return tag
  return (
    <a href={href} className="relative tap-target inline-flex rounded-tag focus-ring transition-opacity hover:opacity-80">
      {tag}
    </a>
  )
}
