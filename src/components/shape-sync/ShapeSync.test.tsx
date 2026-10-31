import { act, render } from '@testing-library/react'
import ShapeSync from './ShapeSync'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.shape
  delete document.documentElement.dataset.font
  delete document.documentElement.dataset.homeLayout
})

test('puts the shape and font on <html>, and follows a change', () => {
  render(<ShapeSync />)
  expect(document.documentElement.dataset.shape).toBe('slanted')
  expect(document.documentElement.dataset.font).toBe('barlow')
  act(() => {
    localStorage.setItem('shape-style', 'round')
    localStorage.setItem('font-style', 'fira')
    window.dispatchEvent(new StorageEvent('storage', { key: 'shape-style', newValue: 'round' }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'font-style', newValue: 'fira' }))
  })
  expect(document.documentElement.dataset.shape).toBe('round')
  expect(document.documentElement.dataset.font).toBe('fira')
})

test('puts the home layout on <html> for its skeleton, and follows a change', () => {
  render(<ShapeSync />)
  expect(document.documentElement.dataset.homeLayout).toBe('classic')
  act(() => {
    localStorage.setItem('home-layout', 'cover')
    window.dispatchEvent(new StorageEvent('storage', { key: 'home-layout', newValue: 'cover' }))
  })
  expect(document.documentElement.dataset.homeLayout).toBe('cover')
})

test('takes them off when it goes away', () => {
  const { unmount } = render(<ShapeSync />)
  unmount()
  expect(document.documentElement.dataset.shape).toBeUndefined()
  expect(document.documentElement.dataset.font).toBeUndefined()
  expect(document.documentElement.dataset.homeLayout).toBeUndefined()
})
