'use client'

import { useState } from 'react'
import type { XboxLinkError } from '@/hooks/useXboxLink'
import { useLanguage } from '@/context/LanguageContext'
import XboxLogo from '@/components/xbox-logo/XboxLogo'
import { CONNECT_CLASS } from '@/components/user-page/user-platform-card/UserPlatformCard'
import { fieldClass } from '@/components/ui/Input'

const INPUT_ID = 'xbox-gamertag'

/**
 * The Xbox gamertag box and its Connect button. A failed attempt is shown under
 * the box, since that is what needs fixing; success is the caller's to announce.
 */
export default function UserXboxCardForm({
  onSubmit,
  isLinking,
  error,
}: {
  onSubmit: (gamertag: string) => void
  isLinking: boolean
  error: XboxLinkError | null
}) {
  const [gamertag, setGamertag] = useState('')
  const { T } = useLanguage()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (gamertag.trim()) onSubmit(gamertag.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={INPUT_ID} className="text-xs text-text-secondary">
        {T.xbox.gamertagLabel}
      </label>
      <input
        id={INPUT_ID}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={20}
        placeholder={T.xbox.gamertagPlaceholder}
        value={gamertag}
        onChange={(e) => setGamertag(e.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? `${INPUT_ID}-error` : undefined}
        className={fieldClass({ size: 'sm', invalid: error !== null })}
      />
      {error && (
        <p id={`${INPUT_ID}-error`} role="alert" className="text-xs text-red-400">
          {T.xbox.errors[error]}
        </p>
      )}
      <button type="submit" disabled={isLinking || !gamertag.trim()} className={`${CONNECT_CLASS} disabled:opacity-50`}>
        <XboxLogo size={16} aria-hidden="true" />
        {isLinking ? T.xbox.connecting : T.xbox.connect}
      </button>
    </form>
  )
}
