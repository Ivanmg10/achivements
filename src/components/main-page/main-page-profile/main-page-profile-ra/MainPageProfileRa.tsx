import { RetroAchievementsUserProfile } from "@/types/types";
import Image from "next/image";

export default function MainPageProfileRa({
  user,
}: {
  user: RetroAchievementsUserProfile | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-3 m-2 bg-bg-main rounded-xl w-[95%] p-2">
      <h2 className="text-xl">Retroachivements</h2>

      <div className="break-all flex gap-3">
        {user?.UserPic && (
          <Image
            src={`https://retroachievements.org${user?.UserPic}`}
            alt="UserPic"
            width={100}
            height={100}
          />
        )}
        <div>
          <p className="text-lg">{user?.User}</p>
          <p className="text-lg">{user?.ID}</p>
        </div>
      </div>

      <div>
        <p className="text-xl">{user?.TotalPoints} puntos totales</p>
        <p className="text-xl">
          {user?.TotalSoftcorePoints} puntos totales en softcore
        </p>
        <p className="text-xl">
          {user?.TotalTruePoints} puntos totales verdaderos
        </p>

        <p className="mt-5 mb-5">{user?.ULID}</p>
      </div>
    </div>
  );
}
