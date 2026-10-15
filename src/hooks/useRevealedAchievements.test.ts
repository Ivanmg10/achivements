import { act, renderHook } from '@testing-library/react'
import { useRevealedAchievements } from './useRevealedAchievements'
import { useXboxRevealSecrets } from './useXboxRevealSecrets'

beforeEach(() => window.localStorage.clear())

describe('useXboxRevealSecrets', () => {
  test('secrets are concealed by default, and the choice is remembered', () => {
    const { result } = renderHook(() => useXboxRevealSecrets())
    expect(result.current[0]).toBe(false)
    act(() => result.current[1](true))
    expect(result.current[0]).toBe(true)
    expect(window.localStorage.getItem('xbox-secret-achievements')).toBe('reveal')
    act(() => result.current[1](false))
    expect(result.current[0]).toBe(false)
  })
})

describe('useRevealedAchievements', () => {
  test('nothing is revealed at first, and each eye flips one achievement', () => {
    const { result } = renderHook(() => useRevealedAchievements())
    expect(result.current.isRevealed('7')).toBe(false)
    act(() => result.current.toggle('7'))
    expect(result.current.isRevealed('7')).toBe(true)
    expect(result.current.isRevealed('8')).toBe(false)
    act(() => result.current.toggle('7'))
    expect(result.current.isRevealed('7')).toBe(false)
  })

  test('setAll shows or hides a whole list', () => {
    const { result } = renderHook(() => useRevealedAchievements())
    act(() => result.current.setAll(['1', '2'], true))
    expect(result.current.isRevealed('1')).toBe(true)
    expect(result.current.isRevealed('2')).toBe(true)
    act(() => result.current.setAll(['1', '2'], false))
    expect(result.current.isRevealed('1')).toBe(false)
  })

  test('with secrets shown by default, each eye hides one instead', () => {
    window.localStorage.setItem('xbox-secret-achievements', 'reveal')
    const { result } = renderHook(() => useRevealedAchievements())
    expect(result.current.isRevealed('7')).toBe(true)
    act(() => result.current.toggle('7'))
    expect(result.current.isRevealed('7')).toBe(false)
  })
})
