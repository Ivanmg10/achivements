import { Game } from "@retroachievements/api";
import Image from "next/image";

export default function MainPageGamesList({
  listGames,
}: {
  listGames: Array<Game | undefined>;
}) {
  return listGames.map((game: Game | undefined, index: number) => (
    <div
      key={index}
      className="flex flex-row gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-1 hover:bg-bg-header transition-all duration-300 hover:border-bg-main border-2 border-bg-main cursor-pointer"
    >
      <Image
        src={"https://retroachievements.org/" + game?.ImageIcon}
        alt="imagen"
        width={50}
        height={50}
        className="w-15 h-15 rounded-bl-xl rounded-tl-xl"
      />
      <div>
        <p className="text-xl">{game?.GameTitle}</p>
        <p className="text-lg">{game?.ConsoleName}</p>
      </div>
    </div>
  ));
}
