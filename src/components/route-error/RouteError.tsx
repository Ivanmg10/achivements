'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IconAlertTriangle, IconHome, IconRefresh } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { useRise } from '@/hooks/useRise'
import StatusBadge from '@/components/status-badge/StatusBadge'
import RouteErrorCard from '@/components/route-error/route-error-card/RouteErrorCard'
import { STATUS_BUTTON, STATUS_SCREEN } from '@/components/status-badge/statusScreen'

/**
 * What a route group shows when one of its pages throws: the 404's twin in
 * red (an unlock cut short), a retry and the way home, inside the layout
 * instead of the whole app being replaced by global-error. Each group's
 * `error.tsx` renders this; global-error and the sign-in pages (no layout
 * around them) full screen, as the page's <main>.
 *
 * Retry is Next's `retry()`, which asks the server again: `reset()` only
 * re-renders what is already there, so a server error would never recover.
 */
export default function RouteError({
  error,
  retry,
  fullScreen = false,
}: {
  error: Error & { digest?: string }
  retry: () => void
  fullScreen?: boolean
}) {
  const { T } = useLanguage()
  const rise = useRise()
  const Root = fullScreen ? 'main' : 'div'

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Root
      className={`flex flex-col items-center justify-center gap-4 text-center px-6 py-16 text-text-main ${fullScreen ? STATUS_SCREEN.fullScreen : STATUS_SCREEN.inApp}`}
    >
      <motion.div {...rise(0)}>
        <StatusBadge
          tone="danger"
          icon={<IconAlertTriangle size={40} stroke={1.75} />}
          corner={<IconRefresh size={16} stroke={2.25} />}
        />
      </motion.div>
      <motion.div {...rise(0.06)} role="alert" className="flex flex-col items-center gap-2">
        <p className="text-xs font-semibold tracking-[0.14em] uppercase text-danger">{T.errorBoundary.eyebrow}</p>
        <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl leading-[1.1] pr-1 text-balance">{T.errorBoundary.title}</h1>
        <p className="text-sm text-text-secondary max-w-sm">{T.errorBoundary.subtitle}</p>
      </motion.div>
      <motion.div {...rise(0.12)} className="w-full flex justify-center">
        <RouteErrorCard digest={error.digest} />
      </motion.div>
      <motion.div {...rise(0.18)} className="mt-1 flex flex-wrap justify-center gap-2.5">
        <button type="button" onClick={() => retry()} className={STATUS_BUTTON.primary}>
          <IconRefresh size={18} aria-hidden="true" />
          {T.gameInfoPage.retry}
        </button>
        <Link href="/" className={STATUS_BUTTON.secondary}>
          <IconHome size={18} aria-hidden="true" />
          {T.errorBoundary.home}
        </Link>
      </motion.div>
    </Root>
  )
}
