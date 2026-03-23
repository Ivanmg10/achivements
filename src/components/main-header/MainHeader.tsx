"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function MainHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex flex-row justify-between items-center bg-bg-card text-text-main">
      <nav className="px-3 py-6 w-100">
        <ul className="flex gap-7 items-center">
          <li className="text-3xl mr-5 ml-5">
            <p>Achivements</p>
          </li>
          <li className="text-l">
            <Link href="/">Home</Link>
          </li>
        </ul>
      </nav>

      {/* {session ? (
        <button
          className="main-body-red px-2 py-1 m-5 rounded-3xl"
          onClick={() => signOut()}
        >
          <p className="hover:text-white w-full">Cerrar session</p>
        </button>
      ) : (
        <button className="main-body-red px-2 py-1 m-5 rounded-3xl">
          <Link href="/authPage" className="hover:text-white w-full">
            Iniciar sesión
          </Link>
        </button>
      )} */}
      {session ? (
        <Link
          href="/user"
          className="flex items-center hover:text-amber-100 m-5"
        >
          <p>{session.user.name}</p>
          {session.user.avatar && (
            <Image
              className="w-12 h-12 ml-5 cursor-pointer rounded-full object-cover"
              width={100}
              height={100}
              src={session.user.avatar}
              alt="imagen"
              unoptimized
            />
          )}
        </Link>
      ) : (
        <button className="main-body-red px-2 py-1 m-5 rounded-3xl">
          <Link href="/authPage" className="hover:text-white w-full">
            Iniciar sesión
          </Link>
        </button>
      )}
    </header>
  );
}
