import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import Input, { Field } from './Input'

/** A labelled password field with a show/hide toggle. */
export default function PasswordInput({
  label,
  value,
  onChange,
  disabled,
  autoComplete = 'current-password',
  hint,
  error,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
  hint?: string
  error?: string
}) {
  const { T } = useLanguage()
  const [show, setShow] = useState(false)

  return (
    <Field label={label} hint={hint} error={error}>
      {(control) => (
        <div className="relative">
          <Input
            {...control}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            autoComplete={autoComplete}
            invalid={!!error}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? T.passwordInput.hide : T.passwordInput.show}
            aria-pressed={show}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-main transition-colors"
            tabIndex={-1}
          >
            {show ? <IconEyeOff size={16} aria-hidden="true" /> : <IconEye size={16} aria-hidden="true" />}
          </button>
        </div>
      )}
    </Field>
  )
}
