'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useRecentAchievements } from '@/hooks/useRecentAchievements'
import { calcStreak } from '@/utils/utils'
import { IconHome, IconChevronLeft, IconSearch, IconFlame, IconMenu } from '@tabler/icons-react'
import SearchModal from '@/components/search-modal/SearchModal'
import MobileNavModal from './MobileNavModal'

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-1.5 text-sm rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 whitespace-nowrap ${
        active
          ? 'text-accent font-medium bg-bg-main ring-1 ring-white/10'
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
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <header className="relative flex items-center bg-bg-card text-text-main px-4 h-16">
        {/* Left: home + back + nav (desktop) / hamburguesa (mobile) */}
        <div className="flex items-center gap-1 shrink-0 z-10">
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

          {/* Desktop nav - visible on md+ */}
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

          {/* Hamburger menu - mobile only */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
            className="md:hidden p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            <IconMenu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Center: search bar - absolute only on lg+, hidden on smaller */}
        <div className="hidden 2xl:flex absolute xl:w-[80%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 pointer-events-none">
          <button
            onClick={openSearch}
            aria-label="Search games"
            className="flex w-[40%] mx-auto bg-bg-main rounded-full px-4 py-2.5 text-sm text-text-secondary text-left hover:bg-bg-main/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 flex items-center gap-2 cursor-pointer ring-1 ring-white/5 pointer-events-auto"
          >
            <IconSearch className="w-4 h-4 shrink-0" aria-hidden />
            <span>{T.search.placeholder}</span>
          </button>
        </div>

        {/* Right: search icon (mobile) + streak + user */}
        <div className="flex items-center gap-2 shrink-0 ml-auto z-10">
          {/* Search icon - mobile only, to the right */}
          <button
            onClick={openSearch}
            aria-label="Search games"
            className="2xl:hidden p-1.5 rounded-lg hover:bg-bg-main transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0"
          >
            <IconSearch className="w-5 h-5" aria-hidden="true" />
          </button>

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
      <MobileNavModal isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
