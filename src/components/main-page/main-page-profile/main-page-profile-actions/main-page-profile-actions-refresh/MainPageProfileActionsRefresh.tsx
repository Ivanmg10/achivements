'use client'

import { useEffect, useRef, useState } from 'react'
import { IconRefresh } from '@tabler/icons-react'
import { useLanguage } from '@/context/LanguageContext'
import { markRefresh } from '@/lib/refreshMark'
import { notify } from '@/lib/notify'

/** After a refresh the button rests this long; the server also refuses to refetch anything under a minute old. */
const COOLDOWN_MS = 30_000

/**
 * Asks for fresh data: marks the next requests (see refreshMark), then runs the
 * platform's own refetches. Icon only, sized and ringed like the "view on" link
 * beside it. A refresh that fails says so and can be tried again at once.
 */
export default function MainPageProfileActionsRefresh({
  onRefresh,
  ringClass,
}: {
  onRefresh: () => void | Promise<void>
  ringClass: string
}) {
  const { T } = useLanguage()
  const [busy, setBusy] = useState(false)
  const [resting, setResting] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleClick = async () => {
    setBusy(true)
    markRefresh()
    try {
      await onRefresh()
      setResting(true)
      timer.current = setTimeout(() => setResting(false), COOLDOWN_MS)
    } catch (err) {
      console.error('[refresh]', err)
      notify.error(T.profileRa.refreshFailed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || resting}
      aria-label={T.profileRa.refreshData}
      title={T.profileRa.refreshData}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-[0.5625rem] text-text-secondary hover:text-text-main hover:bg-ink/[0.08] transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-text-secondary ${ringClass}`}
    >
      <IconRefresh className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
    </button>
  )
}
