import { renderHook, act } from '@testing-library/react'
import { useCookieConsent } from './useCookieConsent'
import { setAnalyticsEnabled } from '@/lib/analytics'

jest.mock('@/lib/analytics', () => ({ setAnalyticsEnabled: jest.fn() }))

beforeEach(() => {
  window.localStorage.clear()
  jest.clearAllMocks()
})

test('nothing chosen yet reads as null once mounted', () => {
  const { result } = renderHook(() => useCookieConsent())
  expect(result.current.consent).toBeNull()
})

test('a choice is remembered for the next visit', () => {
  const first = renderHook(() => useCookieConsent())
  act(() => first.result.current.choose('granted'))
  first.unmount()

  const second = renderHook(() => useCookieConsent())
  expect(second.result.current.consent).toBe('granted')
})

test('every component asking sees the same choice at once', () => {
  const banner = renderHook(() => useCookieConsent())
  const analytics = renderHook(() => useCookieConsent())
  act(() => banner.result.current.choose('denied'))
  expect(analytics.result.current.consent).toBe('denied')
})

test('accepting or rejecting switches analytics on or off', () => {
  const { result } = renderHook(() => useCookieConsent())
  act(() => result.current.choose('granted'))
  expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(true)
  act(() => result.current.choose('denied'))
  expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(false)
})

test('withdrawing the choice stops analytics at once and asks again', () => {
  const { result } = renderHook(() => useCookieConsent())
  act(() => result.current.choose('granted'))
  jest.clearAllMocks()
  act(() => result.current.choose(null))
  expect(result.current.consent).toBeNull()
  expect(window.localStorage.getItem('cookie-consent')).toBeNull()
  expect(setAnalyticsEnabled).toHaveBeenCalledWith(false)
})

test('ignores a stored value it does not know', () => {
  window.localStorage.setItem('cookie-consent', 'maybe')
  const { result } = renderHook(() => useCookieConsent())
  expect(result.current.consent).toBeNull()
})

test('still applies the choice when storage throws', () => {
  const set = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
  const { result } = renderHook(() => useCookieConsent())
  act(() => result.current.choose('denied'))
  expect(result.current.consent).toBe('denied')
  set.mockRestore()
})
