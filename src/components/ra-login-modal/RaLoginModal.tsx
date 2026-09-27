import { useState } from 'react'
import CommonModal from '../common-modal/CommonModal'
import Spinner from '../main-spinner/Spinner'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'

export default function RaLoginModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  const { update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { T } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !apiKey) return
    setIsLoading(true)
    setError(null)

    try {
      const profileRes = await fetch('/api/getUserProfile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, apiKey }),
      })
      const user = await profileRes.json().catch(() => ({}))
      // A wrong name or key comes back with RA's own message; show that, keep what was typed.
      if (!profileRes.ok || user.message) {
        setError(user.message ?? T.raLoginModal.error)
        return
      }

      const saveRes = await fetch('/api/updateRaUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raUser: user, apiKey }),
      })
      if (!saveRes.ok) throw new Error(`updateRaUser ${saveRes.status}`)

      await update({ raUser: user, raidKey: apiKey } as Parameters<typeof update>[0])

      setUsername('')
      setApiKey('')
      setIsOpen(false)
    } catch (err) {
      console.error('[RaLoginModal]', err)
      setError(T.raLoginModal.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CommonModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className="text-2xl mb-5">{T.raLoginModal.title}</h2>
      <form className="flex flex-col gap-5" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder={T.raLoginModal.username}
          aria-label={T.raLoginModal.username}
          className="rounded-xl bg-bg-main p-3 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            placeholder={T.raLoginModal.apiKey}
            aria-label={T.raLoginModal.apiKey}
            value={apiKey}
            className="rounded-xl bg-bg-main p-3 w-full"
            onChange={(e) => setApiKey(e.target.value)}
          />
          {/* The key is buried in RA's settings, so say exactly where. */}
          <p className="text-xs text-text-secondary">
            {T.connect.raKeyPath}{' '}
            <a
              href="https://retroachievements.org/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {T.connect.raKeyHelp}
            </a>
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        {!isLoading ? (
          <button
            type="submit"
            className="bg-bg-main p-3 rounded-lg hover:scale-[1.03] transition-transform duration-200"
          >
            {T.raLoginModal.signIn}
          </button>
        ) : (
          <button
            disabled
            className="bg-bg-main p-3 rounded-lg flex justify-center items-center"
          >
            <Spinner size={12} />
          </button>
        )}
      </form>
    </CommonModal>
  )
}
