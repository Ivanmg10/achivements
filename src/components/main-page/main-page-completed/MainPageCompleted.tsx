'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'

import { useGamesCompleted } from '@/hooks/useGamesCompleted'
import { useResizableList } from '@/hooks/useResizableList'

import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'

const MAX_GAMES = 3
const CARD_HEIGHT_PX = 70
const HEADER_PX = 72
const FOOTER_PX = 40

export default function MainPageCompleted() {
  const [tab, setTab] = useState<'normal' | 'hardcore'>('normal')
  const sectionRef = useRef<HTMLElement>(null)
  const { listGames, listGamesHardcore } = useGamesCompleted()
  const visibleCount = useResizableList({ sectionRef, maxItems: MAX_GAMES, cardHeightPx: CARD_HEIGHT_PX, headerPx: HEADER_PX, footerPx: FOOTER_PX })

  const activeList = tab === 'normal' ? listGames : listGamesHardcore

  return (
    <section
      ref={sectionRef}
      className="col-start-4 col-end-7 row-start-2 row-end-3 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col"
    >
      <div className="flex items-center w-[95%] m-2 py-2 gap-3 self-center">
        <h1 className="text-3xl">Completados</h1>
        <div className="flex items-center">
          <button
            className={`text-sm px-3 py-1 cursor-pointer rounded-lg m-1 transition-colors ${tab === 'normal' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
            onClick={() => setTab('normal')}
          >
            Normal
          </button>
          <button
            className={`text-sm px-3 py-1 cursor-pointer rounded-lg m-1 transition-colors ${tab === 'hardcore' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
            onClick={() => setTab('hardcore')}
          >
            Hardcore
          </button>
        </div>
      </div>

      {activeList.length > 0 ? (
        <div className="w-full flex flex-col items-center">
          <MainPageGamesList listGames={activeList.slice(0, visibleCount)} />
        </div>
      ) : (
        <p className="text-gray-400 text-sm w-[95%] px-2">
          No hay juegos completados en modo {tab}
        </p>
      )}

      <Link href="/" className="w-[95%] p-2 mt-auto self-center">
        Ver mas...
      </Link>
    </section>
  )
}
