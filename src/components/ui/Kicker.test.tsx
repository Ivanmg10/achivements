import { render, screen } from '@testing-library/react'
import Kicker, { kickerClass } from './Kicker'
import SectionHead from './SectionHead'

test('a kicker is an uppercase label in the quiet colour by default, as the element asked for', () => {
  render(<Kicker as="span" role="alert">Failed</Kicker>)
  const el = screen.getByRole('alert')
  expect(el.tagName).toBe('SPAN')
  expect(el).toHaveClass('uppercase', 'text-text-secondary', 'tracking-widest')
})

test('its tone and size come from the piece, never from className', () => {
  expect(kickerClass('accent', 'md')).toContain('text-accent')
  expect(kickerClass('accent', 'md')).toContain('tracking-[0.14em]')
  expect(kickerClass('danger', 'sm')).toContain('text-danger')
  expect(kickerClass('warning', 'xs')).toContain('text-warning')
  expect(kickerClass('inherit', 'xs')).not.toContain('text-text')
})

test('a section head names its section and puts its aside at the end', () => {
  render(
    <section aria-labelledby="h">
      <SectionHead id="h" title="Best streaks" hint="Your longest" aside={<button type="button">See all</button>} />
    </section>,
  )
  expect(screen.getByRole('region', { name: 'Best streaks' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 2, name: 'Best streaks' })).toBeInTheDocument()
  expect(screen.getByText('Your longest')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'See all' }).parentElement).toHaveClass('ml-auto')
})

test('a section head can be another heading level and the larger size', () => {
  render(<SectionHead as="h3" size="lg" title="Year" />)
  expect(screen.getByRole('heading', { level: 3, name: 'Year' })).toHaveClass('text-[1.0625rem]')
})
