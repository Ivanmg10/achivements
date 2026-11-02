import { fetchWithRetry } from '@/lib/fetchWithRetry'

/** An RA game's pictures, as paths on retroachievements.org (null when it has none). They never change. */
export type RaArt = { box: string | null; title: string | null; ingame: string | null }

const KEY = 'ra-art'
/** Games kept: enough for a library's covers and shelves; the oldest go first. */
const MAX = 400

/** Kept as [id, art] pairs, newest last, so the oldest is the one dropped. */
function read(): [number, RaArt][] {
  try {
    const list: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(list) ? (list as [number, RaArt][]) : []
  } catch {
    return []
  }
}

function keep(id: number, art: RaArt) {
  try {
    const list = read().filter(([known]) => known !== id)
    list.push([id, art])
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)))
  } catch {
    // Storage full or blocked: it is asked again next time, as before.
  }
}

const asked = new Map<number, Promise<RaArt | null>>()

/**
 * An RA game's pictures: from this browser when they were read before (they
 * never change), else one `/api/getGameData` call, kept for next time (#101).
 * Null when the call fails (not kept, so it is asked again). Several readers of
 * one game share one request.
 */
export function raArt(id: number): Promise<RaArt | null> {
  const known = read().find(([kept]) => kept === id)
  if (known) return Promise.resolve(known[1])
  let pending = asked.get(id)
  if (!pending) {
    pending = fetchWithRetry(`/api/getGameData?gameId=${id}`)
      .then((data) => {
        const d = (data ?? {}) as { ImageBoxArt?: string | null; ImageTitle?: string | null; ImageIngame?: string | null }
        const art = { box: d.ImageBoxArt || null, title: d.ImageTitle || null, ingame: d.ImageIngame || null }
        keep(id, art)
        return art
      })
      .catch((err) => {
        console.error('[raArt]', id, err)
        return null
      })
      .finally(() => asked.delete(id))
    asked.set(id, pending)
  }
  return pending
}
