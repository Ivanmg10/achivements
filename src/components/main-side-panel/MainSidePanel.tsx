"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function MainSidePanel() {
  const { data: session } = useSession();

  console.log(session);

  return (
    <aside className="bg-bg-card m-2 rounded-lg flex flex-col items-center">
      <section className="flex flex-col items-center">
        <div className="flex p-5 gap-3 justify-between items-start">
          <h1 className="text-xl">Bienvenido {session?.user?.raUser?.User}</h1>
          {session?.user?.raUser?.UserPic && (
            <Image
              src={`https://retroachievements.org${session?.user?.raUser?.UserPic}`}
              alt="user"
              width={100}
              height={100}
              className="w-1/3 rounded-full"
            />
          )}
        </div>
        <Link
          href="/user"
          className="w-[90%] text-center bg-bg-main px-2 py-2 rounded-3xl hover:duration-200 hover:bg-bg-card border-bg-card border-2 hover:border-bg-main transition duration-200"
        >
          Ajustes de usuario
        </Link>
      </section>
      <hr className="border-b-2 border-white w-[95%] m-5" />
      <ul className="pl-5 w-full flex flex-col gap-3">
        <li className="text-lg">Quier@ jugar</li>
        <li className="text-lg">Est@y jugando</li>
        <li className="text-lg">He completado</li>
      </ul>
    </aside>
  );
}
