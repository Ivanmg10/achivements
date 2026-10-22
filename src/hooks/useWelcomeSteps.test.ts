import { act, renderHook } from '@testing-library/react'
import { forgetUnsavedValues } from '@/hooks/useStorageValue'
import { CURTAIN_MS, CURTAIN_SWAP_MS, parseProgress, useWelcomeSteps } from './useWelcomeSteps'

const mockReduced = jest.fn(() => false)
jest.mock('framer-motion', () => ({ useReducedMotion: () => mockReduced() }))

beforeEach(() => {
  jest.useFakeTimers()
  sessionStorage.clear()
  forgetUnsavedValues()
  mockReduced.mockReturnValue(false)
  window.history.replaceState(null, '', '/welcome')
})
afterEach(() => jest.useRealTimers())

const stored = () => JSON.parse(sessionStorage.getItem('welcome-progress') ?? 'null')

test('starts at the welcome', () => {
  const { result } = renderHook(() => useWelcomeSteps())
  expect(result.current.step).toBe('intro')
  expect(result.current.seen).toBe(0)
  expect(result.current.ready).toBe(true)
})

test('moves under the curtain: the step changes halfway and the curtain then goes', () => {
  const { result } = renderHook(() => useWelcomeSteps())
  act(() => result.current.next())
  expect(result.current.transition).toEqual({ from: 0, to: 1, direction: 'forward' })
  expect(result.current.step).toBe('intro')

  act(() => jest.advanceTimersByTime(CURTAIN_SWAP_MS))
  expect(result.current.step).toBe('ra')
  expect(result.current.direction).toBe('forward')

  act(() => jest.advanceTimersByTime(CURTAIN_MS - CURTAIN_SWAP_MS))
  expect(result.current.transition).toBeNull()
  expect(stored()).toEqual({ step: 1, seen: 1, skipped: [] })
})

test('ignores a move while the curtain is passing, and out of range', () => {
  const { result } = renderHook(() => useWelcomeSteps())
  act(() => result.current.back())
  expect(result.current.transition).toBeNull()
  act(() => result.current.next())
  act(() => result.current.next())
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  expect(result.current.step).toBe('ra')
})

test('skipping leaves the step for later; going back runs the other way', () => {
  const { result } = renderHook(() => useWelcomeSteps())
  act(() => result.current.next())
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  act(() => result.current.skip())
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  expect(result.current.step).toBe('steam')
  expect(result.current.skipped).toEqual(['ra'])

  act(() => result.current.back())
  expect(result.current.transition?.direction).toBe('back')
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  expect(result.current.step).toBe('ra')
  expect(result.current.seen).toBe(2)
})

test('skip all goes to the end; finish forgets everything', () => {
  const { result } = renderHook(() => useWelcomeSteps())
  act(() => result.current.skipAll())
  act(() => jest.advanceTimersByTime(CURTAIN_MS))
  expect(result.current.step).toBe('done')
  act(() => result.current.finish())
  expect(sessionStorage.getItem('welcome-progress')).toBeNull()
  expect(result.current.step).toBe('intro')
})

test('with reduced motion there is no curtain', () => {
  mockReduced.mockReturnValue(true)
  const { result } = renderHook(() => useWelcomeSteps())
  act(() => result.current.goTo(3))
  expect(result.current.transition).toBeNull()
  expect(result.current.step).toBe('psn')
  expect(result.current.direction).toBe('none')
})

test('back from Steam with no progress in this tab, it opens on the Steam step', () => {
  window.history.replaceState(null, '', '/welcome#steam-linked')
  const { result } = renderHook(() => useWelcomeSteps())
  expect(result.current.step).toBe('steam')
})

test('survives a reload', () => {
  sessionStorage.setItem('welcome-progress', JSON.stringify({ step: 4, seen: 5, skipped: ['psn'] }))
  const { result } = renderHook(() => useWelcomeSteps())
  expect(result.current.step).toBe('profile')
  expect(result.current.seen).toBe(5)
})

describe('parseProgress', () => {
  test('anything odd is a fresh start', () => {
    const start = { step: 0, seen: 0, skipped: [] }
    expect(parseProgress(null)).toEqual(start)
    expect(parseProgress('not json')).toEqual(start)
    expect(parseProgress(JSON.stringify({ step: 9, seen: 0 }))).toEqual(start)
    expect(parseProgress(JSON.stringify({ step: 1.5, seen: 2 }))).toEqual(start)
  })

  test('drops unknown skipped steps and never sees less than the step', () => {
    expect(parseProgress(JSON.stringify({ step: 3, seen: 1, skipped: ['ra', 'xbox'] }))).toEqual({ step: 3, seen: 3, skipped: ['ra'] })
    expect(parseProgress(JSON.stringify({ step: 2, seen: 2, skipped: 'ra' }))).toEqual({ step: 2, seen: 2, skipped: [] })
  })
})

test('says it has moved only after a move', () => {
  const { result } = renderHook(() => useWelcomeSteps())
  expect(result.current.moved).toBe(false)
  act(() => result.current.next())
  expect(result.current.moved).toBe(true)
})
