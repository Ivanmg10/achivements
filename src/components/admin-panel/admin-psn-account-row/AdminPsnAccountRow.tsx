'use client'

import { useId, useState } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import { type PsnTokenError, type PsnTokenStatus } from '@/hooks/useAdminPsnToken'
import { notify } from '@/lib/notify'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'
import { SURFACE } from '@/components/ui/surface'

const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'

/** Admin panel text is English (exempt from i18n). */
const ERRORS: Record<PsnTokenError, string> = {
  'invalid-npsso': 'That is not an NPSSO: it is 64 letters and digits.',
  rejected: 'Sony did not accept it. Sign in again and copy a fresh one.',
  'save-failed': 'Sony accepted it, but it could not be saved. Try again.',
  failed: 'Could not reach Sony. Try again.',
}

/**
 * One PlayStation app account: who it is, how long its NPSSO has left and until when, who set it and when, and
 * "Renew", which opens the field for a new NPSSO under the row. Sony fixes an NPSSO at 60 days and offers no way to
 * extend it. Today there is one account; the list is drawn as one row per account for the ones to come.
 */
export default function AdminPsnAccountRow({
  name,
  status,
  saving,
  saveError,
  onSave,
}: {
  name: string
  status: PsnTokenStatus
  saving: boolean
  saveError: PsnTokenError | null
  /** Resolves to whether Sony accepted it and it was saved. */
  onSave: (npsso: string) => Promise<boolean>
}) {
  const [open, setOpen] = useState(false)
  const [npsso, setNpsso] = useState('')
  const inputId = useId()

  const left = status.daysLeft
  const tone = left === null ? 'text-text-secondary' : left <= 0 ? 'text-danger' : left <= 7 ? 'text-warning' : 'text-success'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (await onSave(npsso.trim())) {
      setNpsso('')
      setOpen(false)
      notify.success('PSN sign-in renewed')
    }
  }

  return (
    <li className={`${SURFACE} p-4 flex flex-col gap-3`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span aria-hidden="true" className="size-10 shrink-0 rounded-box bg-psn/10 flex items-center justify-center">
          <PlaystationLogo size={18} className="text-psn" />
        </span>
        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
          <span className="font-semibold">{name}</span>
          {!status.configured ? (
            <span className="text-sm text-text-secondary">Not set up: PSN pages answer “not configured” until an NPSSO is saved.</span>
          ) : (
            <span className="text-sm">
              <span className={`font-semibold ${tone}`}>{left === null ? 'Expiry unknown' : left <= 0 ? 'Expired' : `${left} days left`}</span>
              {status.expiresAt && <span className="text-text-secondary"> · until {new Date(status.expiresAt).toLocaleDateString()}</span>}
              {status.updatedBy && (
                <span className="text-text-secondary">
                  {' '}
                  · set by {status.updatedBy}
                  {status.updatedAt && ` on ${new Date(status.updatedAt).toLocaleDateString()}`}
                </span>
              )}
            </span>
          )}
        </div>
        <Button variant={open ? 'quiet' : 'secondary'} size="sm" aria-expanded={open} aria-controls={`${inputId}-form`} onClick={() => setOpen((o) => !o)}>
          {open ? 'Cancel' : status.configured ? 'Renew' : 'Set up'}
        </Button>
      </div>

      {open && (
        <form id={`${inputId}-form`} onSubmit={handleSubmit} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-xs text-text-secondary">
            New NPSSO — sign in at playstation.com with the app&apos;s account, then copy “npsso” from{' '}
            <a href={SSO_COOKIE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline hover:text-text-main">
              this page
              <IconExternalLink size={12} aria-hidden="true" />
            </a>
          </label>
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              id={inputId}
              type="password"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              value={npsso}
              onChange={(e) => setNpsso(e.target.value)}
              aria-invalid={saveError !== null}
              aria-describedby={saveError ? `${inputId}-error` : undefined}
              className={fieldClass({ size: 'sm', invalid: saveError !== null }, 'flex-1 min-w-0 font-mono')}
            />
            <Button type="submit" disabled={saving || !npsso.trim()}>
              {saving ? 'Checking…' : 'Save'}
            </Button>
          </div>
          {saveError && (
            <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">
              {ERRORS[saveError]}
            </p>
          )}
        </form>
      )}
    </li>
  )
}
