'use client'

import CollapsibleSectionPreviewCard from '../collapsible-section-preview-card/CollapsibleSectionPreviewCard'
import { PREVIEW_COUNT, type PreviewGame } from '@/utils/sectionPreview'

/**
 * The first few games of a folded section, as a teaser: a row of small cards
 * (a column on phones), or placeholders while the list loads.
 */
export default function CollapsibleSectionPreview({ games, loading = false }: { games: PreviewGame[]; loading?: boolean }) {
  if (loading) {
    return (
      <div aria-busy="true" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
          <div key={i} className="h-19 rounded-xl bg-bg-card animate-pulse" />
        ))}
      </div>
    )
  }
  if (games.length === 0) return null

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {games.map((g) => (
        <li key={g.key} className="min-w-0">
          <CollapsibleSectionPreviewCard game={g} />
        </li>
      ))}
    </ul>
  )
}
