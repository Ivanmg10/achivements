'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { useMainView } from '@/contexts/MainViewContext'
import { calcStreak } from '@/utils/utils'
import { IconHome, IconChevronLeft, IconSearch, IconFlame, IconLayoutList, IconHistory } from '@tabler/icons-react'
import SearchModal from '@/components/search-modal/SearchModal'

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-1.5 text-sm rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 whitespace-nowrap ${
        active
          ? 'text-text-main font-medium bg-bg-main ring-1 ring-white/10'
          : 'text-text-secondary hover:text-text-main hover:bg-bg-main/60'
      }`}
    >
      {label}
    </Link>
  )
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) return null
  return (
    <div className="flex items-center gap-1 bg-bg-main px-3 py-1.5 rounded-full shrink-0 ring-1 ring-white/10">
      <IconFlame className="w-3.5 h-3.5 text-orange-400" aria-hidden />
      <span className="text-xs font-bold text-text-main">{streak}d</span>
    </div>
  )
}

export default function MainHeader() {
  const { data: session } = useSession()
  const { T } = useLanguage()
  const { achievements: recentAch } = useRecentAchievements()
  const { view, setView } = useMainView()
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)

  const streak = calcStreak(recentAch)
  const isHome = pathname === '/'
  const avatarSrc = session?.user?.avatar ?? session?.user?.image ?? null

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  const navItems = [
    { href: '/playing', label: T.mainPage.playing },
    { href: '/wantToPlay', label: T.mainPage.wantToPlay },
    { href: '/completed', label: T.mainPage.completed },
    { href: '/groups', label: T.groups.title },
  ]

  return (
    <>
      <header className="flex flex-row items-center bg-bg-card text-text-main px-4 py-2 gap-3 h-16">
        {/* Left: home + back + nav */}
        <div className="flex items-center gap-1 flex-1">
          <Link
            href="/"
            aria-label="Home"
            className="p-1.5 rounded-full hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0"
          >
            <IconHome className="w-5 h-5" aria-hidden="true" />
          </Link>
          {!isHome && (
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0"
            >
              <IconChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          {/* Mobile search icon */}
          <button
            onClick={openSearch}
            aria-label="Search games"
            className="md:hidden p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0"
          >
            <IconSearch className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-0.5 ml-2" aria-label="Main navigation">
            {navItems.map(({ href, label }) => (
              <NavLink
                key={href}
                href={session ? href : '/authPage'}
                label={label}
                active={pathname === href}
              />
            ))}
          </nav>
        </div>

        {/* Center: search */}
        <div className="hidden md:flex justify-center shrink-0">
          <button
            onClick={openSearch}
            aria-label="Search games"
            className="w-80 bg-bg-main rounded-full px-4 py-2.5 text-sm text-text-secondary text-left hover:bg-bg-main/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 flex items-center gap-2 cursor-pointer ring-1 ring-white/5"
          >
            <IconSearch className="w-4 h-4 shrink-0" aria-hidden />
            <span>{T.search.placeholder}</span>
          </button>
        </div>

        {/* Home view toggle */}
        {isHome && (
          <div className="hidden md:flex items-center gap-0.5 bg-bg-main rounded-full p-1 ring-1 ring-white/10 shrink-0">
            <button
              onClick={() => setView('panels')}
              aria-label="Show game panels"
              className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${view === 'panels' ? 'bg-accent text-bg-main' : 'text-text-secondary hover:text-text-main'}`}
            >
              <IconLayoutList className="w-4 h-4" aria-hidden />
            </button>
            <button
              onClick={() => setView('recent')}
              aria-label="Show recently played"
              className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${view === 'recent' ? 'bg-accent text-bg-main' : 'text-text-secondary hover:text-text-main'}`}
            >
              <IconHistory className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}

        {/* Right: streak + user */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {session ? (
            <>
              <StreakBadge streak={streak} />
              <Link
                href="/user"
                aria-label="Profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-bg-main hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ring-1 ring-white/10"
              >
                <span className="text-sm font-medium hidden sm:block text-text-main leading-none">
                  {session.user?.name ?? session.user?.email}
                </span>
                {avatarSrc ? (
                  <Image
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    width={64}
                    height={64}
                    src={avatarSrc}
                    alt={session.user?.name ?? 'User'}
                    unoptimized
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent">
                      {(session.user?.name ?? session.user?.email ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </>
          ) : (
            <Link
              href="/authPage"
              className="px-4 py-1.5 rounded-full bg-accent text-bg-main text-sm font-medium hover:bg-accent/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {T.header.signIn}
            </Link>
          )}
        </div>
      </header>

      <SearchModal isOpen={searchOpen} onClose={closeSearch} />
    </>
  )
}
