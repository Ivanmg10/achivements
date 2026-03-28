import {
  RetroAchievement,
  RetroAchievementsGameWithAchievements,
} from "@/types/types";
import GameInfoAchivement from "../game-info-achivement/GameInfoAchivement";

export default function GameInfoTable({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null;
}) {
  return (
    <section className="bg-bg-main p-5 rounded-xl flex flex-col items-start gap-5 w-[95%] mt-5">
      {gameData && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-text-secondary text-sm border-b border-bg-header">
              <th className="p-2 w-20">Icono</th>
              <th className="p-2">Logro</th>
              <th className="p-2 w-56">Jugadores</th>
              <th className="p-2 w-20">Puntos</th>
              <th className="p-2 w-20">Obtenido</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(gameData.Achievements ?? {})
              .filter((a): a is RetroAchievement => a !== undefined)
              .map((achievement) => (
                <GameInfoAchivement
                  achievement={achievement}
                  key={achievement.ID}
                />
              ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
