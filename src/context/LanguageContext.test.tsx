import { act, renderHook } from '@testing-library/react'
import { LanguageProvider, useLanguage } from './LanguageContext'

const wrapper = ({ children }: { children: React.ReactNode }) => <LanguageProvider>{children}</LanguageProvider>

beforeEach(() => localStorage.clear())

test('<html lang> follows the language shown', () => {
  const { result } = renderHook(() => useLanguage(), { wrapper })
  expect(document.documentElement.lang).toBe('en')

  act(() => result.current.setLang('es'))
  expect(document.documentElement.lang).toBe('es')
})

test('starts from the saved language', () => {
  localStorage.setItem('app-language', 'ja')
  renderHook(() => useLanguage(), { wrapper })
  expect(document.documentElement.lang).toBe('ja')
})

describe('with nothing saved, the browser decides', () => {
  const original = Object.getOwnPropertyDescriptor(window.navigator, 'languages')
  const prefer = (languages: string[]) => Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true })
  afterEach(() => {
    if (original) Object.defineProperty(window.navigator, 'languages', original)
    else delete (window.navigator as { languages?: unknown }).languages
  })

  test('the first of its languages the app has', () => {
    prefer(['nl-NL', 'es-MX'])
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.lang).toBe('es')
    expect(result.current.fromBrowser).toBe(true)
    // Detected, not chosen: nothing is written.
    expect(localStorage.getItem('app-language')).toBeNull()
  })

  test('English when it asks only for languages the app does not have', () => {
    prefer(['nl-NL'])
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.lang).toBe('en')
    expect(result.current.fromBrowser).toBe(false)
  })

  test('a saved choice wins over the browser', () => {
    prefer(['es-ES'])
    localStorage.setItem('app-language', 'fr')
    const { result } = renderHook(() => useLanguage(), { wrapper })
    expect(result.current.lang).toBe('fr')
    expect(result.current.fromBrowser).toBe(false)
  })

  test('picking one keeps it, and it is no longer the browser’s', () => {
    prefer(['es-ES'])
    const { result } = renderHook(() => useLanguage(), { wrapper })
    act(() => result.current.setLang('de'))
    expect(result.current.lang).toBe('de')
    expect(result.current.fromBrowser).toBe(false)
    expect(localStorage.getItem('app-language')).toBe('de')
  })
})
