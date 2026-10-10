'use client'

import { IconExternalLink } from '@tabler/icons-react'
import MainPageProfileActionsRefresh from './main-page-profile-actions-refresh/MainPageProfileActionsRefresh'

/**
 * The top-right corner of a profile card: the refresh button (only on the
 * signed-in user's own page, where there is something of theirs to refresh)
 * and the link out to the platform, side by side.
 */
export default function MainPageProfileActions({
  href,
  linkLabel,
  ringClass,
  onRefresh,
}: {
  href: string
  linkLabel: string
  /** Tailwind focus-ring colour of the platform, e.g. `focus:ring-[#66c0f4]`. */
  ringClass: string
  onRefresh?: () => void | Promise<void>
}) {
  return (
    <div className="absolute top-3 right-3 flex items-center gap-2">
      {onRefresh && <MainPageProfileActionsRefresh onRefresh={onRefresh} ringClass={ringClass} />}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/8 hover:bg-ink/12 text-text-secondary hover:text-text-main text-xs transition-colors focus:outline-none focus:ring-2 ${ringClass}`}
      >
        <IconExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        {linkLabel}
      </a>
    </div>
  )
}
