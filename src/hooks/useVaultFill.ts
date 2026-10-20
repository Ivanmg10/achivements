import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/context/LanguageContext'
import { notify } from '@/lib/notify'
import type { FillAnswer, FillStatus } from '@/lib/scoreRefresh'
import type { GameSource } from '@/types/steam'
import { levelOf, tierOf } from '@/utils/vaultLevel'

/** Polling while a pass runs, and the waits between passes. */
const POLL_MS = 2_500
const NEXT_PASS_MS = 1_000
const BUSY_ELSEWHERE_MS = 5_000
/** A ceiling on passes per page load; whatever is left goes on at the next visit. */
const MAX_PASSES = 30

const NAMES: Record<GameSource, string> = { ra: 'RetroAchievements', steam: 'Steam', psn: 'PlayStation', xbox: 'Xbox' }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function call(method: 'GET' | 'POST'): Promise<FillAnswer | FillStatus | null | undefined> {
  try {
    const res = await fetch('/api/rankings/fill', { method })
    if (!res.ok) throw new Error(`rankings/fill ${res.status}`)
    return (await res.json()) as FillAnswer | FillStatus | null
  } catch (err) {
    console.error('[useVaultFill]', method, err)
    return undefined
  }
}

/**
 * Drives the signed-in user's Vault Points fill: asks for one pass after
 * another (each up to ~90 s on the server) until every platform is read,
 * polls how far it has got while a pass runs, and says when the points are
 * ready or a platform could not be read. Starts again when an account is
 * linked. `version` grows after every pass that ran, for whatever shows points.
 */
export function useVaultFill() {
  const { status: auth, data: session } = useSession()
  const { T } = useLanguage()
  const [status, setStatus] = useState<FillStatus | null>(null)
  const [version, setVersion] = useState(0)
  // The texts for the toasts, kept current without restarting the fill when the language changes.
  const textRef = useRef(T)
  useEffect(() => {
    textRef.current = T
  }, [T])

  const user = session?.user
  const linked = user ? [user.raLinked, user.steamid, user.psnaccountid, user.xboxxuid].join('|') : ''

  useEffect(() => {
    if (auth !== 'authenticated') return
    let alive = true
    let poll: ReturnType<typeof setInterval> | null = null

    const announce = (answer: FillAnswer) => {
      const t = textRef.current
      if (!answer.ran) return
      for (const [source, p] of Object.entries(answer.platforms)) {
        if (p?.state === 'error') notify.error(t.toast.vaultFailed.replace('{platform}', NAMES[source as GameSource]))
      }
      if (answer.finished) {
        const level = levelOf(answer.points)
        notify.success(t.toast.vaultReady.replace('{level}', `${t.rankings.level.replace('{n}', String(level))} · ${t.rankings.tiers[tierOf(level)]}`))
      }
    }

    async function loop() {
      for (let pass = 0; pass < MAX_PASSES && alive; pass++) {
        poll = setInterval(() => {
          if (document.visibilityState !== 'visible') return
          call('GET').then((s) => {
            if (alive && s) setStatus(s)
          })
        }, POLL_MS)
        const answer = await call('POST')
        if (poll) clearInterval(poll)
        if (!alive) return
        // A failed request ends this page's fill; the heartbeat and the next visit pick it up.
        if (answer === undefined) return
        if (answer) setStatus(answer)
        if (answer && 'ran' in answer && answer.ran) {
          setVersion((v) => v + 1)
          announce(answer)
        }
        if (answer?.complete) return
        await sleep(answer && !answer.running ? NEXT_PASS_MS : BUSY_ELSEWHERE_MS)
      }
    }
    loop()

    return () => {
      alive = false
      if (poll) clearInterval(poll)
    }
  }, [auth, linked])

  return { status, version }
}
