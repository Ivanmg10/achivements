'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useBackRegistry } from '@/context/BackInterceptContext'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakData } from '@/hooks/useStreakData'
import { IconHome, IconChevronLeft, IconSearch, IconMenu } from '@tabler/icons-react'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import { Skeleton } from '@/components/ui/Skeleton'

// Downloaded the first time it is opened, not with the page.
const SearchModal = dynamic(() => import('@/components/search-modal/SearchModal'), { loading: () => null })
const MobileNavModal = dynamic(() => import('./MobileNavModal'), { loading: () => null })
import StatusNavDropdown from './status-nav-dropdown/StatusNavDropdown'
import MainHeaderLevel from './main-header-level/MainHeaderLevel'
import { plural } from '@/utils/utils'
import { canUseXbox } from '@/utils/xboxAccess'
import Button from '@/components/ui/Button'
import StreakTag from '@/components/ui/StreakTag'

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative inline-flex items-center gap-1 h-10 px-3 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:rounded-chip after:content-[''] after:absolute after:left-2.5 after:right-2.5 after:bottom-0.5 after:h-[3px] after:bg-accent after:skew-x-(--slant-line) after:origin-left after:transition-transform after:duration-(--motion-open) ${active ? 'text-text-main after:scale-x-100' : 'text-text-secondary hover:text-text-main after:scale-x-0'}`}
    >
      {label}
    </Link>
  )
}

/**
 * The way to the streak page, always there: the current streak in days, or a
 * dimmed 0 when there is none, so the page can still be reached to look back.
 */
function StreakBadge({ streak, glass }: { streak: number; glass?: boolean }) {
  const { T, lang } = useLanguage()
  return (
    <Link
      href="/racha"
      aria-label={`${T.streak.title}: ${plural(streak, T.plurals.days, lang)}`}
      className={`rounded-tag transition-[filter] hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${glass ? 'backdrop-blur-sm' : ''}`}
    >
      <StreakTag days={streak} text={T.rankings.daysShort.replace('{n}', streak.toLocaleString(lang))} glow={false} />
    </Link>
  )
}

export default function MainHeader() {
  const { data: session, status } = useSession()
  const { T } = useLanguage()
  const { activeStreak } = useStreakData()
  const router = useRouter()
  const { tryHandleBack } = useBackRegistry()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

  const streak = activeStreak?.days ?? 0
  // With no platform linked there is nothing to search, sort or count: the
  // bar keeps only the way home and the way to the account. Any platform counts
  // (Xbox only for who may see it, see canUseXbox): a PSN-only account has a library too.
  const user = session?.user
  const hasPlatform = Boolean(
    user?.rausername || user?.steamid || user?.psnaccountid || (user?.xboxxuid && canUseXbox(user.admin)),
  )
  const isHome = pathname === '/'
  const isGameInfo = pathname.startsWith('/gameInfo/')
  const avatarSrc = session?.user?.avatar ?? session?.user?.image ?? null

  const openSearch = useCallback(() => { setInitialQuery(''); setSearchOpen(true) }, [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  // Floating only at the very top; once scrolled it grows to the full width.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    { href: '/wantToPlay', label: T.mainPage.wantToPlay },
    { href: '/playing', label: T.mainPage.playing },
    { href: '/completed', label: T.mainPage.completed },
  ]
  const navItems = [
    { href: '/groups', label: T.groups.title },
    { href: '/following', label: T.following.title },
    { href: '/rankings', label: T.rankings.title },
  ]
  const isStatusActive = statusItems.some(({ href }) => pathname === href)

  return (
    <>
      {/*
        Floating bar: the wrapper keeps the 64px the game heroes are drawn
        under (8px gap + 56px bar), so nothing below has to move.
      */}
      <div className={`sticky top-0 z-40 h-16 shrink-0 pointer-events-none transition-[padding] duration-300 motion-reduce:transition-none ${scrolled ? 'px-0 pt-0' : 'px-2 sm:px-3 pt-2'}`}>
      <header
        className={`pointer-events-auto relative flex items-center gap-2.5 text-text-main px-2.5 backdrop-blur-xl backdrop-saturate-150 ring-1 shadow-lg shadow-black/20 transition-all duration-300 motion-reduce:transition-none ${
          scrolled ? 'h-16 rounded-none' : 'h-14 rounded-card'
        } ${isGameInfo ? 'bg-bg-header/60 ring-ink/10' : 'bg-bg-header/85 ring-ink/[0.08]'}`}
      >
        {/* Left: home + back + nav (desktop) / hamburguesa (mobile) */}
        <div className="flex items-center gap-1 shrink-0 z-10">
          <Link
            href="/"
            aria-label="Home"
            aria-current={isHome ? 'page' : undefined}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-[0.5625rem] shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${isHome ? 'text-accent bg-accent/[0.14]' : 'text-text-secondary hover:text-text-main hover:bg-ink/[0.08]'}`}
          >
            <IconHome className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
          </Link>
          {!isHome && (
            <button
              onClick={() => { if (!tryHandleBack()) router.back() }}
              aria-label="Go back"
              className="inline-flex items-center justify-center w-9 h-9 rounded-[0.5625rem] shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 text-text-secondary hover:text-text-main hover:bg-ink/[0.08]"
            >
              <IconChevronLeft className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
            </button>
          )}

          {/* Desktop nav - visible on md+ */}
          {hasPlatform && (
          <nav className="hidden md:flex items-center ml-1.5" aria-label="Main navigation">
            <StatusNavDropdown
              items={statusItems.map(({ href, label }) => ({
                href: session ? href : '/authPage',
                label,
              }))}
              active={isStatusActive}
              label={T.header.status}
            />
            {navItems.map(({ href, label }) => (
              <NavLink
                key={href}
                href={session ? href : '/authPage'}
                label={label}
                active={pathname === href}
              />
            ))}
          </nav>
          )}

          {/* Hamburger menu - mobile only */}
          {hasPlatform && (
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Menu"
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-[0.5625rem] shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 text-text-secondary hover:text-text-main hover:bg-ink/[0.08]"
          >
            <IconMenu className="w-5 h-5" aria-hidden="true" />
          </button>
          )}
        </div>

        {/* Center: search bar - absolute only on lg+, hidden on smaller */}
        {hasPlatform && (
        <div className="hidden lg:flex flex-[0_1_32.5rem] mx-auto min-w-0">
          <button
            onClick={openSearch}
            aria-label="Search games"
            className={`flex w-full h-11 rounded-control pl-3.5 pr-2 text-sm text-text-secondary text-left transition-[background-color,box-shadow] duration-(--motion-hover) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 items-center gap-2.5 cursor-text ring-1 ring-inset pointer-events-auto ${isGameInfo ? 'bg-ink/10 backdrop-blur-sm ring-ink/20 hover:bg-ink/20' : 'bg-bg-main shadow-[inset_0_2px_4px_rgb(0_0_0/0.22)] ring-ink/[0.08] hover:ring-accent/50'}`}
          >
            <span aria-hidden="true" className="w-1 h-5 shrink-0 bg-accent skew-x-(--slant-line)" />
            <IconSearch className="w-4 h-4 shrink-0" aria-hidden />
            <span>{T.search.placeholder}</span>
          </button>
        </div>
        )}

        {/* Right: search icon (mobile) + streak + user */}
        {/* On lg+ the search bar pushes this to the right; with no platform there is none to push it. */}
        <div className={`flex items-center gap-2.5 shrink-0 ml-auto z-10 ${hasPlatform ? 'lg:ml-0' : ''}`}>
          {/* Search icon - mobile only, to the right */}
          {hasPlatform && (
          <button
            onClick={openSearch}
            aria-label="Search games"
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-[0.5625rem] shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 text-text-secondary hover:text-text-main hover:bg-ink/[0.08]"
          >
            <IconSearch className="w-5 h-5" aria-hidden="true" />
          </button>
          )}

          {session ? (
            <>
              <MainHeaderLevel glass={isGameInfo} />
              <StreakBadge streak={streak} glass={isGameInfo} />
              <Link
                href="/user"
                aria-label={T.sidePanel.userSettings}
                aria-current={pathname === '/user' ? 'page' : undefined}
                className={`flex items-center gap-2.5 pl-3 pr-1 h-10 rounded-tile transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${pathname === '/user' ? 'bg-accent/[0.14] ring-1 ring-inset ring-accent/50' : isGameInfo ? 'bg-ink/10 backdrop-blur-sm hover:bg-ink/20' : 'bg-ink/[0.05] hover:bg-ink/10'}`}
              >
                <span className="text-[0.9375rem] font-bold hidden sm:block text-text-main leading-none">
                  {session.user?.name ?? session.user?.email}
                </span>
                {avatarSrc ? (
                  <Image
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    width={64}
                    height={64}
                    src={avatarSrc}
                    alt=""
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
            <Skeleton radius="circle" className="w-36 h-11" />
          ) : (
            <Button
              href="/authPage"
              size="sm"
            >
              {T.header.signIn}
            </Button>
          )}
        </div>
      </header>
      </div>

      <LazyWhenOpened open={searchOpen}>
        <SearchModal isOpen={searchOpen} onClose={closeSearch} initialQuery={initialQuery} />
      </LazyWhenOpened>
      <LazyWhenOpened open={mobileMenuOpen}>
        <MobileNavModal isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </LazyWhenOpened>
    </>
  )
}
