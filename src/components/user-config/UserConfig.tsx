"use client";

import { signOut, useSession } from "next-auth/react";
import UserTheme from "../user-theme/UserTheme";
import { unlinkRaUser } from "@/utils/apiCallsUtils";

export default function UserConfig() {
  const { data: session, update } = useSession();
  return (
    <section className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-3 w-[95%] pt-3 pb-3 ">
      {/* CONFIGURACIÓN DE TEMA */}
      <UserTheme />
      <article className="p-5 flex flex-row gap-5 items-start justify-between bg-bg-card rounded-3xl p-5 flex-1 min-h-0 overflow-auto">
        <aside className="w-full h-full bg-bg-main p-5 rounded-3xl">
          <h2 className="text-2xl mb-4">Configuración de cuenta</h2>
          <ul className="space-y-2">
            <li>
              <button className="w-full text-left bg-bg-card p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500">
                Cambiar contraseña
              </button>
            </li>
            <li>
              <button className="w-full text-left bg-bg-card p-3 rounded-3xl hover:duration-500 hover:transform hover:scale-102 transition duration-500">
                Configurar notificaciones
              </button>
            </li>
            <li>
              <button
                onClick={() => signOut()}
                className="w-full text-left bg-red-500 hover:bg-red-700 text-white font-bold p-3 mt-5 rounded-3xl"
              >
                Cerrar sesion
              </button>
            </li>
            {session?.user.raUser &&
              Object.keys(session.user.raUser).length > 0 && (
                <li>
                  <button
                    onClick={() => unlinkRaUser(update)}
                    className="w-full text-left bg-red-500 hover:bg-red-700 text-white font-bold p-3 rounded-3xl"
                  >
                    Cerrar sesion en RA
                  </button>
                </li>
              )}
          </ul>
        </aside>
      </article>
    </section>
  );
}
