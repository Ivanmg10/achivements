'use client'

import { ReactNode, useState } from 'react'
import Button from '@/components/ui/Button'
import { fieldClass } from '@/components/ui/Input'

/**
 * The box a platform linked by name is typed into (a PSN online ID, an Xbox
 * gamertag) and its Connect button. A failed attempt is shown under the box,
 * since that is what needs fixing; success is the caller's to announce.
 */
export default function UserPlatformLinkForm({
  id,
  label,
  placeholder,
  maxLength,
  logo,
  connect,
  connecting,
  onSubmit,
  isLinking,
  error,
}: {
  /** The input's id, unique on the page. */
  id: string
  label: string
  placeholder: string
  maxLength: number
  logo: ReactNode
  connect: string
  connecting: string
  onSubmit: (name: string) => void
  isLinking: boolean
  /** Why the last attempt failed, in words; null when it did not. */
  error: string | null
}) {
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) onSubmit(name.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs text-text-secondary">
        {label}
      </label>
      <input
        id={id}
        type="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={maxLength}
        placeholder={placeholder}
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-invalid={error !== null}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClass({ size: 'sm', invalid: error !== null })}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isLinking || !name.trim()}>
        {logo}
        {isLinking ? connecting : connect}
      </Button>
    </form>
  )
}
