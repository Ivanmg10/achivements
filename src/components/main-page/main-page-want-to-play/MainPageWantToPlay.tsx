'use client'

import { WantToPlayGame } from '@/types/types'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'
import Link from 'next/link'

import Spinner from '@/components/main-spinner/Spinner'
import { getWantGames } from '@/utils/apiCallsUtils'

const CARD_HEIGHT_PX = 70
const HEADER_PX = 60
const FOOTER_PX = 40

export default function MainPageWantToPlay() {
  const { status, data: session } = useSession()
  const [wantGames, setWantGames] = useState<Array<WantToPlayGame>>([])
  const [error, setError] = useState<string>()
  const [visibleCount, setVisibleCount] = useState(3)
  const sectionRef = useRef<HTMLElement>(null)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true
      getWantGames(session, setWantGames, setError)
    }
  }, [status])

  useEffect(() => {
    if (!sectionRef.current) return
    const observer = new ResizeObserver(() => {
      const height = sectionRef.current?.clientHeight ?? 0
      const available = height - HEADER_PX - FOOTER_PX
      setVisibleCount(Math.max(1, Math.floor(available / CARD_HEIGHT_PX)))
    })
    observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  if (error) return <p>Error: {error}</p>
  return (
    <section
      ref={sectionRef}
      className="col-start-1 col-end-5 row-start-1 row-end-2 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col items-center"
    >
      {wantGames.length > 0 ? (
        <>
          <div className="flex flex-col items-center justify-start w-full">
            <h1 className="text-3xl w-[95%] m-2 py-2">Quiero jugar</h1>
            <MainPageGamesList listGames={wantGames.slice(0, visibleCount)} />
          </div>
          <Link href="/" className="w-[95%] py-2 m-1 mt-auto">
            Ver mas...
          </Link>
        </>
      ) : (
        <Spinner size={45} />
      )}
    </section>
  )
}
