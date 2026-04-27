'use client'

import { useGamesProgressionList } from '@/hooks/useGamesProgressionList'

import MainPageProgressionCard from './main-page-progression-card/MainPageProgressionCard'

const GAME_IDS = ['5578', '2762', '20580']

export default function MainPageProgression() {
  const games = useGamesProgressionList(GAME_IDS)

  return (
    <section className="col-start-1 col-end-7 row-start-1 row-end-2 main-content bg-bg-card text-text-main m-3 rounded-xl flex flex-col justify-arround items-center">
      <h1 className="text-3xl w-[98%] m-2 py-2">Tus progresos recientes</h1>

      <div className="flex flex-col justify-start items-center w-full mb-5">
        {games.slice(0, 2).map((game) => (
          <MainPageProgressionCard game={game} key={game.ID} />
        ))}
      </div>
    </section>
  )
}
