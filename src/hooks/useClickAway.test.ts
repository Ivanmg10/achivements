import { renderHook } from '@testing-library/react'
import { useClickAway } from './useClickAway'

function fireMouseDown(target: Element) {
  const event = new MouseEvent('mousedown', { bubbles: true })
  Object.defineProperty(event, 'target', { value: target })
  document.dispatchEvent(event)
}

test('does not attach listeners when isOpen is false', () => {
  const onClose = jest.fn()
  const inside = document.createElement('div')
  document.body.appendChild(inside)
  const ref = { current: inside }

  renderHook(() => useClickAway(ref, false, onClose))
  fireMouseDown(document.body)

  expect(onClose).not.toHaveBeenCalled()
  document.body.removeChild(inside)
})

test('calls onClose when clicking outside the ref while open', () => {
  const onClose = jest.fn()
  const inside = document.createElement('div')
  const outside = document.createElement('div')
  document.body.appendChild(inside)
  document.body.appendChild(outside)
  const ref = { current: inside }

  renderHook(() => useClickAway(ref, true, onClose))
  fireMouseDown(outside)

  expect(onClose).toHaveBeenCalledTimes(1)
  document.body.removeChild(inside)
  document.body.removeChild(outside)
})

test('does not call onClose when clicking inside the ref', () => {
  const onClose = jest.fn()
  const inside = document.createElement('div')
  document.body.appendChild(inside)
  const ref = { current: inside }

  renderHook(() => useClickAway(ref, true, onClose))
  fireMouseDown(inside)

  expect(onClose).not.toHaveBeenCalled()
  document.body.removeChild(inside)
})

test('calls onClose on Escape key while open', () => {
  const onClose = jest.fn()
  const ref = { current: document.createElement('div') }

  renderHook(() => useClickAway(ref, true, onClose))
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

  expect(onClose).toHaveBeenCalledTimes(1)
})

test('ignores non-Escape keys', () => {
  const onClose = jest.fn()
  const ref = { current: document.createElement('div') }

  renderHook(() => useClickAway(ref, true, onClose))
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))

  expect(onClose).not.toHaveBeenCalled()
})

test('cleans up listeners on unmount', () => {
  const onClose = jest.fn()
  const ref = { current: document.createElement('div') }

  const { unmount } = renderHook(() => useClickAway(ref, true, onClose))
  unmount()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

  expect(onClose).not.toHaveBeenCalled()
})
