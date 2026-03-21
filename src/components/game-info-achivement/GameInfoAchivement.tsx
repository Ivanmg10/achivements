import { RetroAchievement } from "@/types/types";
import Image from "next/image";

export default function GameInfoAchivement({
  achievement,
}: {
  achievement?: RetroAchievement;
}) {
  const classNameEarned =
    "bg-bg-header p-3 rounded-xl flex flex-row items-start gap-2 w-full cursor-pointer hover:bg-bg-header/80 transition-all duration-300";

  const classNameNotEarned =
    "bg-bg-header/30 p-3 rounded-xl flex flex-row items-start gap-2 w-full";

  return (
    <div
      key={achievement?.ID}
      className={achievement?.DateEarned ? classNameEarned : classNameNotEarned}
    >
      {achievement?.BadgeName && (
        <Image
          src={`https://media.retroachievements.org/Badge/${achievement.BadgeName}.png`}
          alt="achievement icon"
          width={100}
          height={100}
          className={`w-20 h-20 rounded-xl ${achievement?.DateEarned ? "" : "grayscale"}`}
        />
      )}
      <div className="flex flex-col">
        <h3 className="text-lg">{achievement?.Title}</h3>
        <p className="text-sm">{achievement?.Description}</p>
      </div>
    </div>
  );
}
