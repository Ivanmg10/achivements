import { useState } from 'react'
import GamesPlayedPieChart from '../games-played-pie-chart/GamesPlayedPieChart'
import AchievementsLineChart from '../achivements-line-chart/AchievementsLineChart'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useGamesData } from '@/contexts/GamesDataContext'

export default function UserCharts() {
  const { T } = useLanguage()
  const [chartShown, setChartShown] = useState<'softcore' | 'hardcore'>('softcore')
  const { achievements } = useRecentAchievements()
  const { softcore, hardcore } = useGamesData()

  return (
    <section className="bg-bg-card w-[95%] rounded-3xl pt-3 pb-3 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-5">
      <div className="flex flex-col items-center justify-center md:justify-start md:items-start pl-3">
        <div className="flex items-center gap-1 px-3 pt-3 pb-1">
          <h1 className="text-xl">{T.userCharts.games} {chartShown}</h1>
          <div className="flex items-center">
            <button
              className={`text-sm px-3 py-1 cursor-pointer rounded-lg m-1 transition-colors ${chartShown === 'softcore' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
              onClick={() => setChartShown('softcore')}
            >
              Softcore
            </button>
            <button
              className={`text-sm px-3 py-1 cursor-pointer rounded-lg m-1 transition-colors ${chartShown === 'hardcore' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
              onClick={() => setChartShown('hardcore')}
            >
              Hardcore
            </button>
          </div>
        </div>
        <GamesPlayedPieChart games={chartShown === 'softcore' ? softcore : hardcore} />
      </div>

      <div className="flex flex-col items-start pr-3">
        <h1 className="text-xl px-3 pt-3 pb-1">{T.userCharts.recentAchievements}</h1>
        <AchievementsLineChart achievements={achievements} />
      </div>
    </section>
  )
}
