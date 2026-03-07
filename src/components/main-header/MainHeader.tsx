"use client";

import { useTheme } from "@/context/ThemeContext";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function MainHeader() {
  const { theme } = useTheme();
  const { data: session } = useSession();

  return (
    <header
      className={`flex flex-row justify-between items-center main-header-${theme}`}
    >
      <nav className="px-3 py-6 w-100">
        <ul className="flex gap-7">
          <li className="text-2xl">
            <Link href="/">Main</Link>
          </li>
          <li className="text-2xl">
            <Link href="/apitest">ApiTest</Link>
          </li>
        </ul>
      </nav>

      {session ? (
        <button
          className="main-body-red px-2 py-1 m-5 rounded-3xl"
          onClick={() => signOut()}
        >
          <p className="hover:text-white w-full">Cerrar session</p>
        </button>
      ) : (
        <button
          className="main-body-red px-2 py-1 m-5 rounded-3xl"
          onClick={() => signOut()}
        >
          <Link href="/authPage" className="hover:text-white w-full">
            Iniciar sesión
          </Link>
        </button>
      )}

      {/* <div className="p-5 flex flex-row gap-5">
        <button
          onClick={() => toggleThemeButton("red")}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Rojo
        </button>
        <button
          onClick={() => toggleThemeButton("blue")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Azul
        </button>
        <button
          onClick={() => toggleThemeButton("yellow")}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
        >
          Amarillo
        </button>
        <button
          onClick={() => toggleThemeButton("green")}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Verde
        </button>
        <button
          onClick={() => toggleThemeButton("dark")}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Negro
        </button>
      </div> */}
    </header>
  );
}
