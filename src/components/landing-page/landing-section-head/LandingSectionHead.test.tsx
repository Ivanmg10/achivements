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

test('what the feature does, in short points led by the mark', () => {
  render(<LandingSectionHead title="T" text="x" points={['One.', 'Two.']} />)
  const items = screen.getAllByRole('listitem')
  expect(items.map((li) => li.textContent)).toEqual(['One.', 'Two.'])
  expect(items[0].querySelector('[aria-hidden="true"]')).toHaveClass('before:content-(--mark)')
})
