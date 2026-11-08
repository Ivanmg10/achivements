import { fetchUpstream } from '@/lib/upstreamFetch'

export const STEAM_API_BASE = 'https://api.steampowered.com'

/**
 * Fetch from the Steam Web API (see fetchUpstream). Steam is stricter than RA
 * about rate limits (~100-200 calls / 5 min), so a 429 is passed up at once
 * rather than retried into the limit.
 */
export function fetchSteam(url: string): Promise<unknown> {
  return fetchUpstream(url, { platform: 'steam' })
}

/** Reads the server-wide Steam Web API key. One key for the whole app, not per user. */
export function steamApiKey(): string | null {
  return process.env.STEAM_API_KEY?.trim() || null
}
