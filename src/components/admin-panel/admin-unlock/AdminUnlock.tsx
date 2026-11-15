import { useState } from 'react'
import PasswordInput from '@/components/ui/PasswordInput'
import Button from '@/components/ui/Button'
import AdminUnlockRecovery from '@/components/admin-panel/admin-unlock-recovery/AdminUnlockRecovery'
import AdminUnlockTotp, { type TotpSetup } from '@/components/admin-panel/admin-unlock-totp/AdminUnlockTotp'

const MESSAGES: Record<string, string> = {
  'wrong-password': 'That password is incorrect.',
  'wrong-code': 'That code is not right. Check your authenticator and try again.',
  'too-many-attempts': 'Too many wrong attempts. Wait 15 minutes and try again.',
}

/**
 * The panel's front door: the admin's own password and a one-time code, every
 * 15 minutes. Until then the panel shows nobody's data, so an unattended session
 * gives away nothing. The first time, it also sets the authenticator up. Its title and lock
 * are the dialog's head (`AdminPanelModal`): this is only the step's body.
 */
export default function AdminUnlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [askCode, setAskCode] = useState(false)
  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const [recovery, setRecovery] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const unlock = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(code ? { password, code } : { password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data.error === 'totp-required' || data.error === 'totp-setup') {
          setAskCode(true)
          if (data.key) setSetup({ key: data.key, uri: data.uri })
          if (data.wrong) setError(MESSAGES['wrong-code'])
          return
        }
        setError(MESSAGES[data.error] ?? 'Could not unlock the panel. Try again.')
        return
      }
      setPassword('')
      setCode('')
      if (data.recoveryCodes?.length) setRecovery(data.recoveryCodes)
      else onUnlocked()
    } catch {
      setError('Could not unlock the panel. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (recovery) return <AdminUnlockRecovery codes={recovery} onDone={onUnlocked} />

  return (
    <form onSubmit={unlock} className="w-full flex flex-col gap-4">
      <p className="text-sm text-text-secondary">
        Type your password and a code to see and change other users&apos; accounts. It stays unlocked for 15 minutes.
      </p>
      <PasswordInput label="Your password" value={password} onChange={(v) => { setPassword(v); setError(null) }} disabled={loading} />
      {askCode && <AdminUnlockTotp setup={setup} code={code} onChange={(v) => { setCode(v); setError(null) }} disabled={loading} />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="submit" disabled={!password} loading={loading} className="self-end">
        {loading ? 'Unlocking…' : 'Unlock'}
      </Button>
    </form>
  )
}
