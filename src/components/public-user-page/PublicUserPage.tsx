'use client'

import { motion } from 'framer-motion'
import { IconUserOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useCheevoUser, type CheevoUser } from '@/hooks/useCheevoUser'
import { useRaLinked } from '@/hooks/useRaLinked'
import SubjectProviders from '@/components/subject-providers/SubjectProviders'
import { MainPageBody } from '@/components/main-page/MainPage'
import MainPageWithoutRa from '@/components/main-page/main-page-without-ra/MainPageWithoutRa'
import PublicUserHeader from './public-user-header/PublicUserHeader'

/** What the main page would show for this user: RA's layout, or the Steam/PSN one without it. */
function UserPage({ user }: { user: CheevoUser }) {
  const { T } = useLanguage()
  // Inside SubjectProviders: true only when the user has RA AND the viewer can read it.
  const raLinked = useRaLinked()

  if (raLinked) {
    return (
      <motion.main className="home-fit flex flex-col min-h-full text-text-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
        <MainPageBody />
      </motion.main>
    )
  }
  if (user.steam || user.psn) return <MainPageWithoutRa />
  return <p className="py-16 text-center text-sm text-text-secondary">{T.publicProfile.noAccounts}</p>
}

/**
 * A CheevoVault user's page: who they are, and then the main page as that
 * user sees it — the same profile column, recent games and stats, for every
 * platform they have linked.
 */
export default function PublicUserPage({ username }: { username: string }) {
  const { T } = useLanguage()
  const { user, isLoading, error, retry } = useCheevoUser(username)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-text-secondary text-center px-4">
        <IconUserOff className="w-10 h-10" aria-hidden="true" />
        <p role="alert" className="text-sm">
          {error === 'missing' ? T.publicProfile.userNotFound.replace('{u}', username) : T.publicProfile.userLoadError}
        </p>
        {error === 'failed' && (
          <button onClick={retry} className="text-sm text-accent hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
            {T.publicProfile.retry}
          </button>
        )}
      </div>
    )
  }

  if (isLoading || !user) {
    return <p role="status" className="py-24 text-center text-sm text-text-secondary">{T.cards.loading}</p>
  }

  return (
    <div className="flex flex-col min-h-full text-text-main">
      <PublicUserHeader user={user} />
      <SubjectProviders user={user}>
        <UserPage user={user} />
      </SubjectProviders>
    </div>
  )
}
