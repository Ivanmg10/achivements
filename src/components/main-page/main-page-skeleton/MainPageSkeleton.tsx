'use client'

import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { useOptionalMainView } from '@/context/MainViewContext'
import { canUseXbox } from '@/utils/xboxAccess'
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
  const { data: session } = useSession()
  const user = session?.user
  const linked = [user?.raLinked, user?.steamid, user?.psnaccountid, user?.xboxxuid && canUseXbox(user.admin)].filter(Boolean).length

  return (
    <div role="status" aria-busy="true" className="flex flex-col min-h-full">
      <span className="sr-only">{T.loadingPage.title}</span>
      <MainPageSkeletonBody cover={false} pinned={pinned} tabs={linked > 1} label={T.loadingPage.title} />
      <MainPageSkeletonBody cover pinned={pinned} tabs={linked > 1} label={T.loadingPage.title} />
    </div>
  )
}
