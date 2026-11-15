'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useStorageValue } from '@/hooks/useStorageValue'

const SAME_SCREEN_PX = 100

/** The saved height, only when it was measured on a screen about this wide (`width:height`). */
export function rememberedHeight(saved: string | null | undefined, width: number): number | null {
  const [w, h] = (saved ?? '').split(':').map(Number)
  return h > 0 && Math.abs(w - width) <= SAME_SCREEN_PX ? h : null
}

/**
 * A block whose height depends on how much the person has (their collection,
 * their friends). It remembers in this browser how tall it ended up, and while
 * it loads it keeps that room, so a return visit lands without a jump. The
 * first visit has nothing to go by, and a hidden block (height 0) saves nothing.
 */
export function RememberedHeight({ id, loading, className, children }: { id: string; loading: boolean; className?: string; children: ReactNode }) {
  const key = `block-height:${id}`
  const ref = useRef<HTMLDivElement>(null)
  const [saved] = useStorageValue(key)
  const height = loading && typeof window !== 'undefined' ? rememberedHeight(saved, window.innerWidth) : null

  useEffect(() => {
    const el = ref.current
    if (loading || !el) return
    const remember = () => {
      if (el.offsetHeight === 0) return
      try {
        window.localStorage.setItem(key, `${window.innerWidth}:${el.offsetHeight}`)
      } catch {
        // Storage blocked: the next visit just has no height to keep.
      }
    }
    remember()
    const observer = new ResizeObserver(remember)
    observer.observe(el)
    return () => observer.disconnect()
  }, [key, loading])

  return (
    <div ref={ref} className={className} style={height ? { minHeight: height } : undefined}>
      {children}
    </div>
  )
}
