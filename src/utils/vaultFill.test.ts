import { fillProgress } from './vaultFill'

const status = (complete: boolean, platforms: object) => ({ complete, running: !complete, points: 0, updatedAt: '', platforms })

test('nothing to show once complete, or before any status', () => {
  expect(fillProgress(null).active).toBe(false)
  expect(fillProgress(status(true, {})).active).toBe(false)
})

test('counts the platforms being read, never Xbox or a failed one, and never says 100 before it is done', () => {
  expect(
    fillProgress(status(false, {
      steam: { read: 190, total: 190, state: 'done' },
      ra: { read: 10, total: 35, state: 'reading' },
      xbox: { read: 1, total: 10, state: 'estimated' },
      psn: { read: 0, total: 0, state: 'error', error: 'private' },
    })),
  ).toEqual({ active: true, read: 200, total: 225, pct: 88 })
  expect(fillProgress(status(false, { ra: { read: 35, total: 35, state: 'reading' } })).pct).toBe(99)
  expect(fillProgress(status(false, { steam: { read: 0, total: 0, state: 'reading' } })).pct).toBe(0)
})

describe('fillMessage', () => {
  const { en } = jest.requireActual('@/translations/en')
  const { fillMessage } = jest.requireActual('./vaultFill')
  it('says how to fix a private profile or a refused key, and that busy or silent ones retry alone', () => {
    expect(fillMessage('steam', { read: 0, total: 0, state: 'error', error: 'private' }, en.rankings)).toBe(en.rankings.fillPrivateSteam)
    expect(fillMessage('psn', { read: 0, total: 0, state: 'error', error: 'private' }, en.rankings)).toBe(en.rankings.fillPrivatePsn)
    expect(fillMessage('ra', { read: 0, total: 0, state: 'error', error: 'key' }, en.rankings)).toBe(en.rankings.fillKey)
    expect(fillMessage('psn', { read: 3, total: 9, state: 'reading', error: 'busy' }, en.rankings)).toBe(en.rankings.fillBusy.replace('{platform}', 'PlayStation'))
    expect(fillMessage('xbox', { read: 1, total: 9, state: 'estimated' }, en.rankings)).toBe(en.rankings.fillXbox)
    expect(fillMessage('steam', { read: 3, total: 9, state: 'reading' }, en.rankings)).toBeNull()
  })
})
