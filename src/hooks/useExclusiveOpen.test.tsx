import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useExclusiveOpen } from './useExclusiveOpen'
import { OpenCardProvider } from '@/context/OpenCardContext'

const wrapper = ({ children }: { children: ReactNode }) => <OpenCardProvider>{children}</OpenCardProvider>

test('outside a provider it is a plain toggle of its own', () => {
  const { result } = renderHook(() => useExclusiveOpen('a'))
  expect(result.current[0]).toBe(false)
  act(() => result.current[1]())
  expect(result.current[0]).toBe(true)
  act(() => result.current[1]())
  expect(result.current[0]).toBe(false)
})

test('inside a provider, opening one card closes the one that was open', () => {
  const { result } = renderHook(() => ({ a: useExclusiveOpen('a'), b: useExclusiveOpen('b') }), { wrapper })
  act(() => result.current.a[1]())
  expect([result.current.a[0], result.current.b[0]]).toEqual([true, false])
  act(() => result.current.b[1]())
  expect([result.current.a[0], result.current.b[0]]).toEqual([false, true])
})

test('toggling the open card closes it, leaving none open', () => {
  const { result } = renderHook(() => ({ a: useExclusiveOpen('a'), b: useExclusiveOpen('b') }), { wrapper })
  act(() => result.current.a[1]())
  act(() => result.current.a[1]())
  expect([result.current.a[0], result.current.b[0]]).toEqual([false, false])
})
