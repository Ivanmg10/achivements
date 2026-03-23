"use client";

import { RetroAchievementsUserProfile } from "@/types/types";
import { getUserInfo } from "@/utils/apiCallsUtils";
import { Session } from "next-auth";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function UserData({ session }: { session: Session | null }) {
  const [raUser, setRaUser] = useState<RetroAchievementsUserProfile | null>(
    null,
  );

  useEffect(() => {
    if (session) getUserInfo(setRaUser, session);
  }, [session]);

  console.log(raUser);

  return (
    <section className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5 pt-3 pb-3 w-[95%]">
      <article className="flex flex-row justify-center items-center gap-5 bg-bg-card rounded-3xl">
        {session?.user && (
          <>
            {session?.user?.avatar && (
              <Image
                className="rounded-full w-35 h-35 object-cover mr-5"
                src={session?.user?.avatar}
                alt="UserPic"
                width={150}
                height={150}
                unoptimized
              />
            )}
            <div>
              <p className="text-2xl mb-5">Bienvenido: {session?.user.name}</p>
              <p className="text-lg">Email: {session?.user.email}</p>
              <p className="text-lg">Tema: {session?.user.theme}</p>
            </div>
          </>
        )}
      </article>

      <article className="flex flex-row justify-center items-center gap-5 bg-bg-card rounded-3xl p-5 ">
        {raUser?.User ? (
          <>
            {raUser?.UserPic && (
              <Image
                className="rounded-full w-35 h-35 object-cover mr-5"
                src={`https://retroachievements.org${raUser?.UserPic}`}
                alt="UserPic"
                width={150}
                height={150}
                unoptimized
              />
            )}
            <div>
              <p className="text-2xl mb-5">{raUser?.User}</p>
              <p className="text-lg">ULID: {raUser?.ULID}</p>
              <p className="text-lg">Puntos totales: {raUser?.TotalPoints}</p>
              <p className="text-lg">
                Puntos totales softcore: {raUser?.TotalSoftcorePoints}
              </p>
            </div>
          </>
        ) : (
          <button className="w-full text-center bg-bg-main p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500">
            Iniciar sesion en Retroachivements
          </button>
        )}
      </article>

      <article className="flex flex-col justify-center items-center gap-5 bg-bg-card rounded-3xl p-5 ">
        <button className="w-full text-center bg-bg-main p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500">
          Iniciar sesion en Steam
        </button>
      </article>
    </section>
  );
}
