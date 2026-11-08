import { fireEvent, render, screen } from '@testing-library/react'
import Avatar from './Avatar'

test('without a picture it shows the initial, hidden from a screen reader', () => {
  const { container } = render(<Avatar name="palmera" size={56} />)
  const initial = screen.getByText('P')
  expect(initial).toHaveAttribute('aria-hidden', 'true')
  expect(initial).toHaveStyle({ width: '56px', fontSize: '20px' })
  expect(container.querySelector('img')).toBeNull()
})

test('the icon fallback draws a person instead of the initial', () => {
  const { container } = render(<Avatar name="palmera" fallback="icon" />)
  expect(screen.queryByText('P')).toBeNull()
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('a picture that fails gives way to the fallback', () => {
  const { container } = render(<Avatar name="palmera" src="https://example.com/a.png" />)
  fireEvent.error(container.querySelector('img')!)
  expect(screen.getByText('P')).toBeInTheDocument()
})

test('online, the dot says so when asked to; offline, there is none', () => {
  const { rerender } = render(<Avatar name="palmera" online announce />)
  expect(screen.getByRole('img', { name: 'Online' })).toBeInTheDocument()
  rerender(<Avatar name="palmera" online={false} announce />)
  expect(screen.queryByRole('img')).toBeNull()
})
