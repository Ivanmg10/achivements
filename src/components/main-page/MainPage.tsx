'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import Spinner from '../main-spinner/Spinner'
import MainPageCompleted from './main-page-completed/MainPageCompleted'
import MainPageGames from './main-page-games/MainPageGames'
import MainPageProfile from './main-page-profile/MainPageProfile'
import MainPageProgression from './main-page-progression/MainPageProgression'
import MainPageWantToPlay from './main-page-want-to-play/MainPageWantToPlay'
import MainPageNoRa from './main-page-no-ra/MainPageNoRa'
import MainPageCharts from './main-page-charts/MainPageCharts'

export default function MainPage() {
  const { status, data: session } = useSession()
  const router = useRouter()
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/authPage')
    }
  }, [status])

  if (status === 'loading')
    return (
      <main className="h-lvh flex justify-center items-center text-text-main">
        <Spinner size={45} />
      </main>
    )

  if (status === 'authenticated' && !session?.user?.raUser)
    return <MainPageNoRa />

  return (
    <main className="flex flex-col min-h-full text-text-main">
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        {/* Profile first in DOM → top on mobile; placed col-2 on desktop */}
        <div className="lg:col-start-2 lg:row-start-1">
          <MainPageProfile />
        </div>
        {/* Games below profile on mobile; placed col-1 on desktop */}
        <div className="flex flex-col lg:grid lg:grid-rows-3 min-h-0 lg:col-start-1 lg:row-start-1">
          <MainPageGames />
          <MainPageWantToPlay />
          <MainPageCompleted />
        </div>
      </div>

      <MainPageCharts />
    </main>
  )
}
