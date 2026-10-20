'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { IconPlus } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useOwnShowcase } from '@/context/ShowcaseContext'
import { SHOWCASE_MAX, showcaseKey } from '@/utils/showcase'
import { SectionFallback } from '@/components/ui/SectionFallback'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import ShowcaseTile from '@/components/showcase-tile/ShowcaseTile'
import MainPagePinnedSectionSortable from '../main-page-pinned-section-sortable/MainPagePinnedSectionSortable'

// Downloaded the first time it is opened, not with the page.
const ShowcasePickerModal = dynamic(() => import('@/components/showcase-picker-modal/ShowcasePickerModal'), { loading: () => null })

const SLOT = 'w-[calc(50%-0.375rem)] sm:w-40 min-h-44'

/**
 * The achievement showcase, at the top of the Pinned section: up to five
 * earned achievements the user shows off on their profile and to whoever
 * follows them. Drag a tile's grip to reorder it, its cross to take it out;
 * an empty slot opens the picker of the year's achievements.
 */
export default function MainPagePinnedSectionShowcase() {
  const { T } = useLanguage()
  const showcase = useOwnShowcase()
  const [pickerOpen, setPickerOpen] = useState(false)
  if (!showcase) return null
  const { items, isLoading, error, retry, remove, reorder } = showcase
  const free = Math.max(0, SHOWCASE_MAX - items.length)

  return (
    <section aria-labelledby="showcase-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <h3 id="showcase-title" className="text-xl font-bold">{T.showcase.title}</h3>
          <p className="text-xs text-text-secondary">{T.showcase.hint}</p>
        </div>
        {!isLoading && !error && <span className="text-xs text-text-secondary tabular-nums">{T.showcase.count.replace('{n}', String(items.length))}</span>}
      </div>

      {isLoading ? (
        <div aria-busy="true" className="flex flex-wrap gap-3">
          {Array.from({ length: SHOWCASE_MAX }, (_, i) => (
            <div key={i} className={`${SLOT} rounded-xl bg-bg-main animate-pulse motion-reduce:animate-none`} />
          ))}
        </div>
      ) : error ? (
        <SectionFallback error onRefresh={retry}>
          <p className="text-sm text-center py-6">{T.showcase.loadError}</p>
        </SectionFallback>
      ) : (
        <div className="flex flex-wrap gap-3">
          {items.length > 0 && (
            <MainPagePinnedSectionSortable
              items={items}
              idOf={showcaseKey}
              labelOf={(i) => i.title}
              onReorder={reorder}
              className="contents"
              renderItem={(item, handle) => (
                <div className={SLOT}>
                  <ShowcaseTile item={item} handle={handle} onRemove={() => remove(item)} />
                </div>
              )}
            />
          )}
          {Array.from({ length: free }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPickerOpen(true)}
              className={`${SLOT} rounded-xl border-2 border-dashed border-ink/15 text-text-secondary hover:text-accent hover:border-accent/50 flex flex-col items-center justify-center gap-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
            >
              <IconPlus size={22} aria-hidden="true" />
              {T.showcase.addSlot}
            </button>
          ))}
        </div>
      )}

      <LazyWhenOpened open={pickerOpen}>
        <ShowcasePickerModal isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
      </LazyWhenOpened>
    </section>
  )
}
