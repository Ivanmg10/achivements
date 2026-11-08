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
