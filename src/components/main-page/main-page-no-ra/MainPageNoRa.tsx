'use client'

import Link from 'next/link'
import { IconPlugConnected } from '@tabler/icons-react'
import MainPageGamesList from '../main-page-games/main-page-games-list/MainPageGamesList'
import ConsoleSideList from '../console-side-list/ConsoleSideList'
import { WantToPlayGame, RetroAchievementsGameCompleted } from '@/types/types'

const DUMMY_PLAYING: WantToPlayGame[] = [
  { ID: 1, Title: 'Super Mario 64', GameTitle: 'Super Mario 64', ImageIcon: '', ConsoleID: 2, ConsoleName: 'Nintendo 64', PointsTotal: 400, AchievementsPublished: 80 },
  { ID: 2, Title: 'Pokémon FireRed', GameTitle: 'Pokémon FireRed', ImageIcon: '', ConsoleID: 5, ConsoleName: 'Game Boy Advance', PointsTotal: 500, AchievementsPublished: 100 },
  { ID: 3, Title: 'Crash Bandicoot 2', GameTitle: 'Crash Bandicoot 2', ImageIcon: '', ConsoleID: 12, ConsoleName: 'PS1', PointsTotal: 300, AchievementsPublished: 60 },
]

const DUMMY_WANT: WantToPlayGame[] = [
  { ID: 4, Title: 'Kingdom Hearts', GameTitle: 'Kingdom Hearts', ImageIcon: '', ConsoleID: 21, ConsoleName: 'PS2', PointsTotal: 800, AchievementsPublished: 160 },
  { ID: 5, Title: 'Metroid Fusion', GameTitle: 'Metroid Fusion', ImageIcon: '', ConsoleID: 5, ConsoleName: 'Game Boy Advance', PointsTotal: 250, AchievementsPublished: 50 },
]

const DUMMY_COMPLETED: RetroAchievementsGameCompleted[] = [
  { GameID: 6, Title: 'Spyro the Dragon', GameTitle: 'Spyro the Dragon', ImageIcon: '', ConsoleID: 12, ConsoleName: 'PS1', MaxPossible: 56, NumAwarded: 56, PctWon: '1.0000', HardcoreMode: '1' },
  { GameID: 7, Title: 'Wario Land 4', GameTitle: 'Wario Land 4', ImageIcon: '', ConsoleID: 5, ConsoleName: 'Game Boy Advance', MaxPossible: 40, NumAwarded: 40, PctWon: '1.0000', HardcoreMode: '0' },
]

function DummySection({ title, games, slug }: { title: string; games: (WantToPlayGame | RetroAchievementsGameCompleted)[]; slug: string }) {
  return (
    <section className="main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col overflow-hidden">
      <div className="flex items-center gap-8 w-[95%] self-center mt-2 py-2 shrink-0 overflow-hidden">
        <h1 className="text-3xl shrink-0">{title}</h1>
        <ConsoleSideList slug={slug} />
      </div>
      <div className="flex flex-col items-center w-full overflow-hidden">
        <MainPageGamesList listGames={games} />
      </div>
    </section>
  )
}

export default function MainPageNoRa() {
  return (
    <main className="h-full grid grid-cols-[2fr_1fr] text-text-main relative">
      {/* Left: dummy sections */}
      <div className="grid grid-rows-3 min-h-0">
        <DummySection title="Playing" games={DUMMY_PLAYING} slug="playing" />
        <DummySection title="Want to play" games={DUMMY_WANT} slug="wantToPlay" />
        <DummySection title="Completed" games={DUMMY_COMPLETED} slug="completed" />
      </div>

      {/* Right: dummy profile panel */}
      <div className="m-3 rounded-xl bg-bg-card" />

      {/* Full overlay */}
      <div className="absolute inset-0 bg-bg-main/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
        <IconPlugConnected className="w-12 h-12 text-text-secondary" />
        <p className="text-lg font-semibold text-text-main">Connect your RetroAchievements account</p>
        <p className="text-sm text-text-secondary">Link your RA account to see your games and achievements</p>
        <Link
          href="/user"
          className="mt-2 px-5 py-2 bg-accent text-bg-main font-semibold rounded-xl hover:scale-[1.03] transition-transform duration-200 text-sm"
        >
          Go to settings
        </Link>
      </div>
    </main>
  )
}
