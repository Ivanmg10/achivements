'use client'

import Link from 'next/link'
import { useRef } from 'react'

import { useGamesInProgressPreview } from '@/hooks/useGamesInProgressPreview'
import { useResizableList } from '@/hooks/useResizableList'

import MainPageGamesList from './main-page-games-list/MainPageGamesList'

const MAX_GAMES = 3
const CARD_HEIGHT_PX = 70
const HEADER_PX = 60
const FOOTER_PX = 40

export default function MainPageGames() {
  const sectionRef = useRef<HTMLElement>(null)
  const listGames = useGamesInProgressPreview()
  const visibleCount = useResizableList({ sectionRef, maxItems: MAX_GAMES, cardHeightPx: CARD_HEIGHT_PX, headerPx: HEADER_PX, footerPx: FOOTER_PX })

  return (
    <section
      ref={sectionRef}
      className="col-start-1 col-end-4 row-start-2 row-end-3 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col items-center"
    >
      <div className="w-full flex flex-col items-center">
        <h1 className="text-3xl w-[95%] m-2 py-2">Estoy jugando</h1>
        {listGames.length > 0 ? (
          <MainPageGamesList listGames={listGames.slice(0, visibleCount)} />
        ) : (
          <p className="text-gray-400 text-sm w-[95%] px-2">No hay juegos en progreso</p>
        )}
      </div>
      <Link href="/" className="w-[95%] py-2 m-1 mt-auto">
        Ver mas...
      </Link>
    </section>
  )
}
