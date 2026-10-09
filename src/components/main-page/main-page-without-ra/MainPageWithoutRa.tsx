'use client'

import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'
import RecentGamesList from '@/components/recent-games-list/RecentGamesList'
import MainPageProfile from '../main-page-profile/MainPageProfile'
import MainPageCharts from '../main-page-charts/MainPageCharts'

/**
 * Main page for a user with Steam or PSN linked but no RA account. The top is
 * the recent feed and the profiles (tabs when both are linked); below it, the
 * same stats section as everyone's. Its RA hooks stay empty without an account
 * and the platform selector falls back to the linked one, so what shows is
 * Steam's or PSN's.
 */
export default function MainPageWithoutRa() {
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
        </div>

        <div className="flex flex-col min-h-0 lg:col-start-1 lg:row-start-1">
          <div className="m-3 bg-bg-card rounded-xl p-4 flex flex-col flex-1 min-h-0">
            <RecentGamesList />
          </div>
        </div>
      </div>

      <MainPageCharts />
    </motion.main>
  )
}
