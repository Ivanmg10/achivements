import type { ReactNode } from 'react'

/** A streak page card's head: its title, and a quiet line of what it shows on the right. */
export default function StreakSectionHead({ id, title, aside }: { id: string; title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-x-4 gap-y-1 flex-wrap">
      <h2 id={id} className="text-[1.0625rem] font-bold text-text-main">{title}</h2>
      {aside && <p className="text-[0.8125rem] text-text-secondary">{aside}</p>}
    </div>
  )
}
