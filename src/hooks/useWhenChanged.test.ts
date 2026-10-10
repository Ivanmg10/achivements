import { useState } from 'react'
import { act, renderHook } from '@testing-library/react'
import { useWhenChanged } from './useWhenChanged'

function setup(initial: boolean) {
  const onChange = jest.fn()
  const hook = renderHook(
    ({ open }) => {
      const [count, setCount] = useState(0)
      useWhenChanged([open], () => {
        onChange(open)
        setCount((n) => n + 1)
      })
      return count
    },
    { initialProps: { open: initial } },
  )
  return { ...hook, onChange }
}

test('runs on the first render, and its state change is already there', () => {
  const { result, onChange } = setup(false)
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(result.current).toBe(1)
})

test('runs again when a dependency changes, not when the same values come back', () => {
  const { result, rerender, onChange } = setup(false)
  rerender({ open: false })
  expect(onChange).toHaveBeenCalledTimes(1)
  rerender({ open: true })
  expect(onChange).toHaveBeenCalledTimes(2)
  expect(onChange).toHaveBeenLastCalledWith(true)
  expect(result.current).toBe(2)
})

test('an unrelated render does not run it', () => {
  const { rerender, onChange } = setup(true)
  act(() => rerender({ open: true }))
  act(() => rerender({ open: true }))
  expect(onChange).toHaveBeenCalledTimes(1)
})

test('compares objects by identity, like an effect does', () => {
  const onChange = jest.fn()
  const a = {}
  const b = {}
  const { rerender } = renderHook(({ dep }) => useWhenChanged([dep], onChange), { initialProps: { dep: a } })
  rerender({ dep: a })
  expect(onChange).toHaveBeenCalledTimes(1)
  rerender({ dep: b })
  expect(onChange).toHaveBeenCalledTimes(2)
})
