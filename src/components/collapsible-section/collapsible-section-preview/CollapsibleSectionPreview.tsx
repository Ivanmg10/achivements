'use client'

import CollapsibleSectionPreviewCard from '../collapsible-section-preview-card/CollapsibleSectionPreviewCard'
import type { PreviewGame } from '@/utils/sectionPreview'

/**
 * The first games of a folded section, as a teaser. How many, and in how many
 * columns, is decided by the page (usePreviewLayout) so that every section's
 * preview together fills the screen. Placeholders while the list loads.
 */
export default function CollapsibleSectionPreview({
  games,
  loading = false,
  columns = 3,
  count = 3,
}: {
  games: PreviewGame[]
  loading?: boolean
  columns?: number
  count?: number
}) {
  const style = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }

  if (loading) {
    return (
      <div aria-busy="true" className="grid gap-2.5" style={style}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="h-19 rounded-xl bg-bg-card animate-pulse" />
        ))}
      </div>
    )
  }
  if (games.length === 0) return null

  return (
    <ul className="grid gap-2.5" style={style}>
      {games.slice(0, count).map((g, i) => (
        <li key={g.key} className="min-w-0">
          <CollapsibleSectionPreviewCard game={g} eager={i === 0} />
        </li>
      ))}
    </ul>
  )
}
