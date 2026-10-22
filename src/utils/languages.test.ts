import { browserLanguages, isLang, pickLanguage } from './languages'

describe('pickLanguage', () => {
  test('takes the first language the app has, by its root', () => {
    expect(pickLanguage(['es-MX', 'en-US'])).toBe('es')
    expect(pickLanguage(['pt-BR'])).toBe('pt')
    expect(pickLanguage(['JA'])).toBe('ja')
  })

  test('skips the ones it does not have', () => {
    expect(pickLanguage(['nl-NL', 'de-DE', 'en'])).toBe('de')
  })

  test('is null when none fits, or there is nothing to read', () => {
    expect(pickLanguage(['nl', 'sv'])).toBeNull()
    expect(pickLanguage([])).toBeNull()
    expect(pickLanguage(undefined)).toBeNull()
  })
})

test('isLang knows the nine languages only', () => {
  expect(isLang('pl')).toBe(true)
  expect(isLang('nl')).toBe(false)
  expect(isLang(3)).toBe(false)
})

describe('browserLanguages', () => {
  const original = Object.getOwnPropertyDescriptor(window.navigator, 'languages')
  afterEach(() => {
    if (original) Object.defineProperty(window.navigator, 'languages', original)
    else delete (window.navigator as { languages?: unknown }).languages
  })

  test('reads navigator.languages', () => {
    Object.defineProperty(window.navigator, 'languages', { value: ['fr-FR', 'en'], configurable: true })
    expect(browserLanguages()).toEqual(['fr-FR', 'en'])
  })

  test('falls back to navigator.language when the list is empty', () => {
    Object.defineProperty(window.navigator, 'languages', { value: [], configurable: true })
    expect(browserLanguages()).toEqual([navigator.language])
  })
})
