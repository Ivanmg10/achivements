import { RetroAchievement } from "@/types/types";
import Image from "next/image";

export default function GameInfoAchivement({
  achievement,
}: {
  achievement?: RetroAchievement;
}) {
  const classNameEarned =
    "cursor-pointer hover:bg-bg-card transition-all duration-300";
  const classNameNotEarned = "opacity-40";

  if (achievement)
    // return (

    return (
      <tr
        className={
          achievement?.DateEarned ? classNameEarned : classNameNotEarned
        }
      >
        {/* Icono */}
        <td className="p-2 w-20 align-middle">
          {achievement?.BadgeName && (
            <Image
              src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
              alt="achievement icon"
              width={80}
              height={80}
              className={`w-16 h-16 rounded-xl object-cover shrink-0 ${achievement?.DateEarned ? "" : "grayscale"}`}
            />
          )}
        </td>

        {/* Logro */}
        <td className="p-2">
          <h3 className="text-lg">{achievement?.Title}</h3>
          <p className="text-sm text-text-secondary">
            {achievement?.Description}
          </p>
        </td>

        {/* Jugadores */}
        <td className="p-2 text-sm text-text-secondary w-56">
          <p>{achievement.NumAwarded} jugadores</p>
          <p>{achievement.NumAwardedHardcore} en hardcore</p>
        </td>

        {/* Puntos */}
        <td className="p-2 text-xs text-text-secondary w-20">
          {achievement.Points} pts
        </td>

        {/* Obtenido */}
        <td className="p-2 text-xs text-text-secondary text-center w-20">
          {achievement.DateEarned
            ? new Date(achievement.DateEarned).toLocaleDateString()
            : "-"}
        </td>
      </tr>
    );
}
