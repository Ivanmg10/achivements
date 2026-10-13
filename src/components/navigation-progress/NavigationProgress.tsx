'use client'

import { useNavigationProgress } from '@/hooks/useNavigationProgress'

/**
 * A thin line along the top of the screen while a page is on its way. Decoration
 * only: the skeleton of the page announces the loading. When the page arrives
 * the line jumps to the end and fades out.
 */
export default function NavigationProgress() {
  const pending = useNavigationProgress()

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className={`h-full bg-accent shadow-[0_0_8px_rgb(var(--accent))] transition-opacity duration-300 ${
          pending
            ? 'opacity-100 animate-[nav-progress_10s_cubic-bezier(0.1,0.7,0.2,1)_forwards] motion-reduce:animate-none'
            : 'w-full opacity-0'
        }`}
      />
    </div>
  )
}
