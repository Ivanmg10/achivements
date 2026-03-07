"use client";

import { useTheme } from "@/context/ThemeContext";
import { useSession } from "next-auth/react";

export default function MainStart() {
  const { theme } = useTheme();
  const { data: session } = useSession();

  return (
    <main className={`min-h-screen main-body-${theme}`}>
      <section className={`text-center main-header-${theme}`}>
        <h1 className="text-5xl">Bienvenido {session?.user?.name}</h1>
        <br />
        <p className="text-2xl p-5">
          Una aplicación para ver tus logros y progresos en retroachivements y
          steam
        </p>
      </section>
    </main>
  );
}
