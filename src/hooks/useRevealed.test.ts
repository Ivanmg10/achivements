import { renderHook, act } from '@testing-library/react'
import { useRevealed } from './useRevealed'
import { usePsnRevealHidden } from './usePsnRevealHidden'
import { useXboxRevealSecrets } from './useXboxRevealSecrets'
import { usePsnPlatinumCompletes } from './usePsnPlatinumCompletes'
import { useStoredSwitch } from './useStoredSwitch'

beforeEach(() => window.localStorage.clear())

describe.each([
  ['PSN trophies', 'psn-hidden-trophies', usePsnRevealHidden, [{ id: 1 }, { id: 2 }]],
  ['Xbox achievements', 'xbox-secret-achievements', useXboxRevealSecrets, [{ id: 'a' }, { id: 'b' }]],
] as const)('%s', (_, key, usePreference, items) => {
  const idOf = (x: { id: number | string }) => x.id
  const hook = () =>
    renderHook(() => {
      const [byDefault] = usePreference()
      return useRevealed<{ id: number | string }, number | string>(byDefault, idOf)
    })

  test('start concealed; an eye flips one; setAll shows or hides the lot', () => {
    const { result } = hook()
    expect(result.current.isRevealed(items[0])).toBe(false)
    act(() => result.current.toggle(items[0]))
    expect(result.current.isRevealed(items[0])).toBe(true)
    expect(result.current.isRevealed(items[1])).toBe(false)
    act(() => result.current.setAll([...items], true))
    expect(items.map(result.current.isRevealed)).toEqual([true, true])
    act(() => result.current.setAll([...items], false))
    expect(items.map(result.current.isRevealed)).toEqual([false, false])
  })

  test('with the preference on, they start revealed and an eye hides one', () => {
    window.localStorage.setItem(key, 'reveal')
    const { result } = hook()
    expect(result.current.isRevealed(items[0])).toBe(true)
    act(() => result.current.toggle(items[0]))
    expect(result.current.isRevealed(items[0])).toBe(false)
    expect(result.current.isRevealed(items[1])).toBe(true)
  })
})

describe('useStoredSwitch', () => {
  test('is off until set, keeps the stored words, and ignores a value it does not know', () => {
    const { result } = renderHook(() => useStoredSwitch('some-switch', 'no', 'yes'))
    expect(result.current[0]).toBe(false)
    act(() => result.current[1](true))
    expect(window.localStorage.getItem('some-switch')).toBe('yes')
    expect(result.current[0]).toBe(true)
    window.localStorage.setItem('some-switch', 'maybe')
    const again = renderHook(() => useStoredSwitch('some-switch', 'no', 'yes'))
    expect(again.result.current[0]).toBe(false)
  })

  test('the three preferences keep their stored words', () => {
    const psn = renderHook(() => usePsnPlatinumCompletes())
    act(() => psn.result.current[1](true))
    expect(window.localStorage.getItem('psn-completion')).toBe('platinum')
  })
})
