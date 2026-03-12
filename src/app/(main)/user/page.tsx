"use client";

import { useTheme } from "@/context/ThemeContext";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export default function UserPage() {
  const { setTheme } = useTheme();
  const { data: session } = useSession();
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const updateAvatar = async (url: string) => {
    console.log(url);
  };

  return (
    <main
      className={`min-h-screen bg-bg-main text-text-main flex flex-col justify-center items-center`}
    >
      <section className="flex flex-col justify-center items-center gap-5">
        {session?.user && (
          <div className="flex items-center gap-3">
            <p className="text-xl">{session?.user.name}</p>
            {session?.user?.avatar && (
              <Image
                className="rounded-full w-15 h-15 object-cover"
                src={session?.user?.avatar}
                alt="UserPic"
                width={150}
                height={150}
                unoptimized
              />
            )}
            <div>
              <p className="text-xl">ULID: {session?.user.raid}</p>
              <p className="text-xl">Theme: {session?.user.theme}</p>
            </div>

            <button
              className="bg-bg-header px-2 py-1 m-5 rounded-3xl"
              onClick={() => signOut()}
            >
              <p className="hover:text-white w-full">Cerrar session</p>
            </button>
          </div>
        )}

        <div className="w-full flex flex-col gap-1">
          <p className="text-xl">Cambiar avatar</p>
          <input
            type="text"
            className="bg-bg-deep text-text-main rounded-lg p-2 w-full"
            placeholder="URL del avatar"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
          />
          <button
            className="bg-bg-header text-text-main p-2 rounded-3xl w-full"
            onClick={() => updateAvatar(avatarUrl)}
          >
            <p>Guardar cambios</p>
          </button>
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

        <button className="bg-bg-header text-text-main p-2 rounded-3xl">
          <p>Guardar cambios</p>
        </button>
      </section>
    </main>
  );
}
