import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { SteamCacheEvent } from '@/lib/steamCache'

export type XboxOperation = 'account' | 'library' | 'playtime' | 'achievements' | 'x360-definitions' | 'x360-earned' | 'other'
type RateLimit = { remaining?: number; limit?: number; reset?: string | null }
type Context = {
  requestId: string
  entryPoint: string
  upstreamCalls: number
  cacheHits: number
  cacheMisses: number
  inFlightJoins: number
  stale: boolean
  staleVersion: number
  partial: Set<string>
  rateLimit: RateLimit
}

const storage = new AsyncLocalStorage<Context>()

function newContext(entryPoint: string): Context {
  return {
    requestId: randomUUID(),
    entryPoint,
    upstreamCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    inFlightJoins: 0,
    stale: false,
    staleVersion: 0,
    partial: new Set(),
    rateLimit: {},
  }
}

function log(level: 'info' | 'warn', event: Record<string, unknown>) {
  console[level](JSON.stringify(event))
}

/** Gives background jobs the same sanitized context as HTTP routes. */
export async function runWithXboxTelemetry<T>(entryPoint: string, fn: () => Promise<T>): Promise<T> {
  if (storage.getStore()) return fn()
  return storage.run(newContext(entryPoint), fn)
}

/** Adds the additive telemetry/freshness contract to any Xbox route response. */
export async function withXboxTelemetry<T extends Response>(entryPoint: string, handler: () => Promise<T>): Promise<T> {
  return runWithXboxTelemetry(entryPoint, async () => {
    const response = await handler()
    const context = storage.getStore()
    if (!context) return response

    response.headers.set('X-Request-Id', context.requestId)
    response.headers.set('X-Xbox-Upstream-Calls', String(context.upstreamCalls))
    response.headers.set('X-Xbox-Cache-Hits', String(context.cacheHits))
    response.headers.set('X-Xbox-Cache-Misses', String(context.cacheMisses))
    response.headers.set('X-Xbox-InFlight-Joins', String(context.inFlightJoins))
    if (context.stale) {
      response.headers.set('X-Xbox-Stale', 'true')
      response.headers.set('Warning', '110 - "Response is stale"')
    }
    if (context.partial.size) response.headers.set('X-Xbox-Partial', [...context.partial].join(','))
    if (context.rateLimit.remaining !== undefined) response.headers.set('X-Xbox-RateLimit-Remaining', String(context.rateLimit.remaining))
    if (context.rateLimit.limit !== undefined) response.headers.set('X-Xbox-RateLimit-Limit', String(context.rateLimit.limit))
    if (context.rateLimit.reset) response.headers.set('X-Xbox-RateLimit-Reset', context.rateLimit.reset)
    return response
  })
}

export function xboxStaleVersion(): number {
  return storage.getStore()?.staleVersion ?? 0
}

export function recordXboxCacheEvent(event: SteamCacheEvent) {
  const context = storage.getStore()
  if (!context) return
  if (event === 'hit') context.cacheHits++
  if (event === 'miss') context.cacheMisses++
  if (event === 'inflight') context.inFlightJoins++
  if (event === 'stale') {
    context.stale = true
    context.staleVersion++
    log('warn', { event: 'xbox_cache_stale', entryPoint: context.entryPoint, requestId: context.requestId })
  }
}

export function recordXboxPartial(part: 'playtime' | 'achievements') {
  const context = storage.getStore()
  if (!context) return
  context.partial.add(part)
  log('warn', { event: 'xbox_partial', entryPoint: context.entryPoint, requestId: context.requestId, part })
}

export function recordXboxUpstreamSkip(operation: XboxOperation, reason: 'rate-limited') {
  const context = storage.getStore()
  log('warn', {
    event: 'xbox_upstream_skipped',
    entryPoint: context?.entryPoint ?? 'unscoped',
    requestId: context?.requestId ?? null,
    operation,
    reason,
  })
}

export function recordXboxUpstream(operation: XboxOperation, outcome: string, durationMs: number, rateLimit: RateLimit = {}) {
  const context = storage.getStore()
  if (context) {
    context.upstreamCalls++
    context.rateLimit = { ...context.rateLimit, ...rateLimit }
  }
  log(outcome === 'success' ? 'info' : 'warn', {
    event: 'xbox_upstream',
    entryPoint: context?.entryPoint ?? 'unscoped',
    requestId: context?.requestId ?? null,
    operation,
    outcome,
    durationMs,
    ...rateLimit,
  })
}

/** Classifies the endpoint without leaking its gamertag, XUID or title id. */
export function xboxOperation(path: string): XboxOperation {
  if (path === 'account' || path.startsWith('friends/search')) return 'account'
  if (path === 'player/stats') return 'playtime'
  if (path.startsWith('titles/')) return 'library'
  if (path.startsWith('achievements/x360/')) return 'x360-earned'
  if (path.startsWith('achievements/player/') && path.includes('/title/')) return 'x360-definitions'
  if (path.startsWith('achievements/player/')) return 'achievements'
  return 'other'
}
