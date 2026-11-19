import { en } from '@/translations/en'
import { countdown, psnSyncEta, psnSyncMessage } from './psnSyncCopy'

const copy = en.psn.sync
const NOW = Date.now()
const base = { stage: 'ready' as const, trouble: null, stale: false, position: null, games: { read: 40, total: 40 }, etaSeconds: null, syncedAt: NOW }

test('trouble first, then old data, then the stage; nothing when ready and fresh', () => {
  expect(psnSyncMessage(base, copy, 'en')).toBeNull()
  expect(psnSyncMessage({ ...base, stage: 'syncing_core', trouble: 'paused' }, copy, 'en')).toBe(copy.paused)
  expect(psnSyncMessage({ ...base, trouble: 'failing', stale: true }, copy, 'en')).toBe(copy.failing)
  expect(psnSyncMessage({ ...base, stale: true, syncedAt: NOW - 8 * 3_600_000 }, copy, 'en')).toBe('Showing data from 8 hours ago. Updating in the background.')
})

test('the core: reading, or its place in line', () => {
  expect(psnSyncMessage({ ...base, stage: 'syncing_core' }, copy, 'en')).toBe(copy.core)
  expect(psnSyncMessage({ ...base, stage: 'syncing_core', position: 2 }, copy, 'en')).toBe('Your update is in line (position 2). It may take a few minutes.')
})

test('after the core: the history counted in the reader’s numbers, else the partial line', () => {
  expect(psnSyncMessage({ ...base, stage: 'enriching', games: { read: 320, total: 1240 } }, copy, 'es')).toBe('History in progress: 320 of 1240 games.'.replace('1240', (1240).toLocaleString('es')))
  expect(psnSyncMessage({ ...base, stage: 'ready_partial' }, copy, 'en')).toBe(copy.partial)
})

test('the wait is rounded, and a long one is never promised in minutes', () => {
  expect(psnSyncEta(null, copy, 'en')).toBeNull()
  expect(psnSyncEta(20, copy, 'en')).toBe(copy.etaSeconds)
  expect(psnSyncEta(150, copy, 'en')).toBe('Ready in about 3 min. You can keep using CheevoVault.')
  expect(psnSyncEta(31 * 60, copy, 'en')).toBe(copy.etaLong)
})

test('a countdown reads m:ss', () => {
  expect(countdown(522)).toBe('8:42')
  expect(countdown(5)).toBe('0:05')
})
