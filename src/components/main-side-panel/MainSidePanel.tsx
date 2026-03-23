"use client";

import { useSession } from "next-auth/react";

export default function MainSidePanel() {
  const { data: session } = useSession();

  return (
    <aside className="bg-bg-card m-2 rounded-lg">
      <h1 className="text-2xl p-5">Bienvenido {session?.user?.name}</h1>
      <ul className="p-5">
        <li>Profile</li>
        <li>Want to play</li>
        <li>Recently played</li>
        <li>Recommended</li>
      </ul>
    </aside>
  );
}
