'use client'

import { useState } from 'react'
import type { SteamLinkError } from '@/hooks/useSteamLink'
import { useLanguage } from '@/context/LanguageContext'
import SteamLogo from '@/components/steam-logo/SteamLogo'
import { CONNECT_CLASS } from '@/components/user-page/user-platform-card/UserPlatformCard'

const INPUT_ID = 'steam-profile'

/**
 * The Steam box (custom URL name, profile link or SteamID64) and its Connect
 * button, like the PSN one. A failed attempt is shown under the box, since
 * that is what needs fixing; success is the caller's to announce.
 */
export default function UserSteamCardForm({
  onSubmit,
  isLinking,
  error,
}: {
  onSubmit: (query: string) => void
  isLinking: boolean
  error: SteamLinkError | null
}) {
  const [query, setQuery] = useState('')
  const { T } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) onSubmit(query.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={INPUT_ID} className="text-xs text-text-secondary">
        {T.steamLink.label}
      </label>
      <input
        id={INPUT_ID}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
        placeholder={T.steamLink.placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? `${INPUT_ID}-error` : undefined}
        className="rounded-xl bg-bg-main px-3 py-2 w-full text-sm"
      />
      {error && (
        <p id={`${INPUT_ID}-error`} role="alert" className="text-xs text-red-400">
          {T.steamLink.errors[error]}
        </p>
      )}
      <button type="submit" disabled={isLinking || !query.trim()} className={`${CONNECT_CLASS} disabled:opacity-50`}>
        <SteamLogo size={16} aria-hidden="true" />
        {isLinking ? T.steamLink.connecting : T.userData.steamConnect}
      </button>
    </form>
  )
}
