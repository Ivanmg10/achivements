'use client'

import { IconTrophy } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useSubject } from '@/context/SubjectContext'
import { useShowcase } from '@/hooks/useShowcase'
import { SHOWCASE_MAX, showcaseKey } from '@/utils/showcase'
import { SectionFallback } from '@/components/ui/SectionFallback'
import EmptyState from '@/components/empty-state/EmptyState'
import ShowcaseTile from '@/components/showcase-tile/ShowcaseTile'
import { Skeleton } from '@/components/ui/Skeleton'

const GRID = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'

/**
 * Someone's achievement showcase on their public profile: the earned
 * achievements they chose to show, in their order, each opening their
 * progress in its game. Their pinned goals are theirs and are not shown.
 */
export default function PublicUserAchievementShowcase() {
  const { T } = useLanguage()
  const subject = useSubject()
  const { items, isLoading, error, retry } = useShowcase()

  return (
    <section aria-labelledby="public-showcase-title" className="flex flex-col gap-3">
      <h3 id="public-showcase-title" className="flex items-center gap-2 text-base font-semibold">
        <IconTrophy size={18} className="text-accent" aria-hidden="true" />
        {T.showcase.title}
      </h3>
      {isLoading ? (
        <div aria-busy="true" className={GRID}>
          {Array.from({ length: SHOWCASE_MAX }, (_, i) => (
            <Skeleton key={i} radius="tile" className="min-h-44" />
          ))}
        </div>
      ) : error ? (
        <SectionFallback error onRefresh={retry}>
          <p className="text-sm text-center py-6">{T.showcase.loadError}</p>
        </SectionFallback>
      ) : items.length === 0 ? (
        <EmptyState icon={<IconTrophy className="w-6 h-6" />} title={T.showcase.emptyPublic} size="compact" className="py-6" />
      ) : (
        <ul className={GRID}>
          {items.map((item) => (
            <li key={showcaseKey(item)}>
              <ShowcaseTile item={item} subject={subject} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
