'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useOptionalMainView } from '@/context/MainViewContext'
import MainPageSkeletonBody from './main-page-skeleton-body/MainPageSkeletonBody'

/**
 * The home page's own layout, empty, while the session is read. Both layouts go
 * in the HTML and `data-home-layout` on <html> shows one (`.home-if-*` in
 * globals.css): the root layout's script sets it before the first frame, so the
 * right one paints even on a full load, when React cannot read the choice yet.
 * Announced once as loading; the shapes themselves are hidden.
 */
export default function MainPageSkeleton() {
  const { T } = useLanguage()
  // Signed out there are no app providers: the landing's skeleton is the plain one.
  const pinned = useOptionalMainView()?.view === 'pinned'

  return (
    <div role="status" aria-busy="true" className="flex flex-col min-h-full">
      <span className="sr-only">{T.loadingPage.title}</span>
      <MainPageSkeletonBody cover={false} pinned={pinned} label={T.loadingPage.title} />
      <MainPageSkeletonBody cover pinned={pinned} label={T.loadingPage.title} />
    </div>
  )
}
