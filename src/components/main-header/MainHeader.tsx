"use client";

import { useTheme } from "@/context/ThemeContext";
import { Theme } from "@/types/types";
import Link from "next/link";

export default function MainHeader() {
  const { theme, toggleTheme } = useTheme();

  const toggleThemeButton = (color: Theme) => {
    toggleTheme(color);
  };

  return (
    <header className={`flex justify-center main-header-${theme}`}>
      <nav className="px-3 py-6">
        <ul className="flex gap-7 justify-center">
          <li className="text-2xl">
            <Link href="/">Main</Link>
          </li>
          <li className="text-2xl">
            <Link href="/home">Home</Link>
          </li>
          <li className="text-2xl">
            <Link href="/apitest">ApiTest</Link>
          </li>
        </ul>

        <div className="p-5 flex flex-row gap-5">
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
        </div>
      </nav>
    </header>
  );
}
