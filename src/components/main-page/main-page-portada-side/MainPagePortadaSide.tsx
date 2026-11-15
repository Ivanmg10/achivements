'use client'

import MainPagePortadaSideLevel from './main-page-portada-side-level/MainPagePortadaSideLevel'
import MainPagePortadaSideStreak from './main-page-portada-side-streak/MainPagePortadaSideStreak'
import MainPagePortadaSideRecent from './main-page-portada-side-recent/MainPagePortadaSideRecent'

/**
 * The column beside the recent games in the "cover" layout, in place of the
 * platform profiles: your level, your streak and your last achievements on
 * every platform. The profiles stay a click away, on your account.
 */
export default function MainPagePortadaSide() {
  return (
    <div className="m-3 flex flex-col gap-4 flex-1 min-h-0 enter-cards">
      <MainPagePortadaSideLevel />
      <MainPagePortadaSideStreak />
      <MainPagePortadaSideRecent />
    </div>
  )
}
