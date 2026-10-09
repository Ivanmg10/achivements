'use client'

import { useState } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { useAdminPsnToken, type PsnTokenError } from '@/hooks/useAdminPsnToken'
import { notify } from '@/lib/notify'

const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'
const INPUT_ID = 'admin-psn-npsso'

/** Admin panel text is English (exempt from i18n). */
const ERRORS: Record<PsnTokenError, string> = {
  'invalid-npsso': 'That is not an NPSSO: it is 64 letters and digits.',
  rejected: 'Sony did not accept it. Sign in again and copy a fresh one.',
  'save-failed': 'Sony accepted it, but it could not be saved. Try again.',
  failed: 'Could not reach Sony. Try again.',
}

/**
 * The app's PlayStation sign-in: how long the NPSSO has left, and where to
 * paste a new one. Sony fixes it at 60 days and offers no way to extend it,
 * so it is renewed here every ~2 months; the admins get an email a week
 * before it runs out.
 */
export default function AdminPsnToken() {
  const { status, loadError, saving, saveError, save, retry } = useAdminPsnToken()
  const [npsso, setNpsso] = useState('')

  const left = status?.daysLeft ?? null
  const tone = left === null ? 'text-text-secondary' : left <= 0 ? 'text-red-400' : left <= 7 ? 'text-warning' : 'text-green-400'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (await save(npsso.trim())) {
      setNpsso('')
      notify.success('PSN sign-in renewed')
    }
  }

  return (
    <section aria-labelledby="admin-psn-title" className="bg-bg-card rounded-2xl p-4 flex flex-col gap-3">
      <h3 id="admin-psn-title" className="flex items-center gap-2 text-sm font-semibold">
        <PlaystationLogo size={16} className="text-[#0070d1]" aria-hidden="true" />
        PlayStation sign-in
      </h3>

      {loadError ? (
        <p role="alert" className="text-sm text-red-400">
          Could not load the PSN status.{' '}
          <button onClick={retry} className="underline hover:text-red-300">
            Retry
          </button>
        </p>
      ) : !status ? (
        <div aria-busy="true" className="h-5 w-48 rounded bg-ink/10 animate-pulse" />
      ) : !status.configured ? (
        <p className="text-sm text-text-secondary">Not set up: PSN pages answer “not configured” until an NPSSO is saved.</p>
      ) : (
        <p className="text-sm">
          <span className={`font-semibold ${tone}`}>
            {left === null ? 'Expiry unknown' : left <= 0 ? 'Expired' : `${left} days left`}
          </span>
          {status.expiresAt && (
            <span className="text-text-secondary"> · until {new Date(status.expiresAt).toLocaleDateString()}</span>
          )}
          {status.updatedBy && (
            <span className="text-text-secondary">
              {' '}
              · set by {status.updatedBy}
              {status.updatedAt && ` on ${new Date(status.updatedAt).toLocaleDateString()}`}
            </span>
          )}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label htmlFor={INPUT_ID} className="text-xs text-text-secondary">
          New NPSSO — sign in at playstation.com with the app&apos;s account, then copy “npsso” from{' '}
          <a href={SSO_COOKIE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline hover:text-text-main">
            this page
            <IconExternalLink size={12} aria-hidden="true" />
          </a>
        </label>
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            id={INPUT_ID}
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={npsso}
            onChange={(e) => setNpsso(e.target.value)}
            aria-invalid={saveError !== null}
            aria-describedby={saveError ? `${INPUT_ID}-error` : undefined}
            className="flex-1 min-w-0 bg-bg-main rounded-xl px-3 py-2 text-sm font-mono outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          />
          <button
            type="submit"
            disabled={saving || !npsso.trim()}
            className="px-4 py-2 bg-accent text-bg-main text-sm font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Checking…' : 'Save'}
          </button>
        </div>
        {saveError && (
          <p id={`${INPUT_ID}-error`} role="alert" className="text-xs text-red-400">
            {ERRORS[saveError]}
          </p>
        )}
      </form>
    </section>
  )
}
