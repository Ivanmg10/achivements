'use client'

import { useState } from 'react'
import Image from 'next/image'
import { IconExternalLink, IconKey, IconUser } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRaSignupCheck, type RaSignupAccount } from '@/hooks/useRaSignupCheck'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
import RaLogo from '@/components/ra-logo/RaLogo'

const RA_SETTINGS = 'https://retroachievements.org/settings'

/**
 * Signing up with RetroAchievements: the RA username and Web API key, checked
 * with RA (`useRaSignupCheck`), then shown as the account the sign-up will
 * link, with a way to change it or to sign up without it. A form of its own,
 * above the sign-up form, so Enter checks the key.
 */
export default function RegisterUserFormRa({
  account,
  onChange,
  onClose,
  disabled,
}: {
  account: RaSignupAccount | null
  onChange: (account: RaSignupAccount | null) => void
  onClose: () => void
  disabled: boolean
}) {
  const { T } = useLanguage()
  const t = T.registerForm
  const { check, checking, error, clearError } = useRaSignupCheck()
  const [username, setUsername] = useState(account?.username ?? '')
  const [apiKey, setApiKey] = useState(account?.apiKey ?? '')

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !apiKey.trim()) return
    const found = await check(username.trim(), apiKey.trim())
    if (found) onChange(found)
  }

  return (
    <section aria-labelledby="register-ra-title" className="mb-4 rounded-2xl border border-ink/10 p-4 flex flex-col gap-3">
      <h2 id="register-ra-title" className="flex items-center gap-2 text-sm font-semibold text-text-main">
        <RaLogo height={16} />
        {t.raTitle}
      </h2>

      {account ? (
        <div className="flex items-center gap-3">
          <Image src={account.avatar} alt="" width={44} height={44} className="rounded-lg shrink-0" unoptimized />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-main truncate">{account.user}</p>
            <p role="status" className="text-xs text-success">{t.raReady}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-sm text-accent underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {t.raChange}
          </button>
        </div>
      ) : (
        <form onSubmit={handleCheck} noValidate className="flex flex-col gap-3">
          <p className="text-xs text-text-secondary">{t.raLead}</p>
          {error && (
            <p role="alert" className="text-sm text-danger bg-danger/20 border border-danger/40 rounded-xl p-2.5">
              {error}
            </p>
          )}
          <AuthFormField
            label={t.raUsername}
            icon={<IconUser size={18} />}
            value={username}
            onChange={(v) => {
              setUsername(v)
              clearError()
            }}
            autoComplete="off"
            spellCheck={false}
            disabled={checking || disabled}
          />
          <AuthFormField
            label={t.raKey}
            icon={<IconKey size={18} />}
            type="password"
            value={apiKey}
            onChange={(v) => {
              setApiKey(v)
              clearError()
            }}
            autoComplete="off"
            disabled={checking || disabled}
          />
          <details className="text-xs text-text-secondary">
            <summary className="cursor-pointer text-accent rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {t.raWhere}
            </summary>
            <ol className="mt-2 list-decimal pl-5 flex flex-col gap-1">
              {T.welcome.ra.guide.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
            <a
              href={RA_SETTINGS}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 font-semibold text-text-main hover:text-accent"
            >
              {T.welcome.ra.openRa}
              <IconExternalLink size={12} aria-hidden="true" />
            </a>
          </details>
          <button
            type="submit"
            disabled={checking || disabled || !username.trim() || !apiKey.trim()}
            className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-bg-main border border-ink/15 hover:border-accent transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
          >
            {checking ? (
              <>
                <Spinner size={14} />
                {t.raChecking}
              </>
            ) : (
              t.raCheck
            )}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onClose}
        disabled={disabled}
        className="self-center text-xs text-text-secondary hover:text-text-main underline underline-offset-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        {t.raOff}
      </button>
    </section>
  )
}
