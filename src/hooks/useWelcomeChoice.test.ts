import { act, renderHook, waitFor } from '@testing-library/react'
import { useWelcomeChoice } from './useWelcomeChoice'

beforeEach(() => window.history.replaceState(null, '', '/welcome'))

test('starts with nothing open', () => {
  const { result } = renderHook(() => useWelcomeChoice())
  expect(result.current.open).toBeNull()
  expect(result.current.returnTo).toBeNull()
})

test('opening one is a history entry that keeps the state already there', () => {
  window.history.replaceState({ welcomeStep: 5 }, '')
  const before = window.history.length
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => result.current.show('font'))
  expect(result.current.open).toBe('font')
  expect(window.history.length).toBe(before + 1)
  expect(window.history.state).toEqual({ welcomeStep: 5, welcomeChoice: 'font' })
})

test('going between choices adds no entry, so back closes rather than walks through them', () => {
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => result.current.show('theme'))
  const length = window.history.length
  act(() => result.current.go('shape'))
  expect(result.current.open).toBe('shape')
  expect(window.history.length).toBe(length)
})

test('the browser going back closes it, and says which row to give the focus', async () => {
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => result.current.show('home'))
  act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { welcomeStep: 5 } })))
  expect(result.current.open).toBeNull()
  expect(result.current.returnTo).toBe('home')
})

test('the browser going forward opens it again', () => {
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { welcomeChoice: 'cards' } })))
  expect(result.current.open).toBe('cards')
})

test('anything odd in the history is nothing open', () => {
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: { welcomeChoice: 'password' } })))
  expect(result.current.open).toBeNull()
})

test('closing goes back through its own entry', async () => {
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => result.current.show('language'))
  act(() => result.current.close())
  await waitFor(() => expect(result.current.open).toBeNull())
  expect(result.current.returnTo).toBe('language')
})

test('with its entry lost (a reload), closing still closes', () => {
  const { result } = renderHook(() => useWelcomeChoice())
  act(() => result.current.show('shape'))
  window.history.replaceState(null, '')
  act(() => result.current.close())
  expect(result.current.open).toBeNull()
})
