'use client'

import { useState } from 'react'
import { useGroups } from '@/hooks/useGroups'
import { ChartCard } from '@/components/ui/ChartCard'
import MainPageGroups from '@/components/main-page/main-page-charts/MainPageGroups'
import MainPageGroupFeature from '@/components/main-page/main-page-group-feature/MainPageGroupFeature'

/**
 * The Groups section: one group shown in full on the left, its games as a
 * list, and every group on the right to switch which one that is (and to
 * create or delete them). It opens on the first group, in the user's order.
 */
export default function MainPageGroupsSection() {
  const { groups } = useGroups()
  const [picked, setPicked] = useState<number | null>(null)
  // The pick only counts while that group still exists (it may have just been deleted).
  const featured = groups.find((g) => g.id === picked) ?? groups[0] ?? null

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      {featured && (
        <ChartCard className="xl:col-span-2">
          <MainPageGroupFeature key={featured.id} group={featured} />
        </ChartCard>
      )}
      <ChartCard className={featured ? '' : 'xl:col-span-3'}>
        <MainPageGroups selectedId={featured?.id ?? null} onSelect={setPicked} />
      </ChartCard>
    </div>
  )
}
