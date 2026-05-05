"use client";

import UserData from "@/components/user-data/UserData";
import UserStats from "@/components/user-stats/UserStats";
import AdminPanel from "@/components/admin-panel/AdminPanel";
import { useSession } from "next-auth/react";

export default function UserPage() {
  const { data: session } = useSession();

  return (
    <main
      className={`min-h-screen bg-bg-main text-text-main flex flex-col justify-start items-center`}
    >
      <UserData session={session} />
      <UserStats />
      {session?.user?.admin && <AdminPanel />}
    </main>
  );
}
