'use client'

import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { calcStreak } from '@/utils/utils'
import { RetroAchievementsUserProfile } from '@/types/types'
import { IconHome, IconChevronLeft } from '@tabler/icons-react'

function StatPill({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex flex-col items-center bg-bg-main rounded-xl px-4 py-1.5 min-w-16">
      <span className="text-[10px] uppercase tracking-widest text-text-secondary font-medium">{label}</span>
      <span className="text-base font-bold text-text-main leading-tight">
        {value.toLocaleString()}{suffix}
      </span>
    </div>
  )
}

function HeaderStats({ raUser, streak }: { raUser: RetroAchievementsUserProfile; streak: number }) {
  return (
    <div className="flex items-center gap-2">
      <StatPill label="HC" value={raUser.TotalPoints} />
      <StatPill label="SC" value={raUser.TotalSoftcorePoints} />
      <StatPill label="Streak" value={streak} suffix="d" />
    </div>
  )
}

export default function MainHeader() {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const recentAch = useRecentAchievements()
  const router = useRouter()
  const pathname = usePathname()

  const raUser = session?.user?.raUser
  const streak = calcStreak(recentAch)
  const isHome = pathname === '/'

  return (
    <header className="flex flex-row justify-between items-center bg-bg-card text-text-main px-4 py-2 gap-4 h-16">
      {/* Far left: home + back */}
      <div className="flex items-center gap-1 shrink-0">
        <Link
          href="/"
          className="p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main"
        >
          <IconHome className="w-5 h-5" />
        </Link>
        {!isHome && (
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main cursor-pointer"
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Left: HC / SC / Streak */}
      <div className="flex items-center gap-2 flex-1">
        {raUser && <HeaderStats raUser={raUser} streak={streak} />}
      </div>

      {/* Center: search bar (non-functional) */}
      <div className="flex-1 flex justify-center">
        <input
          className="w-full max-w-md bg-bg-main rounded-xl px-4 py-2 text-sm text-text-main placeholder:text-text-secondary outline-none cursor-not-allowed opacity-60"
          placeholder="Search..."
          disabled
        />
      </div>

      {/* Right: RA user profile */}
      {raUser ? (
        <Link href="/user" className="flex items-center gap-3 flex-1 justify-end hover:text-amber-100">
          <p className="text-sm">{raUser.User}</p>
          {raUser.UserPic && (
            <Image
              className="w-10 h-10 cursor-pointer rounded-full object-cover"
              width={100}
              height={100}
              src={`https://retroachievements.org${raUser.UserPic}`}
              alt={raUser.User}
              unoptimized
            />
          )}
        </Link>
      ) : !session ? (
        <div className="flex-1 flex justify-end">
          <button className="main-body-red px-2 py-1 rounded-3xl">
            <Link href="/authPage" className="hover:text-white w-full">
              {T.header.signIn}
            </Link>
          </button>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </header>
  )
}
