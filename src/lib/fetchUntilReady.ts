import { fetchShared } from '@/lib/fetchShared'

/** Seconds to wait before asking again when a 202 does not say; and the most it may ask for. */
const WAIT_S = 15
const MAX_WAIT_S = 60

/**
 * A GET (through fetchShared) that waits out "still being built": while the answer is 202, it waits its
 * `Retry-After` and asks again, so the caller sees only the real answer and stays loading meanwhile (a section
 * lands whole). PSN answers 202 until its first sync is stored (#179). `stillWanted` false stops the waiting;
 * the last answer is returned and the caller drops it.
 */
export async function fetchUntilReady(url: string, init: RequestInit | undefined, stillWanted: () => boolean): Promise<Response> {
  for (;;) {
    const res = await fetchShared(url, init)
    if (res.status !== 202 || !stillWanted()) return res
    const seconds = Math.min(Number(res.headers.get('Retry-After')) || WAIT_S, MAX_WAIT_S)
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000))
    if (!stillWanted()) return res
  }
}
