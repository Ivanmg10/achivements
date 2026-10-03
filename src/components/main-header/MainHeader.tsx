'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import { IconHome, IconChevronLeft, IconSearch, IconFlame, IconMenu } from '@tabler/icons-react'
import SearchModal from '@/components/search-modal/SearchModal'
import MobileNavModal from './MobileNavModal'
import StatusNavDropdown from './status-nav-dropdown/StatusNavDropdown'

function NavLink({ href, label, active, glass }: { href: string; label: string; active: boolean; glass?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-1.5 text-sm rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 whitespace-nowrap ${
        active
          ? `text-accent font-medium ${glass ? 'bg-ink/10 backdrop-blur-sm' : 'bg-bg-main'} ring-1 ring-ink/10`
          : `text-text-secondary hover:text-text-main ${glass ? 'hover:bg-ink/10' : 'hover:bg-bg-main/60'}`
      }`}
    >
      {label}
    </Link>
  )
}

function StreakBadge({ streak, glass }: { streak: number; glass?: boolean }) {
  if (streak === 0) return null
  return (
    <Link
      href="/racha"
      aria-label={`Racha: ${streak} días`}
      className={`flex items-center gap-1 ${glass ? 'bg-ink/10 backdrop-blur-sm hover:bg-ink/20' : 'bg-bg-main hover:bg-bg-main/80'} px-3 py-1.5 rounded-full shrink-0 ring-1 ring-ink/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70`}
    >
      <IconFlame className="w-3.5 h-3.5 text-orange-400" aria-hidden />
      <span className="text-xs font-bold text-text-main">{streak}d</span>
    </Link>
  )
}

export default function MainHeader() {
  const { data: session, status } = useSession()
  const { T } = useLanguage()
  const { activeStreak } = useStreakData()
  const router = useRouter()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  const streak = activeStreak?.days ?? 0
  // With no platform linked there is nothing to search, sort or count: the
  // bar keeps only the way home and the way to the account.
  const hasPlatform = Boolean(session?.user?.rausername || session?.user?.steamid)
  const isHome = pathname === '/'
  const isGameInfo = pathname.startsWith('/gameInfo/')
  const avatarSrc = session?.user?.avatar ?? session?.user?.image ?? null

  const openSearch = useCallback(() => { setInitialQuery(''); setSearchOpen(true) }, [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (searchOpen || !hasPlatform) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key.length !== 1) return
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) return
      if (document.activeElement?.getAttribute('contenteditable')) return
      setInitialQuery(e.key)
      setSearchOpen(true)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen, hasPlatform])

  const statusItems = [
    { href: '/playing', label: T.mainPage.playing },
    { href: '/wantToPlay', label: T.mainPage.wantToPlay },
    { href: '/completed', label: T.mainPage.completed },
  ]
  const navItems = [{ href: '/groups', label: T.groups.title }]
  const isStatusActive = statusItems.some(({ href }) => pathname === href)

  return (
    <>
      {/*
        Floating bar: the wrapper keeps the 64px the game heroes are drawn
        under (8px gap + 56px bar), so nothing below has to move.
      */}
      <div className="sticky top-0 z-40 h-16 shrink-0 px-2 sm:px-3 pt-2 pointer-events-none">
      <header
        className={`pointer-events-auto relative flex items-center text-text-main px-3 sm:px-4 h-14 rounded-2xl backdrop-blur-xl backdrop-saturate-150 ring-1 shadow-lg shadow-black/20 transition-colors ${
          isGameInfo ? 'bg-bg-main/30 ring-ink/10' : 'bg-bg-card/80 ring-ink/[0.06]'
        }`}
      >
        {/* Left: home + back + nav (desktop) / hamburguesa (mobile) */}
        <div className="flex items-center gap-1 shrink-0 z-10">
          <Link
            href="/"
            aria-label="Home"
            className={`p-1.5 rounded-full transition-colors text-text-secondary hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0 ${isGameInfo ? 'hover:bg-ink/10' : 'hover:bg-bg-main'}`}
          >
            <IconHome className="w-5 h-5" aria-hidden="true" />
          </Link>
          {!isHome && (
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className={`p-1.5 rounded-lg transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0 ${isGameInfo ? 'hover:bg-ink/10' : 'hover:bg-bg-main'}`}
            >
              <IconChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          {/* Desktop nav - visible on md+ */}
          {hasPlatform && (
          <nav className="hidden md:flex items-center gap-0.5 ml-2" aria-label="Main navigation">
            <StatusNavDropdown
              items={statusItems.map(({ href, label }) => ({
                href: session ? href : '/authPage',
                label,
              }))}
              active={isStatusActive}
              glass={isGameInfo}
              label={T.header.status}
            />
            {navItems.map(({ href, label }) => (
              <NavLink
                key={href}
                href={session ? href : '/authPage'}
                label={label}
                active={pathname === href}
                glass={isGameInfo}
              />
            ))}
          </nav>
          )}

          {/* Hamburger menu - mobile only */}
          {hasPlatform && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
            className={`md:hidden p-1.5 rounded-lg transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${isGameInfo ? 'hover:bg-ink/10' : 'hover:bg-bg-main'}`}
          >
            <IconMenu className="w-5 h-5" aria-hidden="true" />
          </button>
          )}
        </div>

        {/* Center: search bar - absolute only on lg+, hidden on smaller */}
        {hasPlatform && (
        <div className="hidden 2xl:flex absolute xl:w-[80%] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-4 pointer-events-none">
          <button
            onClick={openSearch}
            aria-label="Search games"
            className={`flex w-[40%] mx-auto rounded-full px-4 py-2.5 text-sm text-text-secondary text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 flex items-center gap-2 cursor-pointer ring-1 pointer-events-auto ${isGameInfo ? 'bg-ink/10 backdrop-blur-sm ring-ink/20 hover:bg-ink/20' : 'bg-bg-main ring-ink/5 hover:bg-bg-main/80'}`}
          >
            <IconSearch className="w-4 h-4 shrink-0" aria-hidden />
            <span>{T.search.placeholder}</span>
          </button>
        </div>
        )}

        {/* Right: search icon (mobile) + streak + user */}
        <div className="flex items-center gap-2 shrink-0 ml-auto z-10">
          {/* Search icon - mobile only, to the right */}
          {hasPlatform && (
          <button
            onClick={openSearch}
            aria-label="Search games"
            className={`2xl:hidden p-1.5 rounded-lg transition-colors text-text-secondary hover:text-text-main cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 shrink-0 ${isGameInfo ? 'hover:bg-ink/10' : 'hover:bg-bg-main'}`}
          >
            <IconSearch className="w-5 h-5" aria-hidden="true" />
          </button>
          )}

          {session ? (
            <>
              <StreakBadge streak={streak} glass={isGameInfo} />
              <Link
                href="/user"
                aria-label="Profile"
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ring-1 ring-ink/10 ${isGameInfo ? 'bg-ink/10 backdrop-blur-sm hover:bg-ink/20' : 'bg-bg-main hover:bg-ink/5'}`}
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
          ) : status === 'loading' ? (
            // Still reading the session: a placeholder where the avatar goes, not a flash of "Sign in".
            <span aria-hidden="true" className="w-36 h-11 rounded-full bg-bg-main/60 animate-pulse motion-reduce:animate-none" />
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
      </div>

      <SearchModal isOpen={searchOpen} onClose={closeSearch} initialQuery={initialQuery} />
      <MobileNavModal isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  )
}
