'use client'

import { useSyncExternalStore } from 'react'

/** "r g b" of a neutral grey, for an image whose colour cannot be read. */
export const NEUTRAL_TINT = '148 163 184'

const tints = new Map<string, string>()
const pending = new Set<string>()
const listeners = new Set<() => void>()

/** The image's average colour, a bit livelier, as "r g b"; skips near-black and near-white pixels. */
export function averageTint(data: Uint8ClampedArray): string {
  let r = 0, g = 0, b = 0, n = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]]
    const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb)
    if (max < 28 || min > 235) continue
    // Colourful pixels count more, so a grey border does not wash the game's colour out.
    const w = 1 + (max - min) / 64
    r += pr * w; g += pg * w; b += pb * w; n += w
  }
  if (n === 0) return NEUTRAL_TINT
  return [r, g, b].map((v) => Math.round(Math.min(255, (v / n) * 1.1))).join(' ')
}

function read(src: string) {
  if (tints.has(src) || pending.has(src) || typeof window === 'undefined') return
  pending.add(src)
  const done = (tint: string) => {
    tints.set(src, tint)
    pending.delete(src)
    listeners.forEach((l) => l())
  }
  const img = new window.Image()
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 12
      const ctx = canvas.getContext('2d')
      if (!ctx) return done(NEUTRAL_TINT)
      ctx.drawImage(img, 0, 0, 12, 12)
      done(averageTint(ctx.getImageData(0, 0, 12, 12).data))
    } catch {
      done(NEUTRAL_TINT)
    }
  }
  img.onerror = () => done(NEUTRAL_TINT)
  // Read through this site, so the canvas may read it whatever the image host allows.
  img.src = src.startsWith('data:') ? src : `/api/image-proxy?url=${encodeURIComponent(src)}`
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * A game's colour from its art, for the card around it ("r g b", or null while
 * it is read). Read once per image for the whole page.
 */
export function useImageTint(src: string | null | undefined): string | null {
  if (src) read(src)
  return useSyncExternalStore(
    subscribe,
    () => (src ? tints.get(src) ?? null : null),
    () => null,
  )
}
