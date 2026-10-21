import { cleanStoredPreferences, isSyncedKey, MAX_PREFERENCE_KEYS, MAX_PREFERENCE_VALUE, readPreferenceChanges } from './syncedPreferences'

test.each([
  'hidden-consoles:ra', 'hidden-consoles:xbox', 'library-layout', 'library-view', 'library-cols', 'groups-view', 'library-sort:playing', 'library-sort-all:completed',
  'psn-completion', 'psn-hidden-trophies', 'xbox-secret-achievements',
])('%s is stored on the account', (key) => expect(isSyncedKey(key)).toBe(true))

test.each([
  'hidden-consoles:switch', 'hidden-consoles:', 'library-sort:', 'library-sort:../x', 'library-sort:a-b', 'language', 'cookie-consent', 'main-profile-tab',
  'account-preferences-tab', '__proto__', 'constructor', 'library-layout ', '',
])('%j is not', (key) => expect(isSyncedKey(key)).toBe(false))

describe('readPreferenceChanges', () => {
  test('splits what to save from what to forget', () => {
    expect(readPreferenceChanges({ changes: { 'library-layout': 'list', 'library-cols': null } })).toEqual({ set: { 'library-layout': 'list' }, remove: ['library-cols'] })
  })

  test.each([
    ['no body', null],
    ['no changes', {}],
    ['changes that are not an object', { changes: 'x' }],
    ['changes that are a list', { changes: [] }],
    ['an empty object', { changes: {} }],
    ['a key off the list, even next to good ones', { changes: { 'library-layout': 'list', 'is-admin': 'true' } }],
    ['a value that is not a string', { changes: { 'library-layout': 5 } }],
    ['a value that is too long', { changes: { 'library-layout': 'x'.repeat(MAX_PREFERENCE_VALUE + 1) } }],
  ])('refuses %s whole', (_name, body) => expect(readPreferenceChanges(body)).toBeNull())

  test('refuses too many keys', () => {
    const many = Object.fromEntries(Array.from({ length: MAX_PREFERENCE_KEYS + 1 }, (_, i) => [`library-sort:${'a'.repeat(1 + (i % 30))}${String.fromCharCode(97 + Math.floor(i / 30))}`, 'x']))
    expect(Object.keys(many)).toHaveLength(MAX_PREFERENCE_KEYS + 1)
    expect(readPreferenceChanges({ changes: many })).toBeNull()
  })

  test('takes a value at the limit', () => {
    expect(readPreferenceChanges({ changes: { 'library-layout': 'x'.repeat(MAX_PREFERENCE_VALUE) } })).not.toBeNull()
  })
})

test('stored preferences are cleaned to the allowed keys and string values', () => {
  expect(cleanStoredPreferences({ 'library-layout': 'list', 'is-admin': 'true', 'library-cols': 3, 'library-view': 'x'.repeat(MAX_PREFERENCE_VALUE + 1) })).toEqual({ 'library-layout': 'list' })
  expect(cleanStoredPreferences(null)).toEqual({})
  expect(cleanStoredPreferences([])).toEqual({})
  expect(cleanStoredPreferences('x')).toEqual({})
})
