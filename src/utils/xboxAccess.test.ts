import { XBOX_ADMIN_ONLY, canUseXbox, sourceAllowed } from './xboxAccess'

test('Xbox is admin-only while it is tried out', () => {
  expect(XBOX_ADMIN_ONLY).toBe(true)
})

test('an admin may use Xbox; anyone else, or nobody known, may not', () => {
  expect(canUseXbox(true)).toBe(true)
  expect(canUseXbox(false)).toBe(false)
  expect(canUseXbox(null)).toBe(false)
  expect(canUseXbox(undefined)).toBe(false)
})

test('only a write naming Xbox is held back, and only from who may not use it', () => {
  expect(sourceAllowed('xbox', true)).toBe(true)
  expect(sourceAllowed('xbox', false)).toBe(false)
  expect(sourceAllowed('xbox', undefined)).toBe(false)
  for (const source of ['ra', 'steam', 'psn', undefined, null, 'whatever']) {
    expect(sourceAllowed(source, false)).toBe(true)
  }
})
