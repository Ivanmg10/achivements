import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useLanguage } from '@/context/LanguageContext'
import { useRaLink } from '@/hooks/useRaLink'
import { notify } from '@/lib/notify'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'

export default function RaLoginModal({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  const { link, isLinking: isLoading, error } = useRaLink()
  const [username, setUsername] = useState('')
  const [apiKey, setApiKey] = useState('')
  const { T } = useLanguage()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!(await link(username, apiKey))) return
    setUsername('')
    setApiKey('')
    notify.success(T.toast.raLinked)
    setIsOpen(false)
  }

  return (
    // Steam and PSN link by name alone: the hint says why RA still asks for the key.
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="md" title={T.raLoginModal.title} hint={T.raLoginModal.whyKey}>
      <form className="flex flex-col gap-5" onSubmit={handleLogin}>
        <input
          type="text"
          placeholder={T.raLoginModal.username}
          aria-label={T.raLoginModal.username}
          className={fieldClass()}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <input
            type="text"
            placeholder={T.raLoginModal.apiKey}
            aria-label={T.raLoginModal.apiKey}
            value={apiKey}
            className={fieldClass()}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {/* The key is buried in RA's settings, so say exactly where. */}
          <p className="text-xs text-text-secondary">
            {T.connect.raKeyPath}{' '}
            <a
              href="https://retroachievements.org/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors rounded focus-ring"
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
        <Button type="submit" variant="secondary" loading={isLoading}>
          {T.raLoginModal.connect}
        </Button>
      </form>
    </Modal>
  )
}
