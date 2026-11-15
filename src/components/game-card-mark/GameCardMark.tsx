import type { ReactNode } from 'react'
import type { CoverRing } from '@/types/gameCard'

const TONE: Record<Exclude<CoverRing, 'hardcore'>, string> = {
  'steam-perfect': 'bg-steam-perfect/10 text-steam-perfect',
  platinum: 'bg-platinum/10 text-platinum',
  success: 'bg-success/10 text-success',
}

/** The star chip of a finished game ("Perfect", "Platinum"), in the colour of its cover's ring. */
export default function GameCardMark({ tone, children }: { tone: Exclude<CoverRing, 'hardcore'>; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${TONE[tone]}`}>
      <span aria-hidden="true">★</span> {children}
    </span>
  )
}
