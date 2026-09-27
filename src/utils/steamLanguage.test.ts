import { toSteamLanguage, parseSteamLanguage, STEAM_LANGUAGES } from './steamLanguage'

test('maps every app language to a Steam language', () => {
  expect(toSteamLanguage('es')).toBe('spanish')
  expect(toSteamLanguage('ja')).toBe('japanese')
  expect(Object.keys(STEAM_LANGUAGES)).toHaveLength(9)
})

test('falls back to English for unknown or missing languages', () => {
  expect(toSteamLanguage('xx')).toBe('english')
  expect(toSteamLanguage(null)).toBe('english')
  expect(toSteamLanguage(undefined)).toBe('english')
})

test('accepts only supported Steam languages from a request', () => {
  expect(parseSteamLanguage('spanish')).toBe('spanish')
  // Anything else would become part of a cache key and an upstream URL.
  expect(parseSteamLanguage('klingon')).toBe('english')
  expect(parseSteamLanguage('')).toBe('english')
  expect(parseSteamLanguage(null)).toBe('english')
})
