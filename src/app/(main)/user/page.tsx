"use client";

import NoMainHeader from "@/components/no-main-header/NoMainHeader";
import UserConfig from "@/components/user-config/UserConfig";
import UserData from "@/components/user-data/UserData";
import { useSession } from "next-auth/react";

export default function UserPage() {
  const { data: session } = useSession();

  return (
    <main
      className={`min-h-screen bg-bg-main text-text-main flex flex-col justify-start items-center`}
    >
      <NoMainHeader />
      {/* DATOS DE USUARIO */}
      <UserData session={session} />

      {/* CONFIGURACIÓN DE CUENTA */}
      <UserConfig />
    </main>
  );
}
