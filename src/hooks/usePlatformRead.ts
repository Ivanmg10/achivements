import { useCallback, useEffect, useRef, useState } from 'react'
import { useWhenChanged } from '@/hooks/useWhenChanged'
import { fetchShared } from '@/lib/fetchShared'

type Outcome<T, E> = { data: T } | { error: E }

type Spec<T, E> = {
  /** What a non-2xx answer is, as the platform's `*ErrorFrom` reads it. */
  errorFrom: (res: Response) => Promise<E>
  /** What a network failure or an unexpected body is. Default: the string 'failed'. */
  failure?: (err: unknown) => E
  /** The body as the hook's data; throw for a shape it does not expect. */
  parse?: (body: unknown) => T
  /** For the console: which read failed. */
  tag: string
}

/**
 * One GET of a platform read for one reader: its data, why it failed, and `retry` (the handler asks
 * again). `url` is the whole read, subject and language included, and null reads nothing; a new url
 * starts over. It asks once per url — the effect only starts the fetch and the answer is applied in the
 * `.then` — through `fetchShared`, so readers of the same url share the request while it is in flight.
 * A platform with an hourly budget (Xbox) therefore sees the same calls as before this hook existed.
 */
export function usePlatformRead<T, E>(url: string | null, spec: Spec<T, E>) {
  const [answer, setAnswer] = useState<Outcome<T, E> | null>(null)
  const [attempt, setAttempt] = useState(0)
  const latest = useRef(spec)
  useEffect(() => {
    latest.current = spec
  })

  // Another url starts over; state, so while rendering.
  useWhenChanged([url], () => setAnswer(null))

  useEffect(() => {
    if (!url) return
    let current = true
    const { errorFrom, failure, parse, tag } = latest.current
    const read = async (): Promise<Outcome<T, E>> => {
      try {
        const res = await fetchShared(url)
        if (!res.ok) return { error: await errorFrom(res) }
        const body = await res.json()
        return { data: parse ? parse(body) : (body as T) }
      } catch (err) {
        console.error(`[${tag}]`, err)
        return { error: failure ? failure(err) : ('failed' as E) }
      }
    }
    read().then((outcome) => {
      if (current) setAnswer(outcome)
    })
    return () => {
      current = false
    }
  }, [url, attempt])

  const retry = useCallback(() => {
    setAnswer(null)
    setAttempt((n) => n + 1)
  }, [])

  return {
    data: answer && 'data' in answer ? answer.data : null,
    error: answer && 'error' in answer ? answer.error : null,
    isLoading: Boolean(url) && answer === null,
    retry,
  }
}
