import { render, screen, fireEvent } from '@testing-library/react'
import ViewEntrance from './ViewEntrance'

jest.mock('./ViewEntrance.module.css', () => ({ feed: 'feed', tile: 'tile' }))

test('a feed item runs in from its first render, staggered by its position', () => {
  render(<ViewEntrance kind="feed" index={3}>row</ViewEntrance>)
  const el = screen.getByText('row')
  expect(el).toHaveClass('feed')
  expect(el.style.getPropertyValue('--i')).toBe('3')
})

test('a tile rises and settles', () => {
  render(<ViewEntrance kind="tile" index={0}>tile</ViewEntrance>)
  expect(screen.getByText('tile')).toHaveClass('tile')
})

test('does not animate when told not to, and keeps its own classes and style', () => {
  render(<ViewEntrance kind="feed" index={0} play={false} className="flex" style={{ flex: '1 1 0%' }}>row</ViewEntrance>)
  const el = screen.getByText('row')
  expect(el).not.toHaveClass('feed')
  expect(el).toHaveClass('flex')
  expect(el.style.flex).toBe('1 1 0%')
})

test('reads play once, so a running entrance is never cut', () => {
  const { rerender } = render(<ViewEntrance kind="feed" index={0}>row</ViewEntrance>)
  rerender(<ViewEntrance kind="feed" index={0} play={false}>row</ViewEntrance>)
  expect(screen.getByText('row')).toHaveClass('feed')
})

test('says when its own entrance starts, not a child animation', () => {
  const onStart = jest.fn()
  render(<ViewEntrance kind="feed" index={0} onStart={onStart}><span>child</span></ViewEntrance>)
  fireEvent.animationStart(screen.getByText('child'))
  expect(onStart).not.toHaveBeenCalled()
  fireEvent.animationStart(screen.getByText('child').parentElement!)
  expect(onStart).toHaveBeenCalledTimes(1)
})
