'use client'

import { useTheme } from '@/context/ThemeContext'
import { useLanguage } from '@/context/LanguageContext'
import { useSession } from 'next-auth/react'

export default function MainStart() {
  const { theme } = useTheme()
  const { data: session } = useSession()
  const { T } = useLanguage()

  return (
    <main className={`min-h-screen main-body-${theme}`}>
      <section className={`text-center main-header-${theme}`}>
        <h1 className="text-5xl">{T.mainStart.welcome} {session?.user?.name}</h1>
        <br />
        <p className="text-2xl p-5">{T.mainStart.description}</p>
      </section>
    </main>
  )
}
