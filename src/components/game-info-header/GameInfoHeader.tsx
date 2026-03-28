import { RetroAchievementsGameWithAchievements } from "@/types/types";
import Image from "next/image";
import GameInfoProgressionHeader from "./game-info-header-progression/GameInfoProgressionHeader";

export default function GameInfoHeader({
  gameData,
}: {
  gameData?: RetroAchievementsGameWithAchievements | null;
}) {
  console.log(gameData);
  return (
    <section className="bg-bg-main p-5 rounded-xl min-w-[95%] grid grid-cols-[1fr_200px]">
      <div className="flex flex-row items-start gap-5">
        {gameData?.ImageIcon && (
          <Image
            src={`https://retroachievements.org${gameData?.ImageBoxArt}`}
            alt="game icon"
            width={150}
            height={150}
            className="w-50  rounded-xl"
          />
        )}
        <div className="flex flex-col w-1/2 gap-3">
          <h1 className="text-3xl">{gameData?.Title}</h1>
          <p className="text-lg">{gameData?.ConsoleName}</p>
          <GameInfoProgressionHeader gameData={gameData} />
          <ul>
            <li className="text-lg">
              {"Retroachivements ID: " + gameData?.ID}
            </li>
            <li className="text-md">{gameData?.Publisher}</li>
            <li className="text-md">{gameData?.Developer}</li>
            <li className="text-md">{gameData?.Genre}</li>
            <li className="text-md">{gameData?.Released}</li>
          </ul>
        </div>
      </div>
      <div>
        <p
          className={`text-2xl ${gameData?.NumAwardedToUser == gameData?.NumAchievements ? "bg-green-800" : "bg-bg-card"}  p-3 rounded-full text-center`}
        >
          {gameData?.NumAwardedToUser} / {gameData?.NumAchievements}
        </p>
      </div>
    </section>
  );
}
