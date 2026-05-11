import { render } from '@testing-library/react'
import Spinner from './Spinner'

test('renders SVG spinner by default', () => {
  const { container } = render(<Spinner />)
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('renders small CSS ring when size < 20', () => {
  const { container } = render(<Spinner size={12} />)
  expect(container.querySelector('div')).toBeInTheDocument()
  expect(container.querySelector('svg')).toBeNull()
})

test('renders SVG when size >= 20', () => {
  const { container } = render(<Spinner size={20} />)
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('renders large variant when size >= 36', () => {
  const { container } = render(<Spinner size={45} />)
  const svg = container.querySelector('svg')
  expect(svg).toBeInTheDocument()
  expect(svg?.getAttribute('width')).toBe('45')
})
