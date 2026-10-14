'use client'

import type { KeyboardEvent, RefObject } from 'react'
import Image from 'next/image'
import { IconClock, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { UserSearchResult } from '@/hooks/useUserSearch'
import type { RecentUser } from '@/hooks/useRecentUsers'
import { codeToFlag, findCountry } from '@/utils/countries'
import { PLATFORM_NAME } from '@/utils/gameRef'
import PlatformLogo from '@/components/platform-logo/PlatformLogo'

const OPTION = 'w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-main focus-visible:bg-bg-main transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/70'

function Avatar({ src }: { src: string | null }) {
  return src ? (
    <Image src={src} alt="" width={36} height={36} className="w-9 h-9 rounded-full object-cover shrink-0" unoptimized />
  ) : (
    <span aria-hidden="true" className="w-9 h-9 rounded-full bg-bg-main flex items-center justify-center shrink-0">
      <IconUser className="w-4 h-4 text-text-secondary" />
    </span>
  )
}

/**
 * The users tab of the search: before typing, the profiles opened lately;
 * then the matches, each with picture, country, a line of their bio and the
 * platforms they play on. ↑ and ↓ move through them (↑ from the first goes
 * back to the search box), Enter opens one.
 */
export default function SearchModalUserResults({
  users,
  recent,
  onClearRecent,
  onSelect,
  listRef,
  inputRef,
}: {
  users: { results: UserSearchResult[]; isLoading: boolean; error: boolean; active: boolean }
  recent: RecentUser[]
  onClearRecent: () => void
  onSelect: (user: RecentUser) => void
  /** The list, so the search box can send ↓ into it. */
  listRef: RefObject<HTMLUListElement | null>
  inputRef: RefObject<HTMLInputElement | null>
}) {
  const { T } = useLanguage()

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const options = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('button[data-user-option]')]
    const at = options.indexOf(document.activeElement as HTMLButtonElement)
    e.preventDefault()
    if (e.key === 'ArrowDown') options[Math.min(at + 1, options.length - 1)]?.focus()
    else if (at <= 0) inputRef.current?.focus()
    else options[at - 1].focus()
  }

  if (!users.active) {
    return (
      <>
        {recent.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-4 py-1">
              <h3 className="text-[10px] uppercase tracking-widest text-text-secondary">{T.userSearch.recent}</h3>
              <button
                type="button"
                onClick={onClearRecent}
                className="text-[11px] text-text-secondary hover:text-text-main rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
              >
                {T.userSearch.clearRecent}
              </button>
            </div>
            <ul ref={listRef} onKeyDown={onKeyDown}>
              {recent.map((u) => (
                <li key={u.username}>
                  <button type="button" data-user-option className={OPTION} onClick={() => onSelect(u)}>
                    <Avatar src={u.avatar} />
                    <span className="flex-1 min-w-0 truncate text-sm font-medium text-text-main">{u.username}</span>
                    <IconClock className="w-3.5 h-3.5 text-text-secondary shrink-0" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-text-secondary text-xs text-center py-6 px-4">{T.publicProfile.searchUsersHint}</p>
      </>
    )
  }

  if (users.isLoading) {
    return (
      <div aria-busy="true" className="flex flex-col">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-9 h-9 rounded-full bg-ink/10 animate-pulse motion-reduce:animate-none shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="h-3.5 bg-ink/10 rounded animate-pulse motion-reduce:animate-none w-32" />
              <div className="h-2.5 bg-ink/10 rounded animate-pulse motion-reduce:animate-none w-48" />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (users.error) return <p role="alert" className="text-red-400 text-sm text-center py-8 px-4">{T.publicProfile.userLoadError}</p>
  if (users.results.length === 0) return <p className="text-text-secondary text-sm text-center py-8 px-4">{T.publicProfile.noUserFound}</p>

  return (
    <ul ref={listRef} onKeyDown={onKeyDown} aria-label={T.userSearch.resultsLabel}>
      {users.results.map((u) => {
        const country = u.location ? findCountry(u.location) : null
        const platforms = (['ra', 'steam', 'psn'] as const).filter((p) => u[p])
        return (
          <li key={u.username}>
            <button type="button" data-user-option className={OPTION} onClick={() => onSelect(u)}>
              <Avatar src={u.avatar} />
              <span className="flex flex-col min-w-0 flex-1">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-sm font-medium text-text-main">{u.username}</span>
                  {country && (
                    <span className="text-sm leading-none" role="img" aria-label={country.name}>
                      {codeToFlag(country.code)}
                    </span>
                  )}
                </span>
                {u.description && <span className="text-xs text-text-secondary truncate">{u.description}</span>}
              </span>
              {platforms.length > 0 && (
                <span className="flex items-center gap-1.5 shrink-0">
                  {platforms.map((p) => (
                    <PlatformLogo key={p} source={p} size={12} label={PLATFORM_NAME[p]} />
                  ))}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
