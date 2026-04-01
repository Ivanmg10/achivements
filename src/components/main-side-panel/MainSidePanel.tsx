"use client";

import { CATEGORIES, CONSOLES } from "@/constants";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function MainSidePanel() {
  const { data: session } = useSession();

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
      <ul className="pl-5 w-full flex flex-col gap-3 list-none">
        {CATEGORIES.map((category) => (
          <li key={category.slug} className="text-lg">
            <Link
              className="transition-transform duration-200 hover:scale-105"
              href={`/${category.slug}`}
            >
              {category.label}
            </Link>
            <ul className="pl-5 flex flex-col gap-1 mt-1">
              {CONSOLES.map((console) => (
                <li
                  key={console.id}
                  className="transition-transform duration-200 hover:scale-105"
                >
                  <Link
                    href={`/${category.slug}/${console.id}`}
                    className="flex items-center gap-2 text-base text-gray-400"
                  >
                    <Image
                      src={console.icon}
                      alt={console.name}
                      width={20}
                      height={20}
                      className="object-contain"
                    />
                    {console.name}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  );
}
