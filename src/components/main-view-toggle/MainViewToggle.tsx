'use client'

import { IconPin, IconHistory } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useMainView } from '@/context/MainViewContext'

export function MainViewToggle() {
  const { T } = useLanguage()
  const { view, setView } = useMainView()

  return (
    <div role="tablist" className="flex items-center gap-0.5 p-0.5 rounded-full bg-white/5 shrink-0">
      <button
        role="tab"
        aria-selected={view === 'pinned'}
        aria-label={T.pinnedGames.viewPinnedAria}
        onClick={() => setView('pinned')}
        className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
          view === 'pinned'
            ? 'bg-accent text-bg-main'
            : 'text-text-secondary hover:text-text-main hover:bg-white/8'
        }`}
      >
        <IconPin className="w-4 h-4" aria-hidden />
      </button>
      <button
        role="tab"
        aria-selected={view === 'recent'}
        aria-label={T.pinnedGames.viewRecentAria}
        onClick={() => setView('recent')}
        className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
          view === 'recent'
            ? 'bg-accent text-bg-main'
            : 'text-text-secondary hover:text-text-main hover:bg-white/8'
        }`}
      >
        <IconHistory className="w-4 h-4" aria-hidden />
      </button>
    </div>
  )
}
