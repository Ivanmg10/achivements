'use client'

import { useState } from 'react'
import AdminXboxGame from './admin-xbox-game/AdminXboxGame'
import { useAdminXbox, type XboxLookupError } from '@/hooks/useAdminXbox'
import Button from '@/components/ui/Button'

const INPUT_ID = 'admin-xbox-gamertag'

/** Admin panel text is English (exempt from i18n). */
const ERRORS: Record<XboxLookupError, string> = {
  'invalid-gamertag': 'That is not a gamertag: up to 15 letters, digits or spaces.',
  'not-found': 'No Xbox account has that gamertag.',
  private: 'That profile hides its games and achievements.',
  'not-configured': 'OPENXBL_API_KEY is not set on this server.',
  unauthorized: 'OpenXBL refused the API key. Check that it is valid and the account is activated.',
  'rate-limited': 'The OpenXBL hourly limit is used up. Try again in a while.',
  failed: 'Could not reach OpenXBL. Try again.',
}

/**
 * Admin-only Xbox explorer: type a gamertag, see its profile, library and any
 * game's achievements. It saves nothing; it is how the OpenXBL integration is
 * tried out (and how its hourly budget is watched) before users can link Xbox.
 */
export default function AdminXbox() {
  const { result, error, loading, lookup } = useAdminXbox()
  const [gamertag, setGamertag] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (gamertag.trim()) void lookup(gamertag.trim())
  }

  return (
    <section aria-labelledby="admin-xbox-title" className="bg-bg-card rounded-2xl p-4 flex flex-col gap-3">
      <h3 id="admin-xbox-title" className="text-sm font-semibold">
        Xbox explorer
      </h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={INPUT_ID} className="text-xs text-text-secondary">
          Gamertag — read through OpenXBL, nothing is saved. Free plan: 150 calls an hour for the whole app.
        </label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            id={INPUT_ID}
            value={gamertag}
            onChange={(e) => setGamertag(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={error === 'invalid-gamertag'}
            aria-describedby={error ? `${INPUT_ID}-error` : undefined}
            className="flex-1 min-w-0 bg-bg-main rounded-xl px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          />
          <Button
            type="submit"
            disabled={loading || !gamertag.trim()}
          >
            {loading ? 'Looking up…' : 'Look up'}
          </Button>
        </div>
        {error && (
          <p id={`${INPUT_ID}-error`} role="alert" className="text-xs text-red-400">
            {ERRORS[error]}
          </p>
        )}
      </form>

      {result && (
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-3 text-sm">
            {result.profile.avatarUrl && (
              <img src={result.profile.avatarUrl} alt="" width={40} height={40} loading="lazy" decoding="async" className="size-10 rounded-full" />
            )}
            <span>
              <span className="font-semibold">{result.profile.gamertag}</span>
              <span className="block text-xs text-text-secondary">
                {result.profile.gamerscore.toLocaleString()} G · {result.profile.tier || 'no tier'} · {result.games.length} games · XUID {result.profile.xuid}
              </span>
            </span>
          </p>
          {result.rateLimit && (
            <p role="status" className="text-xs text-text-secondary">
              OpenXBL calls left this hour: {result.rateLimit.remaining} of {result.rateLimit.limit}
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {result.games.map((game) => (
              <AdminXboxGame key={game.titleId} xuid={result.profile.xuid} game={game} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
