'use client'

import { useId } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { usePsnPlatinumCompletes } from '@/hooks/usePsnPlatinumCompletes'
import PlaystationLogo from '@/components/playstation-logo/PlaystationLogo'

/**
 * Whether a PSN game with its platinum counts as completed, or only 100% of
 * its trophies does. A switch, saved on the spot in this browser; the state is
 * written out, not just coloured.
 */
export default function UserPsnPlatinumToggle() {
  const { T } = useLanguage()
  const [on, setOn] = usePsnPlatinumCompletes()
  const labelId = useId()

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 -mx-1 py-1.5">
      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-xl bg-bg-card ring-1 ring-ink/[0.06] flex items-center justify-center text-text-secondary">
        <PlaystationLogo size={18} className="text-[#0070d1]" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span id={labelId} className="text-xs text-text-secondary">{T.userData.psnPlatinum}</span>
        <span className="text-sm font-medium">{on ? T.userData.psnPlatinumOn : T.userData.psnPlatinumOff}</span>
      </span>
      <button
        role="switch"
        aria-checked={on}
        aria-labelledby={labelId}
        onClick={() => setOn(!on)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${on ? 'bg-accent' : 'bg-ink/20'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  )
}
