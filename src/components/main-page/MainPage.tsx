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

export default function MainPage() {
  const { status } = useSession()
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

  return (
    <main className="h-full grid grid-cols-[2fr_1fr] text-text-main">
      {/* Left: 3 equal rows - game sections */}
      <div className="grid grid-rows-3 min-h-0">
        <MainPageGames />
        <MainPageWantToPlay />
        <MainPageCompleted />
      </div>

      {/* Right: user profile */}
      <MainPageProfile />

      {/* Future: charts section below
      <section className="col-start-1 col-end-3 row-start-2">
        Charts coming soon
      </section>
      */}
    </main>
  )
}
