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
      className={`min-h-screen bg-bg-main text-text-main flex flex-col justify-start items-center`}
    >
      {/* DATOS DE USUARIO */}
      <section className="flex flex-col justify-center items-center gap-5 bg-bg-header rounded-3xl w-[95%] p-5 m-3">
        {session?.user && (
          <div className="flex items-center gap-3">
            <p className="text-3xl pr-8">{session?.user.name}</p>
            {session?.user?.avatar && (
              <Image
                className="rounded-full w-35 h-35 object-cover"
                src={session?.user?.avatar}
                alt="UserPic"
                width={150}
                height={150}
                unoptimized
              />
            )}
            <div>
              <p className="text-xl">
                Nombre retroachievements: {session?.user.rausername}
              </p>
              <p className="text-xl">ULID: {session?.user.raid}</p>
              <p className="text-lg">Email: {session?.user.email}</p>
              <p className="text-lg">Theme: {session?.user.theme}</p>
            </div>

            <button
              className="bg-bg-header px-2 py-1 m-5 rounded-3xl"
              onClick={() => signOut()}
            >
              <p className="hover:transition hover:duration-500 hover:transform hover:scale-105 transition duration-500 w-full bg-bg-main p-3 rounded-3xl">
                Cerrar session
              </p>
            </button>
          </div>
        )}
      </section>
      {/* CONFIGURACIÓN DE TEMA */}
      <section className="p-5 flex flex-row gap-5 items-center justify-center bg-bg-header rounded-3xl w-[95%] p-5 m-3">
        <h1>Background Color</h1>
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
      {/* CONFIGURACIÓN DE CUENTA */}
      <section className="p-5 flex flex-row gap-5 items-start justify-between bg-bg-header rounded-3xl w-[95%] p-5 m-3 flex-1 min-h-0 overflow-auto">
        <aside className="w-1/2 bg-bg-main p-5 rounded-3xl">
          <h2 className="text-2xl mb-4">Configuración de cuenta</h2>
          <ul className="space-y-2">
            <li>
              <button className="w-full text-left bg-bg-header p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500">
                Cambiar contraseña
              </button>
            </li>
            <li>
              <button className="w-full text-left bg-bg-header p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500">
                Configurar notificaciones
              </button>
            </li>
            <li>
              <button className="w-full text-left bg-red-500 hover:bg-red-700 text-white font-bold p-3 mt-5 rounded-3xl">
                Eliminar cuenta
              </button>
            </li>
          </ul>
        </aside>

        <aside className="w-1/2 bg-bg-main p-5 rounded-3xl">
          <h2 className="text-2xl mb-4">Grafico de usuario</h2>
          {/* Aquí se puede agregar un gráfico o estadísticas relacionadas con el usuario, como su actividad, logros, etc. */}
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </aside>
      </section>
    </main>
  );
}
