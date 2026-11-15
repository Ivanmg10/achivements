import { fireEvent, render, screen } from '@testing-library/react'
import ListRow from './ListRow'

test('a row is a button named by its title and line, with its media and trailing slot', () => {
  const onClick = jest.fn()
  render(<ListRow media={<span>icon</span>} title="Celeste" sub="Steam · 42 %" trailing={<span>›</span>} onClick={onClick} data-search-option />)
  const row = screen.getByRole('button', { name: /Celeste/ })
  expect(row).toHaveAttribute('type', 'button')
  expect(row).toHaveAttribute('data-search-option')
  expect(row).toHaveTextContent('Steam · 42 %')
  fireEvent.click(row)
  expect(onClick).toHaveBeenCalled()
})

test('with href it is a link that looks the same', () => {
  render(<ListRow href="/game/1" media={null} title="Celeste" />)
  expect(screen.getByRole('link', { name: 'Celeste' })).toHaveAttribute('href', '/game/1')
})
