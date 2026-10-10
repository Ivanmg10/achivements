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
      className={`flex items-center px-2 py-1.5 rounded-lg bg-ink/8 hover:bg-ink/12 text-text-secondary hover:text-text-main transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:hover:bg-ink/8 disabled:hover:text-text-secondary ${ringClass}`}
    >
      <IconRefresh className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />
    </button>
  )
}
