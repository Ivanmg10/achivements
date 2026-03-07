"use client";

import { useTheme } from "@/context/ThemeContext";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function UserPage() {
  const { setTheme } = useTheme();
  const { data: session } = useSession();

  return (
    <main
      className={`min-h-screen bg-bg-main text-text-main flex flex-col justify-center items-center`}
    >
      <section className="flex justify-center items-center gap-5">
        <p className="text-xl">{session?.user.name}</p>
        <Image
          className="rounded-full w-15 h-15"
          objectFit="fit"
          src={session?.user.avatar}
          alt="UserPic"
          width={150}
          height={150}
        />
        <div>
          <p className="text-xl">ULID: {session?.user.raid}</p>
          <p className="text-xl">Theme: {session?.user.theme}</p>
        </div>
      </section>

      <section className="p-5 flex flex-row gap-5 items-center">
        <h1>Color</h1>
        <button
          onClick={() => setTheme("red")}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Rojo
        </button>
        <button
          onClick={() => setTheme("blue")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Azul
        </button>
        <button
          onClick={() => setTheme("yellow")}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
        >
          Amarillo
        </button>
        <button
          onClick={() => setTheme("green")}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Verde
        </button>
        <button
          onClick={() => setTheme("dark")}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Negro
        </button>
      </section>
      <section>
        <button className="bg-bg-header text-text-main p-2 rounded-3xl w-100">
          <p>Guardar cambios</p>
        </button>
      </section>
    </main>
  );
}
