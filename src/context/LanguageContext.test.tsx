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
