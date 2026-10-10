'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { IconChartHistogram, IconLayoutGrid, IconLibrary } from '@tabler/icons-react'
import UserPlatformCard from '@/components/user-page/user-platform-card/UserPlatformCard'
import RaLoginModal from '@/components/ra-login-modal/RaLoginModal'
import RaLogo from '@/components/ra-logo/RaLogo'
import UserSteamCard from '@/components/user-page/user-steam-card/UserSteamCard'
import UserPsnCard from '@/components/user-page/user-psn-card/UserPsnCard'
import { useLanguage } from '@/context/LanguageContext'

const ACTION =
  'w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-accent text-bg-main font-semibold text-sm hover:bg-accent-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70'

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
  const [raModalOpen, setRaModalOpen] = useState(false)

  const raLinked = Boolean(session?.user?.rausername)
  const steamLinked = Boolean(session?.user?.steamid)
  const psnLinked = Boolean(session?.user?.psnaccountid)

  const perks = [
    { icon: <IconLibrary size={20} />, text: T.landing.libraryTitle },
    { icon: <IconLayoutGrid size={20} />, text: T.landing.organiseTitle },
    { icon: <IconChartHistogram size={20} />, text: T.landing.progressTitle },
  ]

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-text-main">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <header className="flex flex-col items-center text-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{T.connect.title}</h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl">{T.connect.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!raLinked && (
            <UserPlatformCard
              name="RetroAchievements"
              logo={<RaLogo height={18} />}
              bigLogo={<RaLogo height={40} />}
              gradient="from-[#2a80c7] via-[#2a80c7]/40 to-[#e5b53f]"
              connected={false}
              hint={T.connect.raPitch}
              action={
                <button onClick={() => setRaModalOpen(true)} className={ACTION}>
                  <RaLogo height={14} />
                  {T.userData.signInRA}
                </button>
              }
            />
          )}

          {/* The account page's own Steam card: the name is typed right here. */}
          {!steamLinked && <UserSteamCard />}

          {/* The account page's own PSN card: the online ID is typed right here. */}
          {!psnLinked && <UserPsnCard />}
        </div>

        <section className="flex flex-col items-center gap-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
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

      <RaLoginModal isOpen={raModalOpen} setIsOpen={setRaModalOpen} />
    </main>
  )
}
