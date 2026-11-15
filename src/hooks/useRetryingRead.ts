import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { fetchWithRetry, scheduleRetry } from '@/lib/fetchWithRetry'
import { keepAnswer, lastAnswer } from '@/lib/lastAnswers'
import { useWhenChanged } from '@/hooks/useWhenChanged'

export type RetryingRead<T> = {
  /** The last good answer: kept through a failure, dropped when the URL or `keepFor` changes. */
  data: T | null
  /** Optimistic edits (a pin taken out, a new order) go through here. */
  setData: Dispatch<SetStateAction<T | null>>
  isLoading: boolean
  error: boolean
  /** The HTTP status of the failure that ended the read, when there was one (403: RA refused the key). */
  errorStatus?: number
  /** Asks again from scratch: the data, the error and the retries start over. */
  refetch: () => void
}

type Options<T> = {
  /** What a good answer looks like; null fails the read, and it is retried. A function made once, not per render. */
  parse: (data: unknown) => T | null
  /** Whose answer lastAnswers keeps, so coming back paints it at once while it is read again. */
  keepFor?: string
  /** Attempts per round of fetchWithRetry (its default when left out). */
  attempts?: number
}

type Settled = { key: string; failed: boolean; status?: number }

/**
 * A GET that retries in the background (scheduleRetry) until it answers or gives up,
 * as every data hook needs. `url` null asks for nothing (signed out, not linked, not
 * wanted yet). A new URL, `keepFor` or a refetch is a new read; an older one's answer
 * is dropped.
 */
export function useRetryingRead<T>(url: string | null, { parse, keepFor, attempts }: Options<T>): RetryingRead<T> {
  const [data, setData] = useState<T | null>(null)
  const [settled, setSettled] = useState<Settled | null>(null)
  const [reload, setReload] = useState(0)
  const key = `${reload}:${url}`

  useWhenChanged([url, keepFor], () => {
    const shown = url ? lastAnswer<T>(keepFor, url) : undefined
    setData(shown ?? null)
    setSettled(shown === undefined ? null : { key, failed: false })
  })

  useEffect(() => {
    if (!url) return
    const target = url
    let current = true
    const attempt = { current: 0 }
    const timer: { current: ReturnType<typeof setTimeout> | undefined } = { current: undefined }
    const readKey = `${reload}:${url}`

    const fail = (err?: unknown) => {
      if (!current || scheduleRetry(attempt, timer, load, err)) return
      console.error('[useRetryingRead]', target, err ?? 'unexpected answer')
      setSettled({ key: readKey, failed: true, status: (err as { status?: number } | undefined)?.status })
    }
    function load() {
      const request = attempts ? fetchWithRetry(target, attempts) : fetchWithRetry(target)
      request
        .then((raw) => {
          if (!current) return
          const parsed = parse(raw)
          if (parsed === null) return fail()
          keepAnswer(keepFor, target, parsed)
          setData(parsed)
          setSettled({ key: readKey, failed: false })
          attempt.current = 0
        })
        .catch(fail)
    }

    load()
    return () => {
      current = false
      clearTimeout(timer.current)
    }
  }, [url, reload, parse, keepFor, attempts])

  const refetch = useCallback(() => {
    setData(null)
    setReload((r) => r + 1)
  }, [])

  const answered = url !== null && settled?.key === key
  const failed = answered && settled.failed
  return { data, setData, isLoading: url !== null && !answered, error: failed, errorStatus: failed ? settled.status : undefined, refetch }
}
