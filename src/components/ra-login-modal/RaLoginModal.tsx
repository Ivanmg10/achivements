import { useState } from 'react'
import CommonModal from '../common-modal/CommonModal'
import Spinner from '../main-spinner/Spinner'
import { useLanguage } from '@/context/LanguageContext'
import { useRaLink } from '@/hooks/useRaLink'
import { notify } from '@/lib/notify'
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
    <CommonModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
      <h2 className="text-2xl mb-2">{T.raLoginModal.title}</h2>
      {/* Steam and PSN link by name alone; say why RA still asks for the key. */}
      <p className="text-sm text-text-secondary mb-5">{T.raLoginModal.whyKey}</p>
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
