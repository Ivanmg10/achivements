'use client'

import { useSyncExternalStore } from 'react'

/** "r g b" of a neutral grey, for an image whose colour cannot be read. */
export const NEUTRAL_TINT = '148 163 184'

const tints = new Map<string, string>()
const pending = new Set<string>()
const listeners = new Set<() => void>()

type Oklab = { l: number; a: number; b: number }

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const linear = (value: number) => {
  const c = value / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function toOklab(r: number, g: number, b: number): Oklab {
  const lr = linear(r), lg = linear(g), lb = linear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function fromOklab({ l, a, b }: Oklab): number[] {
  const lr = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const lg = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const lb = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * lr - 3.3077115913 * lg + 0.2309699292 * lb,
    -1.2684380046 * lr + 2.6097574011 * lg - 0.3413193965 * lb,
    -0.0041960863 * lr - 0.7034186147 * lg + 1.707614701 * lb,
  ].map((value) => {
    const c = value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
    return Math.round(clamp(c, 0, 1) * 255)
  })
}

/** The most colourful hue cluster, capped in OKLCH, as "r g b". */
export function averageTint(data: Uint8ClampedArray): string {
  const clusters = Array.from({ length: 12 }, () => ({ l: 0, a: 0, b: 0, score: 0, n: 0 }))
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]]
    const max = Math.max(pr, pg, pb), min = Math.min(pr, pg, pb)
    if (max < 28 || min > 235) continue
    const colour = toOklab(pr, pg, pb)
    const chroma = Math.hypot(colour.a, colour.b)
    const hue = (Math.atan2(colour.b, colour.a) + 2 * Math.PI) % (2 * Math.PI)
    const cluster = clusters[Math.floor(hue / (2 * Math.PI) * clusters.length)]
    cluster.l += colour.l
    cluster.a += colour.a
    cluster.b += colour.b
    cluster.score += chroma * chroma
    cluster.n++
  }
  const best = clusters.reduce((a, b) => b.score > a.score ? b : a)
  if (best.n === 0) return NEUTRAL_TINT
  const colour = { l: best.l / best.n, a: best.a / best.n, b: best.b / best.n }
  const chroma = Math.hypot(colour.a, colour.b)
  if (chroma < 0.035) return NEUTRAL_TINT
  const cappedChroma = clamp(chroma, 0.075, 0.18)
  return fromOklab({
    l: clamp(colour.l, 0.55, 0.76),
    a: colour.a / chroma * cappedChroma,
    b: colour.b / chroma * cappedChroma,
  }).join(' ')
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
