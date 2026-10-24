import type { ReactNode } from 'react'

/** A chip of the hero's first row (console, state, missables), in the design's 24 px tag. */
export default function GameHeroChip({ tone = 'neutral', className = '', children }: { tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'custom'; className?: string; children: ReactNode }) {
  const TONES = {
    neutral: 'bg-ink/[0.08] text-text-main',
    info: 'bg-info/[0.14] text-info',
    success: 'bg-success/[0.14] text-success',
    warning: 'bg-warning/[0.16] text-warning',
    danger: 'bg-danger/[0.14] text-danger',
    custom: '',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 h-6 px-[0.5625rem] rounded-[0.375rem] text-xs font-bold whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  )
}
