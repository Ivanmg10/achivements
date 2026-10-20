const mockReduce = jest.fn(() => false)
jest.mock('framer-motion', () => ({ useReducedMotion: () => mockReduce() }))

import { renderHook } from '@testing-library/react'
import { useRise } from './useRise'

test('rises from below, after the delay it is given', () => {
  const { result } = renderHook(() => useRise())
  const props = result.current(0.12) as { initial: object; animate: object; transition: { delay: number } }
  expect(props.initial).toEqual({ opacity: 0, y: 14 })
  expect(props.animate).toEqual({ opacity: 1, y: 0 })
  expect(props.transition.delay).toBe(0.12)
})

test('does nothing when the person asked for less motion', () => {
  mockReduce.mockReturnValue(true)
  const { result } = renderHook(() => useRise())
  expect(result.current(0.12)).toEqual({})
})
