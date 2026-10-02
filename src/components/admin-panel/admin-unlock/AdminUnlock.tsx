import { useState } from 'react'
import { IconLock } from '@tabler/icons-react'
import PasswordInput from '@/components/password-input/PasswordInput'

const MESSAGES: Record<string, string> = {
  'wrong-password': 'That password is incorrect.',
  'too-many-attempts': 'Too many wrong attempts. Wait 15 minutes and try again.',
}

/**
 * The panel's front door: the admin's own password, every 15 minutes. Until
 * then the panel shows nobody's data, so an unattended session gives away
 * nothing.
 */
export default function AdminUnlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [password, setPassword] = useState('')
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
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(MESSAGES[data.error] ?? 'Could not unlock the panel. Try again.')
        return
      }
      setPassword('')
      onUnlocked()
    } catch {
      setError('Could not unlock the panel. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={unlock} className="bg-bg-card rounded-2xl p-5 flex flex-col gap-4 max-w-md">
      <div className="flex items-center gap-2">
        <IconLock size={18} className="text-accent" aria-hidden="true" />
        <h3 className="font-semibold">Unlock the admin panel</h3>
      </div>
      <p className="text-sm text-text-secondary">
        Type your password to see and change other users&apos; accounts. It stays unlocked for 15 minutes.
      </p>
      <PasswordInput id="admin-unlock-password" label="Your password" value={password} onChange={(v) => { setPassword(v); setError(null) }} disabled={loading} />
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!password || loading}
        className="self-start px-4 py-2 bg-accent text-bg-main text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40"
      >
        {loading ? 'Unlocking…' : 'Unlock'}
      </button>
    </form>
  )
}
