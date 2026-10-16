import { render, screen } from '@testing-library/react'
import LazyWhenOpened from './LazyWhenOpened'

const Modal = () => <div data-testid="modal" />

test('renders nothing while it has never been open', () => {
  render(<LazyWhenOpened open={false}><Modal /></LazyWhenOpened>)
  expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
})

test('renders from the first time it is open, and keeps rendering after it closes', () => {
  const { rerender } = render(<LazyWhenOpened open={false}><Modal /></LazyWhenOpened>)
  rerender(<LazyWhenOpened open><Modal /></LazyWhenOpened>)
  expect(screen.getByTestId('modal')).toBeInTheDocument()
  rerender(<LazyWhenOpened open={false}><Modal /></LazyWhenOpened>)
  expect(screen.getByTestId('modal')).toBeInTheDocument()
})

test('open from the start renders at once', () => {
  render(<LazyWhenOpened open><Modal /></LazyWhenOpened>)
  expect(screen.getByTestId('modal')).toBeInTheDocument()
})
