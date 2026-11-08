import { render, screen } from '@testing-library/react'
import Tag from './Tag'

test('a tag is a tinted label in its tone, upright even inside an italic title', () => {
  render(<h1 className="italic">Rankings <Tag tone="accent">Beta</Tag></h1>)
  const tag = screen.getByText('Beta')
  expect(tag).toHaveClass('bg-accent/15', 'text-accent', 'rounded-tag', 'not-italic', 'font-sans')
})

test('the default is the quiet tone at the middle size', () => {
  render(<Tag>PS5</Tag>)
  expect(screen.getByText('PS5')).toHaveClass('bg-ink/[0.07]', 'text-text-secondary', 'h-[1.375rem]')
})

test('a slanted tag leans on the design token and keeps its text upright', () => {
  render(<Tag slant size="lg" tone="danger">2 missable</Tag>)
  const inner = screen.getByText('2 missable')
  expect(inner).toHaveClass('-skew-x-(--slant-pill)')
  expect(inner.parentElement).toHaveClass('skew-x-(--slant-pill)', 'h-6', 'text-danger')
})
