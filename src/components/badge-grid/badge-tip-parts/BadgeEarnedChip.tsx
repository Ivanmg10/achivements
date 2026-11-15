'use client'

import { useLanguage } from '@/context/LanguageContext'

/** The "Earned" chip of a badge's tooltip, in the platform's colour, or "Not earned yet" as plain text. */
export default function BadgeEarnedChip({ earned, label, className }: { earned: boolean; label: string; /** The chip's colours (a tint and its text). */ className: string }) {
  const { T } = useLanguage()
  if (!earned) return <span className="text-xs text-text-secondary">{T.achievement.notEarned}</span>
  return <span className={`text-xs px-1.5 py-0.5 rounded-full ${className}`}>{label}</span>
}
