import { render, screen } from '@testing-library/react'
import LandingSectionHead from './LandingSectionHead'

test('a title in the display italic, its paragraph, then what the section adds', () => {
  render(<LandingSectionHead id="t" title="Title" text="Text."><button type="button">More</button></LandingSectionHead>)
  const h2 = screen.getByRole('heading', { level: 2, name: 'Title' })
  expect(h2).toHaveAttribute('id', 't')
  expect(h2).toHaveClass('font-display', 'italic')
  expect(screen.getByText('Text.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'More' })).toBeInTheDocument()
})

test('`row` puts the paragraph beside the title on a wide screen', () => {
  const { container } = render(<LandingSectionHead title="T" text="x" row />)
  expect(container.firstElementChild).toHaveClass('lg:flex-row')
})
