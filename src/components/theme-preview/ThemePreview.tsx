import type { Theme } from '@/types/types'

/**
 * A miniature of the app in one theme: a game card with its cover, title,
 * progress bar and a chip. The tokens resolve against `data-theme` on this
 * element, so it is drawn with the theme's real colours, never a copy of them.
 */
export default function ThemePreview({ theme }: { theme: Theme }) {
  return (
    <div data-theme={theme} aria-hidden="true" className="rounded-lg bg-bg-main p-2.5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-10 rounded-full bg-text-main/80" />
        <div className="h-3 w-3 rounded-full bg-accent" />
      </div>
      <div className="flex gap-2 items-center rounded-md bg-bg-card ring-1 ring-ink/[0.06] p-1.5">
        <div className="h-7 w-7 rounded bg-ink/10 shrink-0" />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <div className="h-1.5 w-4/5 rounded-full bg-text-main/80" />
          <div className="h-1 w-1/2 rounded-full bg-text-secondary/70" />
          <div className="h-1 w-full rounded-full bg-ink/10 overflow-hidden">
            <div className="h-full w-2/3 rounded-full bg-accent" />
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="h-3.5 w-10 rounded bg-accent/20" />
        <div className="h-3.5 w-6 rounded bg-success/25" />
      </div>
    </div>
  )
}
