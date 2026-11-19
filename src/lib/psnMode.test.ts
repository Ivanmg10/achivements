import { psnMode, psnPoolEnabled } from './psnMode'

test('PSN_MODE is live unless it says queue or stale', () => {
  expect(psnMode({})).toBe('live')
  expect(psnMode({ PSN_MODE: 'queue' })).toBe('queue')
  expect(psnMode({ PSN_MODE: ' STALE ' })).toBe('stale')
  expect(psnMode({ PSN_MODE: 'off' })).toBe('live')
})

test('the pool is on unless PSN_POOL_ENABLED is false', () => {
  expect(psnPoolEnabled({})).toBe(true)
  expect(psnPoolEnabled({ PSN_POOL_ENABLED: 'true' })).toBe(true)
  expect(psnPoolEnabled({ PSN_POOL_ENABLED: 'False' })).toBe(false)
})
