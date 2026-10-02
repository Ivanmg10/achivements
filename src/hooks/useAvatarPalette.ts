import { useEffect, useState } from 'react'
import { dominantColors, Rgb } from '@/utils/utils'
import { isUploadedAvatar } from '@/lib/avatarImage'

/** Read small: two colours do not need more than 32×32 pixels. */
const SAMPLE = 32

/**
 * The two main colours of the user's avatar, read from its pixels. Only for
 * an uploaded avatar: it is served from this site, so the browser lets the
 * page read it. A pasted link from another host usually cannot be read, so
 * for those (and if anything fails) this is null and the caller falls back.
 */
export function useAvatarPalette(src: string | null | undefined): Rgb[] | null {
  const [palette, setPalette] = useState<{ src: string; colors: Rgb[] } | null>(null)

  useEffect(() => {
    if (!src || !isUploadedAvatar(src)) return
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = SAMPLE
        canvas.height = SAMPLE
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE)
        const colors = dominantColors(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data)
        if (!cancelled && colors.length) setPalette({ src, colors })
      } catch (err) {
        console.error('[useAvatarPalette]', err)
      }
    }
    img.onerror = () => console.error('[useAvatarPalette] could not load', src)
    img.src = src
    return () => {
      cancelled = true
    }
  }, [src])

  // Tied to the picture it was read from: a new avatar never shows the old colours.
  return palette && palette.src === src ? palette.colors : null
}
