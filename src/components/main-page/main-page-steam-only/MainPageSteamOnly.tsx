'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconPlugConnected } from '@tabler/icons-react'
import { fadeUp } from '@/lib/animations'
import { useLanguage } from '@/context/LanguageContext'
import SteamRecentList from '@/components/steam/steam-recent-list/SteamRecentList'
import MainPageProfileSt from '../main-page-profile/main-page-profile-st/MainPageProfileSt'

/**
 * Main page for a user with Steam linked but no RA account. The regular main
 * page is built on RA data throughout (charts, progression, pinned games), so
 * rather than a page of empty RA widgets this shows what Steam can back — the
 * recent feed and the Steam profile — plus a pointer to link RA as well.
 */
export default function MainPageSteamOnly() {
  const { T } = useLanguage()

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
          <MainPageProfileSt />
          <div className="flex flex-col items-start gap-2 p-4 bg-bg-card rounded-xl">
            <IconPlugConnected className="w-6 h-6 text-text-secondary" aria-hidden="true" />
            <p className="text-sm text-text-secondary">{T.steam.steamOnlyHint}</p>
            <Link
              href="/user"
              className="px-4 py-1.5 bg-accent text-bg-main font-semibold rounded-xl hover:scale-[1.03] transition-transform duration-200 text-sm"
            >
              {T.steam.connectRa}
            </Link>
          </div>
        </div>

        <div className="flex flex-col min-h-0 lg:col-start-1 lg:row-start-1">
          <div className="m-3 bg-bg-card rounded-xl p-4 flex flex-col flex-1 min-h-0">
            <SteamRecentList />
          </div>
        </div>
      </div>
    </motion.main>
  )
}
