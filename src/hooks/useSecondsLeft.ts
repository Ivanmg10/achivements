import { useEffect, useState } from 'react'

/** Whole seconds until `until` (ms), ticking once a second while it is ahead; 0 once it has passed or with none. */
export function useSecondsLeft(until: number | null | undefined): number {
  const [now, setNow] = useState(() => Date.now())
  const ahead = typeof until === 'number' && until > now
  useEffect(() => {
    if (!ahead) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [ahead])
  return ahead ? Math.ceil((until - now) / 1000) : 0
}
