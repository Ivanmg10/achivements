'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useWhenChanged } from './useWhenChanged'

/** If the page never arrives (an error, a click that went nowhere), stop pretending. */
const GIVE_UP_MS = 15_000

/**
 * True from a click on a link to another page of the site until that page
 * arrives. Any link counts, wherever it is, and it does not matter whether
 * the page was prefetched. A new tab, a download, another site, the same page
 * or a modified click (ctrl, shift…) do not.
 */
export function useNavigationProgress(): boolean {
  const pathname = usePathname()
  const [pending, setPending] = useState(false)

  useWhenChanged([pathname], () => setPending(false))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      setPending(true)
      clearTimeout(timer)
      timer = setTimeout(() => setPending(false), GIVE_UP_MS)
    }

    // Capture: it runs before Next's own handler, which would otherwise be first.
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      clearTimeout(timer)
    }
  }, [])

  return pending
}
