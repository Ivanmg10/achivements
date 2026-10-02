import { renderHook } from '@testing-library/react'
import type { PointerEvent } from 'react'
import { useSpotlight } from './useSpotlight'

function pointer(type: string, el: HTMLElement) {
  return { pointerType: type, clientX: 30, clientY: 20, currentTarget: el } as unknown as PointerEvent<HTMLElement>
}

function element() {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({ left: 10, top: 5 }) as DOMRect
  return el
}

test('writes the pointer position, relative to the element, as CSS variables', () => {
  const { result } = renderHook(() => useSpotlight())
  const el = element()
  result.current(pointer('mouse', el))
  expect(el.style.getPropertyValue('--spot-x')).toBe('20px')
  expect(el.style.getPropertyValue('--spot-y')).toBe('15px')
})

test('ignores touch, where there is no hover to follow', () => {
  const { result } = renderHook(() => useSpotlight())
  const el = element()
  result.current(pointer('touch', el))
  expect(el.style.getPropertyValue('--spot-x')).toBe('')
})
