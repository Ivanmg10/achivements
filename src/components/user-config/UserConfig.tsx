'use client'

import { signOut, useSession } from 'next-auth/react'
import UserTheme from '../user-theme/UserTheme'
import { unlinkRaUser } from '@/utils/apiCallsUtils'
import { useLanguage } from '@/context/LanguageContext'

export default function UserConfig() {
  const { data: session, update } = useSession()
  const { lang, setLang, T } = useLanguage()

  return (
    <section className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-3 w-[95%] pt-3 pb-3 ">
      {/* CONFIGURACIÓN DE TEMA */}
      <UserTheme />
      <article className="p-5 flex flex-row gap-5 items-start justify-between bg-bg-card rounded-3xl flex-1 min-h-0 overflow-auto">
        <aside className="w-full h-full bg-bg-main p-5 rounded-3xl">
          <h2 className="text-2xl mb-4">{T.userConfig.accountSettings}</h2>
          <ul className="space-y-2">
            <li>
              <button className="w-full text-left bg-bg-card p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200">
                {T.userConfig.changePassword}
              </button>
            </li>
            <li>
              <div className="w-full bg-bg-card p-3 rounded-3xl flex items-center justify-between">
                <span>{T.userConfig.language}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 rounded-xl text-sm transition-colors ${lang === 'en' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLang('es')}
                    className={`px-3 py-1 rounded-xl text-sm transition-colors ${lang === 'es' ? 'bg-accent text-bg-main' : 'bg-bg-main text-text-secondary hover:text-text-main'}`}
                  >
                    ES
                  </button>
                </div>
              </div>
            </li>
            <li>
              <button
                onClick={() => signOut()}
                className="w-full text-left bg-red-500 text-white font-bold p-3 mt-5 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
              >
                {T.userConfig.signOut}
              </button>
            </li>
            {session?.user.raUser &&
              Object.keys(session.user.raUser).length > 0 && (
                <li>
                  <button
                    onClick={() => unlinkRaUser(update)}
                    className="w-full text-left bg-red-500 text-white font-bold p-3 rounded-3xl hover:scale-[1.03] transition-transform duration-200"
                  >
                    {T.userConfig.signOutRA}
                  </button>
                </li>
              )}
          </ul>
        </aside>
      </article>
    </section>
  )
}
