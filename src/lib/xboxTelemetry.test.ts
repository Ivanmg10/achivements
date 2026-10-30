import { NextResponse } from 'next/server'
import {
  recordXboxCacheEvent,
  recordXboxPartial,
  recordXboxUpstream,
  recordXboxUpstreamSkip,
  withXboxTelemetry,
} from './xboxTelemetry'

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  ;(console.info as jest.Mock).mockRestore()
  ;(console.warn as jest.Mock).mockRestore()
})

test('adds request, upstream, cache, freshness, partial and rate-limit contracts', async () => {
  const res = await withXboxTelemetry('xbox/test', async () => {
    recordXboxCacheEvent('hit')
    recordXboxCacheEvent('stale')
    recordXboxPartial('playtime')
    recordXboxUpstream('library', 'success', 12, { remaining: 41, limit: 150, reset: '1793347200' })
    return NextResponse.json({ ok: true })
  })

  expect(res.headers.get('X-Request-Id')).toBeTruthy()
  expect(res.headers.get('X-Xbox-Upstream-Calls')).toBe('1')
  expect(res.headers.get('X-Xbox-Cache-Hits')).toBe('1')
  expect(res.headers.get('X-Xbox-Stale')).toBe('true')
  expect(res.headers.get('Warning')).toBe('110 - "Response is stale"')
  expect(res.headers.get('X-Xbox-Partial')).toBe('playtime')
  expect(res.headers.get('X-Xbox-RateLimit-Remaining')).toBe('41')
  expect(res.headers.get('X-Xbox-RateLimit-Limit')).toBe('150')
  expect(res.headers.get('X-Xbox-RateLimit-Reset')).toBe('1793347200')

  const events = (console.info as jest.Mock).mock.calls.map(([line]) => JSON.parse(line))
  expect(events).toContainEqual(expect.objectContaining({
    event: 'xbox_upstream',
    entryPoint: 'xbox/test',
    requestId: res.headers.get('X-Request-Id'),
    operation: 'library',
    outcome: 'success',
    durationMs: 12,
    remaining: 41,
  }))
})

test('keeps concurrent request counters isolated', async () => {
  const [one, two] = await Promise.all([
    withXboxTelemetry('xbox/one', async () => {
      recordXboxUpstream('library', 'success', 1)
      return NextResponse.json({})
    }),
    withXboxTelemetry('xbox/two', async () => {
      recordXboxUpstream('library', 'success', 1)
      recordXboxUpstream('achievements', 'success', 1)
      return NextResponse.json({})
    }),
  ])

  expect(one.headers.get('X-Xbox-Upstream-Calls')).toBe('1')
  expect(two.headers.get('X-Xbox-Upstream-Calls')).toBe('2')
  expect(one.headers.get('X-Request-Id')).not.toBe(two.headers.get('X-Request-Id'))
})

test('a refused attempt is logged without counting as an upstream call', async () => {
  const res = await withXboxTelemetry('xbox/budget', async () => {
    recordXboxUpstreamSkip('library', 'rate-limited')
    return NextResponse.json({ error: 'rate-limited' }, { status: 429 })
  })

  expect(res.headers.get('X-Xbox-Upstream-Calls')).toBe('0')
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('"event":"xbox_upstream_skipped"'))
  expect(console.warn).toHaveBeenCalledWith(expect.not.stringContaining('2535400000000001'))
})
