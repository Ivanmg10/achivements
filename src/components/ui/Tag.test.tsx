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

test('a platform is a tone, in words as well, and a row\'s console takes the smallest size', () => {
  render(<Tag size="xs" tone="steam">Steam</Tag>)
  expect(screen.getByText('Steam')).toHaveClass('bg-steam-dark', 'text-steam', 'rounded-tag-sm', 'text-[10px]')
})

test('a tier\'s hue comes from style, and the title names it', () => {
  render(<Tag tone="custom" title="Level 3" style={{ color: 'rgb(1, 2, 3)' }}>Lv 3</Tag>)
  expect(screen.getByText('Lv 3')).toHaveAttribute('title', 'Level 3')
  expect(screen.getByText('Lv 3')).toHaveStyle({ color: 'rgb(1, 2, 3)' })
})

test('a slanted tag leans on the design token and keeps its text upright', () => {
  render(<Tag slant size="lg" tone="danger">2 missable</Tag>)
  const inner = screen.getByText('2 missable')
  expect(inner).toHaveClass('-skew-x-(--slant-pill)')
  expect(inner.parentElement).toHaveClass('skew-x-(--slant-pill)', 'h-6', 'text-danger')
})
