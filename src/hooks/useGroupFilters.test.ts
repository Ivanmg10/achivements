import { act, renderHook } from '@testing-library/react'
import { useGroupFilters } from './useGroupFilters'

test('consoles toggle in and out; any filter makes it active; clear resets all', () => {
  const { result } = renderHook(() => useGroupFilters())
  expect(result.current.active).toBe(false)
  act(() => result.current.toggleConsole('SNES'))
  expect([...result.current.filters.consoles]).toEqual(['SNES'])
  expect(result.current.active).toBe(true)
  act(() => result.current.toggleConsole('SNES'))
  expect(result.current.filters.consoles.size).toBe(0)
  act(() => {
    result.current.setPct('100')
    result.current.setDecade('90s')
  })
  expect(result.current.active).toBe(true)
  act(() => result.current.clear())
  expect(result.current.filters).toEqual({ consoles: new Set(), pct: 'all', decade: 'all' })
})
