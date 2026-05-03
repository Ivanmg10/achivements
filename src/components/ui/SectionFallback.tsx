'use client'

import { IconRefresh } from '@tabler/icons-react'

export function SectionFallback({
  error,
  onRefresh,
  children,
}: {
  error: boolean
  onRefresh: () => void
  children: React.ReactNode
}) {
  if (!error) return <>{children}</>
  return (
    <div className="relative flex-1 flex flex-col min-h-[80px]">
      <div className="blur-sm opacity-25 pointer-events-none flex-1 flex flex-col select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <p className="text-[10px] uppercase tracking-widest text-text-secondary">Failed to load</p>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-bg-main border border-accent/30 text-text-main rounded-lg hover:bg-accent/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
        >
          <IconRefresh size={12} />
          Refresh
        </button>
      </div>
    </div>
  )
}
