'use client'

import { motion } from 'framer-motion'
import { IconPlugConnected } from '@tabler/icons-react'
import { fadeUp } from '@/lib/animations'
import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import RaLoginModal from '@/components/ra-login-modal/RaLoginModal'
import RaLogo from '@/components/ra-logo/RaLogo'
import RecentGamesList from '@/components/recent-games-list/RecentGamesList'
import MainPageProfile from '../main-page-profile/MainPageProfile'

/**
 * Main page for a user with Steam or PSN linked but no RA account. The regular
 * main page is built on RA data throughout (charts, progression, pinned
 * games), so rather than a page of empty RA widgets this shows what Steam and
 * PSN can back — the recent feed and their profiles, as tabs when both are
 * linked — plus a pointer to link RA as well.
 */
export default function MainPageWithoutRa() {
  const { T } = useLanguage()
  const [raModalOpen, setRaModalOpen] = useState(false)

  return (
    <motion.main
      className="flex flex-col min-h-full text-text-main"
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
        {/* Profile first in DOM → top on mobile; placed col-2 on desktop */}
        <div className="lg:col-start-2 lg:row-start-1 m-3 flex flex-col gap-3">
          <MainPageProfile />
          <div className="flex flex-col items-start gap-2 p-4 bg-bg-card rounded-xl">
            <IconPlugConnected className="w-6 h-6 text-text-secondary" aria-hidden="true" />
            <p className="text-sm text-text-secondary">{T.steam.steamOnlyHint}</p>
            <button
              onClick={() => setRaModalOpen(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-accent text-bg-main font-semibold rounded-xl hover:bg-accent-hover transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              <RaLogo height={13} />
              {T.steam.connectRa}
            </button>
          </div>
        </div>

        <div className="flex flex-col min-h-0 lg:col-start-1 lg:row-start-1">
          <div className="m-3 bg-bg-card rounded-xl p-4 flex flex-col flex-1 min-h-0">
            <RecentGamesList />
          </div>
        </div>
      </div>

      <RaLoginModal isOpen={raModalOpen} setIsOpen={setRaModalOpen} />
    </motion.main>
  )
}
