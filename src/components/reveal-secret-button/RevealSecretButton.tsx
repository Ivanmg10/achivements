'use client'

import { IconEye, IconEyeOff } from '@tabler/icons-react'

/**
 * The eye over a secret achievement's badge (PSN's hidden trophies, Xbox's
 * secret achievements): shows its name and text, a spoiler, and hides them
 * again. The state is in `aria-pressed` and the label, not only in the icon.
 */
export default function RevealSecretButton({
  revealed,
  onToggle,
  labels,
  className = '',
}: {
  revealed: boolean
  onToggle: () => void
  /** What it does in each state, read aloud and shown as its tooltip. */
  labels: { reveal: string; conceal: string }
  /** Layout only: its size, its layer, when it shows. */
  className?: string
}) {
  const Icon = revealed ? IconEyeOff : IconEye
  const label = revealed ? labels.conceal : labels.reveal
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={revealed}
      aria-label={label}
      title={label}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-icon bg-bg-card/90 text-text-main flex items-center justify-center focus-ring ${className}`}
    >
      <Icon size={20} aria-hidden="true" />
    </button>
  )
}
