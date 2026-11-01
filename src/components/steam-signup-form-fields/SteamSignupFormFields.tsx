'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { IconUser, IconMail, IconArrowRight } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import type { SteamSignupProfile } from '@/hooks/useSteamSignup'
import { checkEmail, checkUsername, USERNAME_MAX, USERNAME_MIN } from '@/utils/authValidation'
import AuthFormField from '@/components/auth-form-field/AuthFormField'
import Spinner from '@/components/main-spinner/Spinner'
import Button from '@/components/ui/Button'

/** The Steam account Steam confirmed, and the username and email it still needs. */
export default function SteamSignupFormFields({
  profile,
  submitting,
  error,
  onSubmit,
}: {
  profile: SteamSignupProfile
  submitting: boolean
  error: string
  onSubmit: (username: string, email: string) => void
}) {
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string }>({})
  const { T } = useLanguage()

  const usernameRule = T.registerForm.usernameRule
    .replace('{min}', String(USERNAME_MIN))
    .replace('{max}', String(USERNAME_MAX))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof fieldErrors = {}
    const name = checkUsername(username)
    if (name === 'empty') next.username = T.registerForm.required
    else if (name === 'shape') next.username = usernameRule
    const address = checkEmail(email)
    if (address === 'empty') next.email = T.registerForm.required
    else if (address === 'shape') next.email = T.passwordReset.emailInvalid
    setFieldErrors(next)
    if (Object.keys(next).length === 0) onSubmit(username.trim(), email.trim())
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4 rounded-tile border border-ink/10 p-3">
        {profile.avatar && (
          <Image src={profile.avatar} alt="" width={48} height={48} className="rounded-box shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs text-text-secondary">{T.steamAuth.steamAccount}</p>
          <p className="font-semibold text-text-main truncate">{profile.persona}</p>
        </div>
      </div>

      <p className="text-sm text-text-secondary mb-4">{T.steamAuth.lead}</p>

      {!profile.isPublic && (
        <p className="mb-4 text-xs text-warning bg-warning/10 border border-warning/30 rounded-tile p-3">
          {T.steam.privateProfileHint}
        </p>
      )}

      {error && (
        <div role="alert" className="mb-4 bg-danger/10 ring-1 ring-inset ring-danger/30 rounded-control p-3">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
        <AuthFormField
          label={T.registerForm.username}
          icon={<IconUser size={18} />}
          value={username}
          onChange={(v) => {
            setUsername(v)
            setFieldErrors((f) => ({ ...f, username: undefined }))
          }}
          hint={usernameRule}
          error={fieldErrors.username}
          autoComplete="username"
          required
          disabled={submitting}
        />

        <AuthFormField
          label={T.passwordReset.email}
          icon={<IconMail size={18} />}
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v)
            setFieldErrors((f) => ({ ...f, email: undefined }))
          }}
          hint={T.passwordReset.emailWhy}
          error={fieldErrors.email}
          autoComplete="email"
          required
          disabled={submitting}
        />

        <Button
          type="submit"
          disabled={submitting}
          size="lg" className="w-full mt-2"
        >
          {submitting ? (
            <>
              <Spinner size={16} />
              {T.steamAuth.creating}
            </>
          ) : (
            <>
              {T.steamAuth.create}
              <IconArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>

      <p className="text-text-secondary text-xs text-center mt-4">{T.steamAuth.noPassword}</p>
      <p className="text-text-secondary text-xs text-center mt-2">
        {T.registerForm.acceptTerms.split(/(\{terms\}|\{privacy\})/).map((part, i) =>
          part === '{terms}' ? (
            <Link key={i} href="/terms" className="text-accent underline underline-offset-2">{T.terms.link}</Link>
          ) : part === '{privacy}' ? (
            <Link key={i} href="/privacy" className="text-accent underline underline-offset-2">{T.privacy.link}</Link>
          ) : (
            part
          ),
        )}
      </p>
    </>
  )
}
