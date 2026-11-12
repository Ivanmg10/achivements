'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useAuthSession } from '@/hooks/useAuthSession'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useBackRegistry } from '@/context/BackInterceptContext'
import { useLanguage } from '@/context/LanguageContext'
import { useStreakSummary } from '@/hooks/useStreakSummary'
import { IconHome, IconChevronLeft, IconSearch, IconMenu } from '@tabler/icons-react'
import LazyWhenOpened from '@/components/lazy-when-opened/LazyWhenOpened'
import { Skeleton } from '@/components/ui/Skeleton'
import Avatar from '@/components/ui/Avatar'

// Downloaded the first time it is opened, not with the page.
const SearchModal = dynamic(() => import('@/components/search-modal/SearchModal'), { loading: () => null })
const MobileNavModal = dynamic(() => import('./MobileNavModal'), { loading: () => null })
import StatusNavDropdown from './status-nav-dropdown/StatusNavDropdown'
import MainHeaderLevel from './main-header-level/MainHeaderLevel'
import { plural } from '@/utils/utils'
import { canUseXbox } from '@/utils/xboxAccess'
import Button from '@/components/ui/Button'
import StreakTag from '@/components/ui/StreakTag'
import { TabMark } from '@/components/ui/Tabs'
import { MARK } from '@/components/ui/shape'

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`relative tap-target inline-flex items-center gap-1 h-10 px-3 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors cursor-pointer focus-ring focus-visible:rounded-chip ${active ? 'text-text-main' : 'text-text-secondary hover:text-text-main'}`}
    >
      <TabMark on={active} />
      {label}
    </Link>
  )
}

/**
 * The way to the streak page, always there: the current streak in days, or a
 * dimmed 0 when there is none, so the page can still be reached to look back.
 * While it is first read (`null`), the tag's room in grey and no number.
 */
function StreakBadge({ streak, glass }: { streak: number | null; glass?: boolean }) {
  const { T, lang } = useLanguage()
  return (
    <Link
      href="/racha"
      aria-label={streak === null ? T.streak.title : `${T.streak.title}: ${plural(streak, T.plurals.days, lang)}`}
      aria-busy={streak === null || undefined}
      className={`relative tap-target rounded-tag transition-[filter] hover:brightness-125 focus-ring ${glass ? 'backdrop-blur-sm' : ''}`}
    >
      <StreakTag
        days={streak ?? 0}
        // While loading, the room of "00 d", unseen.
        text={T.rankings.daysShort.replace('{n}', streak === null ? '00' : streak.toLocaleString(lang))}
        loading={streak === null}
        glow={false}
      />
    </Link>
  )
}

export default function MainHeader() {
  const { data: session, status } = useAuthSession()
  const { T } = useLanguage()
  const { streak } = useStreakSummary()
  const router = useRouter()
  const { tryHandleBack } = useBackRegistry()
  const pathname = usePathname()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)

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
      if (e.key === '/') e.preventDefault()
      setInitialQuery(e.key === '/' ? '' : e.key)
      setSearchOpen(true)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchOpen, hasPlatform])

  const statusItems = [
    { href: '/wantToPlay', label: T.mainPage.wantToPlay },
    { href: '/playing', label: T.mainPage.playing },
    { href: '/completed', label: T.mainPage.completed },
    { href: '/allGames', label: T.mainPage.allGames },
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
        On a screen held sideways (short: 500px tall or less, the AYN Thor) it
        scrolls away with the page instead of keeping a fifth of the screen (#115).
      */}
      <div className={`sticky short:relative top-0 z-40 h-16 shrink-0 pointer-events-none transition-[padding] duration-300 motion-reduce:transition-none ${scrolled ? 'px-0 pt-0' : 'px-2 sm:px-3 pt-2'}`}>
      <header
        className={`pointer-events-auto relative flex items-center gap-2.5 text-text-main px-2.5 backdrop-blur-xl backdrop-saturate-150 ring-1 shadow-lg shadow-black/20 transition-all duration-300 motion-reduce:transition-none ${
          scrolled ? 'h-16 rounded-none' : 'h-14 rounded-card'
        } ${isGameInfo ? 'bg-bg-header/60 ring-ink/10' : 'bg-bg-header/85 ring-ink/[0.08]'}`}
      >
        {/* Left: home + back + nav (desktop) / hamburguesa (mobile) */}
        <div className="flex items-center gap-1 any-pointer-coarse:gap-2 shrink-0 z-10">
          <Link
            href="/"
            aria-label={T.header.home}
            aria-current={isHome ? 'page' : undefined}
            className={`relative tap-target inline-flex items-center justify-center w-9 h-9 rounded-icon shrink-0 transition-colors cursor-pointer focus-ring ${isHome ? 'text-accent bg-accent/[0.14]' : 'text-text-secondary hover:text-text-main hover:bg-ink/[0.08]'}`}
          >
            <IconHome className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
          </Link>
          {!isHome && (
            <button
              onClick={() => { if (!tryHandleBack()) router.back() }}
              aria-label={T.header.goBack}
              className="relative tap-target inline-flex items-center justify-center w-9 h-9 rounded-icon shrink-0 transition-colors cursor-pointer focus-ring text-text-secondary hover:text-text-main hover:bg-ink/[0.08]"
            >
              <IconChevronLeft className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
            </button>
          )}

          {/* Desktop nav from lg: below it the bar ran off the right edge (800 px, the AYN Thor; #115) */}
          {hasPlatform && (
          <nav className="hidden lg:flex items-center ml-1.5" aria-label={T.header.mainNav}>
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
            aria-label={T.header.menu}
            className="lg:hidden relative tap-target inline-flex items-center justify-center w-9 h-9 rounded-icon shrink-0 transition-colors cursor-pointer focus-ring text-text-secondary hover:text-text-main hover:bg-ink/[0.08]"
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
            className={`flex w-full h-11 rounded-field pl-3.5 pr-2 text-sm text-text-secondary text-left transition-[background-color,box-shadow] duration-(--motion-hover) focus-ring items-center gap-2.5 cursor-text ring-1 ring-inset pointer-events-auto ${isGameInfo ? 'bg-ink/10 backdrop-blur-sm ring-ink/20 hover:bg-ink/20' : 'bg-bg-main shadow-sunken ring-ink/[0.08] hover:ring-accent/50'}`}
          >
            <span aria-hidden="true" className={`${MARK} shrink-0 text-xl font-extrabold leading-none text-accent`} />
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
            aria-label={T.search.placeholder}
            className="lg:hidden relative tap-target inline-flex items-center justify-center w-9 h-9 rounded-icon shrink-0 transition-colors cursor-pointer focus-ring text-text-secondary hover:text-text-main hover:bg-ink/[0.08]"
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
                className={`relative isolate tap-target flex items-center gap-2.5 pl-3.5 pr-1.5 h-10 before:content-[''] before:absolute before:inset-0 before:-z-10 before:rounded-nav before:transition-colors focus-visible:outline-none focus-visible:before:ring-2 focus-visible:before:ring-accent/70 ${pathname === '/user' ? 'before:bg-accent/[0.14] before:ring-1 before:ring-inset before:ring-accent/50' : isGameInfo ? 'before:bg-ink/10 before:backdrop-blur-sm hover:before:bg-ink/20' : 'before:bg-ink/[0.05] hover:before:bg-ink/10'}`}
              >
                <span className="text-[0.9375rem] font-bold hidden sm:block text-text-main leading-none">
                  {session.user?.name ?? session.user?.email}
                </span>
                <Avatar src={avatarSrc} name={session.user?.name ?? session.user?.email ?? '?'} size={32} />
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
