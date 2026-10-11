import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { BackInterceptProvider, useBackRegistry } from './BackInterceptContext'

const wrapper = ({ children }: { children: ReactNode }) => <BackInterceptProvider>{children}</BackInterceptProvider>

test('outside a provider nobody takes over: back is the caller\'s own', () => {
  const { result } = renderHook(() => useBackRegistry())
  expect(result.current.tryHandleBack()).toBe(false)
  expect(() => result.current.register(() => {})()).not.toThrow()
})

test('with no handler registered, back is not handled', () => {
  const { result } = renderHook(() => useBackRegistry(), { wrapper })
  expect(result.current.tryHandleBack()).toBe(false)
})

test('a registered handler is run, and says it was', () => {
  const { result } = renderHook(() => useBackRegistry(), { wrapper })
  const handler = jest.fn()
  act(() => { result.current.register(handler) })
  expect(result.current.tryHandleBack()).toBe(true)
  expect(handler).toHaveBeenCalledTimes(1)
})

test('the latest registered is in charge; when it leaves, the one before it is again', () => {
  const { result } = renderHook(() => useBackRegistry(), { wrapper })
  const first = jest.fn()
  const second = jest.fn()
  let leave = () => {}
  act(() => {
    result.current.register(first)
    leave = result.current.register(second)
  })
  result.current.tryHandleBack()
  expect(second).toHaveBeenCalledTimes(1)
  expect(first).not.toHaveBeenCalled()
  act(() => leave())
  result.current.tryHandleBack()
  expect(first).toHaveBeenCalledTimes(1)
})

test('once the only handler leaves, back is not handled any more', () => {
  const { result } = renderHook(() => useBackRegistry(), { wrapper })
  let leave = () => {}
  act(() => { leave = result.current.register(jest.fn()) })
  act(() => leave())
  expect(result.current.tryHandleBack()).toBe(false)
})

test('registering never changes what the bar reads, so it never has to render again', () => {
  const { result } = renderHook(() => useBackRegistry(), { wrapper })
  const before = result.current
  act(() => { result.current.register(jest.fn()) })
  expect(result.current).toBe(before)
})
