import { fireEvent, render, screen } from '@testing-library/react'
import Figure from './Figure'

test('bare: a kicker over the figure, in its tone, with the line under it', () => {
  render(<Figure label="Vault Points" value="143,820" sub="this week +48" tone="hardcore" />)
  expect(screen.getByText('Vault Points')).toHaveClass('uppercase')
  expect(screen.getByText('143,820')).toHaveClass('text-hardcore')
  expect(screen.getByText('this week +48')).toBeInTheDocument()
})

test('a colour that is not a theme one wins over the tone', () => {
  render(<Figure label="Streak" value="12" tone="accent" color="rgb(1 2 3)" />)
  const value = screen.getByText('12')
  expect(value).not.toHaveClass('text-accent')
  expect(value).toHaveStyle({ color: 'rgb(1, 2, 3)' })
})

test('card: the number in the reader\'s language, the label first; compact inside a list is a term and its description', () => {
  const { container, rerender } = render(<Figure look="card" label="Games" value={1234} />)
  expect(screen.getByText((1234).toLocaleString('en'))).toHaveClass('text-2xl')
  rerender(<dl><Figure look="card" compact term label="Games" value="12" /></dl>)
  expect(container.querySelector('dt')).toHaveTextContent('Games')
  expect(container.querySelector('dd')).toHaveTextContent('12')
  expect(container.querySelector('dd')).toHaveClass('text-xl')
})

test('a bare figure renders its label, value and sub line; a plain one is no link and no button', () => {
  render(<Figure label="Rank" value="#42" sub="1,000 pts" />)
  expect(screen.getByText('Rank')).toBeInTheDocument()
  expect(screen.getByText('#42')).toBeInTheDocument()
  expect(screen.getByText('1,000 pts')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})

test('a pressed bare figure leans its hover on the slant, and is a tile, never a chip', () => {
  const { container } = render(<Figure label="Today" value="3" onClick={() => {}} />)
  expect(screen.getByRole('button')).toHaveClass('after:skew-x-(--slant-pill)', 'hover:after:bg-ink/5')
  expect(container.firstChild).toHaveClass('min-w-24', 'px-3', 'rounded-tile')
  expect(container.firstChild).not.toHaveClass('rounded-chip')
})

test('a figure uses theme text tokens by default, and a tone overrides them', () => {
  const { rerender } = render(<Figure look="card" label="Games" value="10" />)
  expect(screen.getByText('10').className).toContain('text-text-main')
  expect(screen.getByText('10').className).not.toContain('text-white')
  rerender(<Figure look="card" label="Perfect" value="5" tone="warning" />)
  expect(screen.getByText('5').className).toContain('text-warning')
  rerender(<Figure look="tile" label="Platinum" value="5" tone="platinum" />)
  expect(screen.getByText('5').className).toContain('text-platinum')
})

test('a bare figure on its way keeps the line under its figure, so the row does not grow when it lands', () => {
  const { container, rerender } = render(<Figure label="Today" value="" loading />)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(2)
  rerender(<Figure label="Level" value="" sub="Steam" loading />)
  expect(container.querySelectorAll('.bg-skeleton')).toHaveLength(1)
  expect(screen.getByText('Steam')).toBeInTheDocument()
})

test('a card on its way hides its number', () => {
  const { container } = render(<Figure look="card" label="Games" value="12" loading />)
  expect(screen.queryByText('12')).not.toBeInTheDocument()
  expect(container.querySelector('.bg-skeleton')).toBeInTheDocument()
})

test('a figure on its way keeps its room and its label', () => {
  const { container } = render(<Figure look="tile" label="Today" value="" loading />)
  expect(screen.getByText('Today')).toBeInTheDocument()
  expect(container.querySelector('.bg-skeleton')).toHaveClass('h-[1lh]')
})

test('with onClick it is a button, with href a link', () => {
  const onClick = jest.fn()
  const { rerender } = render(<Figure label="Games" value="3" onClick={onClick} />)
  fireEvent.click(screen.getByRole('button', { name: /Games/ }))
  expect(onClick).toHaveBeenCalled()
  rerender(<Figure label="Games" value="3" href="/library" />)
  expect(screen.getByRole('link', { name: /Games/ })).toHaveAttribute('href', '/library')
})
