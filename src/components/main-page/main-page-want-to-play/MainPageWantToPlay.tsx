'use client'

import Link from 'next/link'
import { useRef } from 'react'

import { useResizableList } from '@/hooks/useResizableList'
import { useWantGamesPreview } from '@/hooks/useWantGamesPreview'
import { useLanguage } from '@/context/LanguageContext'

import Spinner from '@/components/main-spinner/Spinner'
import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'

const CARD_HEIGHT_PX = 70
const HEADER_PX = 60
const FOOTER_PX = 40

export default function MainPageWantToPlay() {
  const sectionRef = useRef<HTMLElement>(null)
  const { wantGames, error } = useWantGamesPreview()
  const visibleCount = useResizableList({ sectionRef, cardHeightPx: CARD_HEIGHT_PX, headerPx: HEADER_PX, footerPx: FOOTER_PX })
  const { T } = useLanguage()

  if (error) return <p>Error: {error}</p>
  return (
    <section
      ref={sectionRef}
      className="col-start-1 col-end-5 row-start-1 row-end-2 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col items-center"
    >
      {wantGames.length > 0 ? (
        <>
          <div className="flex flex-col items-center justify-start w-full">
            <h1 className="text-3xl w-[95%] m-2 py-2">{T.mainPage.wantToPlay}</h1>
            <MainPageGamesList listGames={wantGames.slice(0, visibleCount)} />
          </div>
          <Link href="/" className="w-[95%] py-2 m-1 mt-auto">
            {T.mainPage.seeMore}
          </Link>
        </>
      ) : (
        <Spinner size={45} />
      )}
    </section>
  )
}
