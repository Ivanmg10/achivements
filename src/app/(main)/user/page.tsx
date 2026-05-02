"use client";

import GamesPlayedPieChart from "@/components/games-played-pie-chart/GamesPlayedPieChart";
// import NoMainHeader from "@/components/no-main-header/NoMainHeader";
import UserCharts from "@/components/user-charts/UserCharts";
import UserConfig from "@/components/user-config/UserConfig";
import UserData from "@/components/user-data/UserData";
import { getAllGamesPlayed } from "@/utils/apiCallsUtils";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function UserPage() {
  const { data: session } = useSession();

  return (
    <main
      className={`min-h-screen bg-bg-main text-text-main flex flex-col justify-start items-center`}
    >
      {/* BACK BUTTON - now handled by MainHeader */}
      {/* <NoMainHeader /> */}

      {/* DATOS DE USUARIO */}
      <UserData session={session} />

      {/* GRAFICOS DE USUARIO */}
      <UserCharts />

      {/* CONFIGURACIÓN DE CUENTA */}
      <UserConfig />
    </main>
  );
}
