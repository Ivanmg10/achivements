'use client'

import { useSession } from 'next-auth/react'
import { IconChartHistogram, IconLayoutGrid, IconLibrary } from '@tabler/icons-react'
import UserRaCard from '@/components/user-page/user-ra-card/UserRaCard'
import UserSteamCard from '@/components/user-page/user-steam-card/UserSteamCard'
import UserPsnCard from '@/components/user-page/user-psn-card/UserPsnCard'
import UserXboxCard from '@/components/user-page/user-xbox-card/UserXboxCard'
import { useXboxEnabled } from '@/hooks/useXboxEnabled'
import { useLanguage } from '@/context/LanguageContext'

/**
 * What a new account sees before linking anything: the platforms, what each
 * one costs to connect, and the button that does it — no trip to settings and
 * no invented games standing in for a library that does not exist yet.
 *
 * The same cards as the account page, so connecting looks the same wherever
 * it is done.
 */
export default function ConnectAccounts() {
  const { data: session } = useSession()
  const { T } = useLanguage()

  const raLinked = Boolean(session?.user?.rausername)
  const steamLinked = Boolean(session?.user?.steamid)
  const psnLinked = Boolean(session?.user?.psnaccountid)
  const xboxEnabled = useXboxEnabled()
  const xboxLinked = Boolean(session?.user?.xboxxuid)

  const perks = [
    { icon: <IconLibrary size={20} />, text: T.landing.libraryTitle },
    { icon: <IconLayoutGrid size={20} />, text: T.landing.organiseTitle },
    { icon: <IconChartHistogram size={20} />, text: T.landing.progressTitle },
  ]

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-text-main">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <header className="flex flex-col items-center text-center gap-2 enter-rows">
          <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1] pr-1">{T.connect.title}</h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl">{T.connect.subtitle}</p>
        </header>

        <div className={`grid grid-cols-1 gap-4 enter-cards ${xboxEnabled ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          {/* The account page's own cards, so connecting looks the same wherever it is done. */}
          {!raLinked && <UserRaCard hint={T.connect.raPitch} />}
          {!steamLinked && <UserSteamCard />}
          {!psnLinked && <UserPsnCard />}

          {/* Xbox, only for who may use it (an admin, for now): the card renders nothing for anyone else. */}
          {!xboxLinked && <UserXboxCard />}
        </div>

        <section className="flex flex-col items-center gap-3">
          <h2 className="text-sm font-semibold text-text-secondary">
            {T.connect.whatYouGet}
          </h2>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {perks.map((perk) => (
              <li key={perk.text} className="flex items-center gap-2 text-sm text-text-secondary">
                <span aria-hidden="true" className="text-accent">
                  {perk.icon}
                </span>
                {perk.text}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
