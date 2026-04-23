import {
  RetroAchievementsGameWithAchievements,
  RetroAchievementsUserProfile,
} from "@/types/types";
import Image from "next/image";
import Link from "next/link";

export default function MainPageProfileRa({
  user,
  game,
}: {
  user: RetroAchievementsUserProfile | null | undefined;
  game: RetroAchievementsGameWithAchievements | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
      {user?.User ? (
        <>
          <div className="break-all flex gap-3">
            {user?.UserPic && (
              <Image
                src={`https://retroachievements.org${user?.UserPic}`}
                alt="UserPic"
                width={100}
                height={100}
                className="m-1 rounded-lg"
              />
            )}
            <div>
              <p className="text-2xl">{user?.User}</p>
              <p className="text-md">{user?.ID}</p>
            </div>
          </div>
          <div className="m-1">
            <Link
              className="mb-3 bg-bg-card rounded-lg p-3 flex flex-col gap-3 w-full"
              href={`/gameInfo/${game?.ID}`}
            >
              <p className="text-sm mb-3">{user?.RichPresenceMsg}</p>
              <div className="flex">
                <Image
                  src={`https://retroachievements.org/${game?.ImageIcon}`}
                  alt="GameIcon"
                  width={50}
                  height={50}
                  className="rounded-lg"
                />
                <div className="flex flex-col">
                  <span className="ml-2 text-sm">{game?.Title}</span>
                  <span className="ml-2 text-sm">{game?.ConsoleName}</span>
                  {/* <span className="ml-2 text-sm">{game?.UserCompletion}</span> */}
                </div>
              </div>
            </Link>
            <p className="text-lg">{user?.TotalPoints} puntos totales</p>
            <p className="text-lg">
              {user?.TotalSoftcorePoints} puntos totales en softcore
            </p>
            <p className="text-lg">
              {user?.TotalTruePoints} puntos totales verdaderos
            </p>

            <p className="mt-5 mb-5">{user?.ULID}</p>
          </div>
        </>
      ) : (
        <Link
          href="/user"
          className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
        >
          Iniciar sesion con Retroachivements
        </Link>
      )}
    </div>
  );
}
