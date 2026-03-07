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
          <li className="text-2xl">
            <Link href="/user">User</Link>
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
    </header>
  );
}
