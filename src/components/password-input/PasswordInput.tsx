import { useState } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/** A labelled password field with a show/hide toggle. */
export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete = 'current-password',
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoComplete?: string
}) {
  const { T } = useLanguage()
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-text-secondary uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          className="bg-bg-main rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-accent w-full pr-10"
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
    </div>
  )
}
