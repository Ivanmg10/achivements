import { act, renderHook } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { forgetUnsavedValues } from '@/hooks/useStorageValue'
import { CURTAIN_MS, CURTAIN_SWAP_MS } from '@/hooks/useWelcomeSteps'
import { useWelcomeArrival, useWelcomeEntry } from './useWelcomeEntry'

const mockReduced = jest.fn(() => false)
jest.mock('framer-motion', () => ({ useReducedMotion: () => mockReduced() }))

beforeEach(() => {
  jest.useFakeTimers()
  jest.clearAllMocks()
  sessionStorage.clear()
  forgetUnsavedValues()
  mockReduced.mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

test('leaves for the welcome once the curtain covers the screen, and tells the welcome', () => {
  const router = useRouter()
  const { result } = renderHook(() => useWelcomeEntry())
  expect(result.current.animate).toBe(true)
  act(() => result.current.go())
  expect(sessionStorage.getItem('welcome-entry')).toBe('1')
  expect(router.prefetch).toHaveBeenCalledWith('/welcome')
  expect(router.push).not.toHaveBeenCalled()
  act(() => jest.advanceTimersByTime(CURTAIN_SWAP_MS))
  expect(router.push).toHaveBeenCalledWith('/welcome')
})

test('with reduced motion it simply goes', () => {
  mockReduced.mockReturnValue(true)
  const router = useRouter()
  const { result } = renderHook(() => useWelcomeEntry())
  expect(result.current.animate).toBe(false)
  act(() => result.current.go())
  expect(router.push).toHaveBeenCalledWith('/welcome')
  expect(sessionStorage.getItem('welcome-entry')).toBeNull()
})

test('the welcome finishes the curtain, then forgets it', () => {
  sessionStorage.setItem('welcome-entry', '1')
  const { result } = renderHook(() => useWelcomeArrival())
  expect(result.current).toBe(true)
  act(() => jest.advanceTimersByTime(CURTAIN_MS - CURTAIN_SWAP_MS))
  expect(result.current).toBe(false)
  expect(sessionStorage.getItem('welcome-entry')).toBeNull()
})

test('arriving any other way, there is no curtain', () => {
  const { result } = renderHook(() => useWelcomeArrival())
  expect(result.current).toBe(false)
})
