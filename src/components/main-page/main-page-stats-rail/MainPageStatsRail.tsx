'use client'

import type { ReactNode } from 'react'
import Tabs from '@/components/ui/Tabs'

export type StatsSection = {
  id: string
  label: string
  icon: ReactNode
}

/**
 * The section picker for Stats & Activity: the library's tabs as a rail of
 * icons and labels beside the cards on desktop, running the full height of
 * the sections with its list sticking under the floating bar as the page
 * scrolls; on mobile a horizontal strip that sticks under the bar. The
 * section you are on carries the mark in front, as every tab does.
 */
export default function MainPageStatsRail({
  sections,
  active,
  onChange,
  label,
  idPrefix,
}: {
  sections: StatsSection[]
  active: string
  onChange: (id: string) => void
  /** Accessible name for the tablist. */
  label: string
  /** Shared with the panels, which point back with aria-labelledby. */
  idPrefix: string
}) {
  return (
    <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-bg-main/85 backdrop-blur-xl lg:static lg:z-auto lg:mx-0 lg:p-2 lg:self-stretch lg:bg-bg-card lg:backdrop-blur-none lg:rounded-card">
      <Tabs
        id={idPrefix}
        aria-label={label}
        orientation="rail"
        className="lg:sticky lg:top-20"
        value={active}
        onChange={onChange}
        tabs={sections.map((s) => ({ value: s.id, label: s.label, icon: s.icon }))}
      />
    </div>
  )
}
