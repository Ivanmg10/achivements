'use client'

import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'

/**
 * The eye on a secret, unearned achievement: shows its name and text (a
 * spoiler) and hides them again. Pressed state is in `aria-pressed` and the
 * label, not only in the icon.
 */
export default function XboxRevealAchievementButton({
  revealed,
  onToggle,
  size = 16,
  className = '',
}: {
  revealed: boolean
  onToggle: () => void
  size?: number
  className?: string
}) {
  const { T } = useLanguage()
  const Icon = revealed ? IconEyeOff : IconEye
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={revealed}
      aria-label={revealed ? T.xbox.concealAchievement : T.xbox.revealAchievement}
      title={revealed ? T.xbox.concealAchievement : T.xbox.revealAchievement}
      className={`text-text-secondary hover:text-text-main focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success rounded ${className}`}
    >
      <Icon size={size} aria-hidden="true" />
    </button>
  )
}
