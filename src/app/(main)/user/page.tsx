"use client";

import { useTheme } from "@/context/ThemeContext";

export default function UserPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main
      className={`min-h-screen main-body-${theme} flex flex-row justify-center items-center`}
    >
      <h1>Color</h1>
      <div className="p-5 flex flex-row gap-5">
        <button
          onClick={() => toggleTheme("red")}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Rojo
        </button>
        <button
          onClick={() => toggleTheme("blue")}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Azul
        </button>
        <button
          onClick={() => toggleTheme("yellow")}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
        >
          Amarillo
        </button>
        <button
          onClick={() => toggleTheme("green")}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Verde
        </button>
        <button
          onClick={() => toggleTheme("dark")}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Negro
        </button>
      </div>
    </main>
  );
}
