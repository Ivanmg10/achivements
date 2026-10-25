import { act, render } from '@testing-library/react'
import ShapeSync from './ShapeSync'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.shape
})

test('puts the shape on <html>, and follows a change', () => {
  render(<ShapeSync />)
  expect(document.documentElement.dataset.shape).toBe('slanted')
  act(() => {
    localStorage.setItem('shape-style', 'round')
    window.dispatchEvent(new StorageEvent('storage', { key: 'shape-style', newValue: 'round' }))
  })
  expect(document.documentElement.dataset.shape).toBe('round')
})

test('takes it off when it goes away', () => {
  const { unmount } = render(<ShapeSync />)
  unmount()
  expect(document.documentElement.dataset.shape).toBeUndefined()
})
