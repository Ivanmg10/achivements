import { useState } from 'react'
import { IconLock } from '@tabler/icons-react'
import PasswordInput from '@/components/password-input/PasswordInput'
import Spinner from '@/components/main-spinner/Spinner'

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
    <form onSubmit={unlock} className="w-full max-w-sm mx-auto flex flex-col items-center text-center gap-4 py-4">
      <span
        aria-hidden="true"
        className="w-14 h-14 rounded-2xl bg-accent/10 ring-1 ring-accent/20 text-accent flex items-center justify-center"
      >
        <IconLock size={26} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">Unlock the admin panel</h3>
        <p className="text-sm text-text-secondary text-balance">
          Type your password to see and change other users&apos; accounts. It stays unlocked for 15 minutes.
        </p>
      </div>
      <div className="w-full text-left">
        <PasswordInput id="admin-unlock-password" label="Your password" value={password} onChange={(v) => { setPassword(v); setError(null) }} disabled={loading} />
      </div>
      {error && <p role="alert" className="w-full text-left text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={!password || loading}
        className="w-full flex items-center justify-center gap-2 py-3 bg-accent text-bg-main text-sm font-bold rounded-xl hover:bg-accent-hover active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-header"
      >
        {loading ? (
          <>
            <Spinner size={16} />
            Unlocking…
          </>
        ) : (
          'Unlock'
        )}
      </button>
    </form>
  )
}
