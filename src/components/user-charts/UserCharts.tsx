import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import GamesPlayedPieChart from "../games-played-pie-chart/GamesPlayedPieChart";
import {
  getAllGamesPlayed,
  getRecentAchievements,
} from "@/utils/apiCallsUtils";
import {
  RecentAchievement,
  RetroAchievementsGameCompleted,
} from "@/types/types";
import AchievementsLineChart from "../achivements-line-chart/AchievementsLineChart";

export default function UserCharts() {
  const { data: session, status } = useSession();
  const [chartShown, setChartShown] = useState("softcore");

  const [softcoreGames, setSoftcoreGames] = useState(
    Array<RetroAchievementsGameCompleted>,
  );
  const [hardcoreGames, setHardcoreGames] = useState(
    Array<RetroAchievementsGameCompleted>,
  );

  const [recentAchievements, setRecentAchievements] = useState(
    Array<RecentAchievement>,
  );

  const toggleChart = (chart: string) => {
    setChartShown(chart);
  };

  useEffect(() => {
    if (status == "authenticated") {
      getAllGamesPlayed(session, setSoftcoreGames, setHardcoreGames);
      getRecentAchievements(session, setRecentAchievements);
    }
  }, [session, status]);

  console.log(recentAchievements);

  return (
    <section className="bg-bg-card w-[95%] rounded-3xl pt-3 pb-3 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-5">
      <div className="flex flex-col items-center justify-center md:justify-start md:items-start pl-3">
        <div className="flex">
          <h1 className="text-xl p-4">Juegos {chartShown}</h1>
          <div className="flex items-center justify-center">
            <button
              className="text-sm px-4 py-2 cursor-pointer bg-bg-main text-white rounded-lg m-1"
              onClick={() => toggleChart("softcore")}
            >
              Softcore
            </button>
            <button
              className="text-sm px-4 py-2 cursor-pointer bg-bg-main text-white rounded-lg m-1"
              onClick={() => toggleChart("hardcore")}
            >
              Hardcore
            </button>
          </div>
        </div>
        <GamesPlayedPieChart
          games={chartShown == "softcore" ? softcoreGames : hardcoreGames}
        />
      </div>

      <div className="flex flex-col justify-between items-start pr-3">
        <h1 className="text-xl p-4">Logros recientes</h1>

        <AchievementsLineChart achievements={recentAchievements} />
      </div>
    </section>
  );
}
