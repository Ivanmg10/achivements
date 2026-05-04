'use client'

import { useRef, useState } from 'react'

import { useGamesCompletedPreview } from '@/hooks/useGamesCompletedPreview'
import { useResizableList } from '@/hooks/useResizableList'
import { useLanguage } from '@/context/LanguageContext'

import Link from 'next/link'
import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'
import EmptyState from '@/components/empty-state/EmptyState'

const MAX_GAMES = 2
const CARD_HEIGHT_PX = 70
const HEADER_PX = 64
const FOOTER_PX = 0

export default function MainPageCompleted() {
  const [tab, setTab] = useState<'normal' | 'hardcore'>('normal')
  const sectionRef = useRef<HTMLElement>(null)
  const { listGames, listGamesHardcore } = useGamesCompletedPreview()
  const visibleCount = useResizableList({ sectionRef, maxItems: MAX_GAMES, cardHeightPx: CARD_HEIGHT_PX, headerPx: HEADER_PX, footerPx: FOOTER_PX })
  const { T } = useLanguage()

  const activeList = tab === 'normal' ? listGames : listGamesHardcore

  return (
    <section
      ref={sectionRef}
      className="main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between gap-2 w-[95%] self-center mt-2 pt-2 pb-3 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/completed" className="text-3xl shrink-0 hover:underline underline-offset-2 decoration-white/40">{T.mainPage.completed}</Link>
          <div className="flex items-center">
            <button
              className={`text-sm px-3 py-1 cursor-pointer rounded-lg m-1 transition-colors ${tab === 'normal' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
              onClick={() => setTab('normal')}
            >
              {T.mainPage.normal}
            </button>
            <button
              className={`text-sm px-3 py-1 cursor-pointer rounded-lg m-1 transition-colors ${tab === 'hardcore' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
              onClick={() => setTab('hardcore')}
            >
              {T.mainPage.hardcore}
            </button>
          </div>
        </div>
        <ConsoleSideList slug="completed" />
      </div>

      <div className="flex flex-col items-center w-full flex-1 overflow-hidden">
        {activeList.length > 0 ? (
          <MainPageGamesList listGames={activeList.slice(0, visibleCount)} />
        ) : (
          <EmptyState
            icon={tab === 'hardcore' ? '💀' : '🏆'}
            title={T.mainPage.noGamesCompleted.replace('{tab}', tab)}
            subtitle={T.mainPage.noGamesCompletedSub}
            className="py-8"
          />
        )}
      </div>
    </section>
  )
}
