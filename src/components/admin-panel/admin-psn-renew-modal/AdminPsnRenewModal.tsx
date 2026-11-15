'use client'

import { useState } from 'react'
import { IconExternalLink } from '@tabler/icons-react'
import type { NewPsnAccountInput, PsnAccountError, PsnAccountResult, PsnSignInAnswer } from '@/hooks/useAdminPsnAccounts'
import { notify } from '@/lib/notify'
import { formatDate } from '@/utils/dates'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'
import Button from '@/components/ui/Button'
import { Field, fieldClass } from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Notice from '@/components/ui/Notice'
import Select from '@/components/ui/Select'

const SIGN_IN_URL = 'https://www.playstation.com/'
const SSO_COOKIE_URL = 'https://ca.account.sony.com/api/v1/ssocookie'
const WEIGHTS = ['1', '2', '3'].map((value) => ({ value, label: `Weight ${value}` }))

/** Admin panel text is English (exempt from i18n). */
const ERRORS: Record<PsnAccountError, string> = {
  invalid: 'Check the label (letters, digits, spaces and . _ -, up to 32) and the hint (up to 80 characters).',
  'invalid-npsso': 'That is not an NPSSO: it is 64 letters and digits.',
  rejected: 'Sony did not take it. Sign in again in the private window and copy a fresh one.',
  failed: 'Could not reach Sony. Try again.',
  'save-failed': 'Sony took it, but it could not be saved. Try again.',
  'label-taken': 'Another account already has that label.',
  'not-found': 'That account is gone. Close this and reload the list.',
  auth: 'Sony did not take it. Sign in again in the private window and copy a fresh one.',
  'rate-limited': 'Sony asked to wait. Try again in a minute.',
}

const LINK = 'inline-flex items-center gap-0.5 underline hover:text-text-main'

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
      {children}
      <IconExternalLink size={12} aria-hidden="true" />
    </a>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span aria-hidden="true" className="size-6 shrink-0 rounded-full bg-psn/15 text-psn text-xs font-bold flex items-center justify-center">{n}</span>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className="text-sm font-semibold">{`${n}. ${title}`}</span>
        <div className="text-sm text-text-secondary flex flex-col gap-2">{children}</div>
      </div>
    </li>
  )
}

type Props = {
  isOpen: boolean
  onClose: () => void
  /** Renewing an account (its label and hint), or adding one when absent. */
  account?: { id: number; label: string; hint: string | null }
  onAdd: (input: NewPsnAccountInput) => Promise<PsnAccountResult<PsnSignInAnswer>>
  onRenew: (id: number, npsso: string) => Promise<PsnAccountResult<PsnSignInAnswer>>
}

/**
 * "Renew" and "Add account" (#178), step by step: a private window (or a browser profile per account, so the
 * sessions do not mix) signed in to the account by hand, Sony's NPSSO page in that same window, and the value
 * pasted here. The server tests it at once and keeps it only if it works. CheevoVault never signs in to Sony.
 */
export default function AdminPsnRenewModal({ isOpen, onClose, account, onAdd, onRenew }: Props) {
  const [label, setLabel] = useState('')
  const [hint, setHint] = useState('')
  const [weight, setWeight] = useState('1')
  const [npsso, setNpsso] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<PsnAccountError | null>(null)

  const name = account?.label ?? (label.trim() || 'the new account')
  const reminder = account ? account.hint : hint.trim()
  const canSave = npsso.trim().length > 0 && (account !== undefined || label.trim().length > 0) && !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError(null)
    const result = account ? await onRenew(account.id, npsso.trim()) : await onAdd({ label: label.trim(), hint: hint.trim(), weight: Number(weight), npsso: npsso.trim() })
    setSaving(false)
    if (!result.ok) return setError(result.error)
    notify.success(`${name} signed in as ${result.data.onlineId}, valid until ${formatDate(result.data.expiresAt, 'en')}`)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      icon={<PlaystationLogo size={18} />}
      title={account ? `Renew ${account.label}` : 'Add a PlayStation account'}
      hint="You sign in by hand: CheevoVault never signs in to Sony for you."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave} loading={saving}>Test and save</Button>
        </>
      }
    >
      {!account && (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Field label="Label" hint="PSN-2, PSN-3…">
            {(control) => <input {...control} value={label} maxLength={32} onChange={(e) => setLabel(e.target.value)} className={fieldClass()} />}
          </Field>
          <Field label="Hint" hint="Which account it is, for you">
            {(control) => <input {...control} value={hint} maxLength={80} onChange={(e) => setHint(e.target.value)} className={fieldClass()} />}
          </Field>
          <Field label="Weight">
            {(control) => <Select id={control.id} value={weight} onChange={setWeight} options={WEIGHTS} />}
          </Field>
        </div>
      )}
      <ol className="flex flex-col gap-4">
        <Step n={1} title="Open a private window">
          <p>
            Or a browser profile of its own for this account, so the PlayStation sessions do not mix. Sign in at{' '}
            <ExternalLink href={SIGN_IN_URL}>playstation.com</ExternalLink> as <strong className="text-text-main">{name}</strong>
            {reminder ? ` (${reminder})` : ''}.
          </p>
        </Step>
        <Step n={2} title="Open Sony's NPSSO page in that same window">
          <p>
            <ExternalLink href={SSO_COOKIE_URL}>ca.account.sony.com/api/v1/ssocookie</ExternalLink> shows a line with
            &quot;npsso&quot; and a long value.
          </p>
        </Step>
        <Step n={3} title="Paste the npsso value">
          <Field label="NPSSO" hint="Tested at once: saved only if Sony takes it and the account can read its own profile.">
            {(control) => (
              <input
                {...control}
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={npsso}
                onChange={(e) => {
                  setNpsso(e.target.value)
                  setError(null)
                }}
                className={fieldClass({ invalid: error !== null }, 'font-mono')}
              />
            )}
          </Field>
        </Step>
      </ol>
      {error && <Notice tone="danger">{ERRORS[error]}</Notice>}
    </Modal>
  )
}
