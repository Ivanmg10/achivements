'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useEntrancesOnce } from '@/hooks/useEntrancesOnce'
import { useFontStyle } from '@/hooks/useFontStyle'
import { useHomeLayout } from '@/hooks/useHomeLayout'
import { useLibraryPrefs } from '@/hooks/useLibraryPrefs'
import { useShapeStyle } from '@/hooks/useShapeStyle'
import { SESSION_LOOK_KEY, sessionLook } from '@/utils/sessionLook'

/**
 * Puts the person's shape (`useShapeStyle`) and font (`useFontStyle`) on
 * <html> as `data-shape` and `data-font`, where the tokens read them, and what
 * the skeletons need as `data-home-layout`, `data-library-layout` and
 * `data-session`. Draws nothing. The script in the root layout paints the last
 * choices this browser used before the first frame, so there is no flash.
 */
export default function ShapeSync() {
  const [shape] = useShapeStyle()
  const [font] = useFontStyle()
  const [homeLayout] = useHomeLayout()
  const { layout: libraryLayout } = useLibraryPrefs('')
  const { data: session, status } = useSession()
  const look = status === 'loading' ? undefined : sessionLook(session?.user)
  useEntrancesOnce()

  useEffect(() => {
    const { dataset } = document.documentElement
    dataset.shape = shape
    dataset.font = font
    dataset.homeLayout = homeLayout
    dataset.libraryLayout = libraryLayout
    return () => {
      delete dataset.shape
      delete dataset.font
      delete dataset.homeLayout
      delete dataset.libraryLayout
    }
  }, [shape, font, homeLayout, libraryLayout])

  // Left as it is while the session is being read: the script's value is the best guess until then.
  useEffect(() => {
    if (look === undefined) return
    const { dataset } = document.documentElement
    try {
      if (look) window.localStorage.setItem(SESSION_LOOK_KEY, look)
      else window.localStorage.removeItem(SESSION_LOOK_KEY)
    } catch {
      // Storage blocked: the attribute below still holds for this page.
    }
    if (look) dataset.session = look
    else delete dataset.session
  }, [look])

  return null
}
