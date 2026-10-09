'use client'

import { useState } from 'react'
import type { PsnError } from '@/hooks/usePsnLink'
import { useLanguage } from '@/context/LanguageContext'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { CONNECT_CLASS } from '@/components/user-page/user-platform-card/UserPlatformCard'

const INPUT_ID = 'psn-online-id'

/**
 * The PSN online ID box and its Connect button. A failed attempt is shown
 * under the box, since that is what needs fixing; success is the caller's to
 * announce.
 */
export default function UserPsnCardForm({
  onSubmit,
  isLinking,
  error,
}: {
  onSubmit: (username: string) => void
  isLinking: boolean
  error: PsnError | null
}) {
  const [username, setUsername] = useState('')
  const { T } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim()) onSubmit(username.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={INPUT_ID} className="text-xs text-text-secondary">
        {T.psn.usernameLabel}
      </label>
      <input
        id={INPUT_ID}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={16}
        placeholder={T.psn.usernamePlaceholder}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? `${INPUT_ID}-error` : undefined}
        className="rounded-xl bg-bg-main px-3 py-2 w-full text-sm"
      />
      {error && (
        <p id={`${INPUT_ID}-error`} role="alert" className="text-xs text-red-400">
          {T.psn.errors[error]}
        </p>
      )}
      <button type="submit" disabled={isLinking || !username.trim()} className={`${CONNECT_CLASS} disabled:opacity-50`}>
        <PlaystationLogo size={16} aria-hidden="true" />
        {isLinking ? T.psn.connecting : T.psn.connect}
      </button>
    </form>
  )
}
