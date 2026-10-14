import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useBackIntercept } from './useBackIntercept'
import { BackInterceptProvider, useBackRegistry } from '@/context/BackInterceptContext'

const wrapper = ({ children }: { children: ReactNode }) => <BackInterceptProvider>{children}</BackInterceptProvider>

/** The page's hook and the bar's registry, side by side in one provider. */
const setup = (initial: (() => void) | null) =>
  renderHook(({ handler }) => { useBackIntercept(handler); return useBackRegistry() }, { wrapper, initialProps: { handler: initial } })

test('while a handler is given, back runs it', () => {
  const handler = jest.fn()
  const { result } = setup(handler)
  expect(result.current.tryHandleBack()).toBe(true)
  expect(handler).toHaveBeenCalledTimes(1)
})

test('with null there is nothing to undo, so back is not handled', () => {
  const { result } = setup(null)
  expect(result.current.tryHandleBack()).toBe(false)
})

test('the handler of the latest render is the one that runs', () => {
  const first = jest.fn()
  const second = jest.fn()
  const { result, rerender } = setup(first)
  rerender({ handler: second })
  result.current.tryHandleBack()
  expect(second).toHaveBeenCalledTimes(1)
  expect(first).not.toHaveBeenCalled()
})

test('going from a handler to null, and back, takes charge of back and gives it up', () => {
  const handler = jest.fn()
  const { result, rerender } = setup(handler)
  rerender({ handler: null })
  expect(result.current.tryHandleBack()).toBe(false)
  rerender({ handler })
  expect(result.current.tryHandleBack()).toBe(true)
})

test('leaving the page gives back to the bar its own back', () => {
  const registry = renderHook(() => useBackRegistry(), { wrapper })
  const { unmount } = renderHook(() => useBackIntercept(jest.fn()), { wrapper: ({ children }: { children: ReactNode }) => <>{children}</> })
  unmount()
  expect(registry.result.current.tryHandleBack()).toBe(false)
})
