'use client'

import UserTheme from '../user-theme/UserTheme'
import { useLanguage } from '@/context/LanguageContext'

export default function UserConfig() {
  const { lang, setLang, T } = useLanguage()

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 w-[95%] pt-3 pb-3">
      <UserTheme />
      <article className="p-5 bg-bg-card rounded-3xl">
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
          </ul>
        </aside>
      </article>
    </section>
  )
}
