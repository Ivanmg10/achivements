import { fireEvent, render, screen } from '@testing-library/react'
import MainPageProfileRecent from './MainPageProfileRecent'
import MainPageProfileRecentRow from './main-page-profile-recent-row/MainPageProfileRecentRow'
import { en } from '@/translations/en'

test('its title and the rows, as a list', () => {
  render(
    <MainPageProfileRecent title="Recent achievements">
      {[<MainPageProfileRecentRow key="1" href="/g/1" badge="b.png" hardcore title="Bulky" sub="Pokémon · 24 Oct" right={10} />]}
    </MainPageProfileRecent>,
  )
  expect(screen.getByText('Recent achievements')).toBeInTheDocument()
  const row = screen.getByRole('listitem')
  expect(row.querySelector('a')).toHaveAttribute('href', '/g/1')
  expect(row.querySelector('img')!.style.boxShadow).toContain('--hardcore')
  expect(screen.getByText('10')).toBeInTheDocument()
})

test('its loading rows sit like the real ones, with no gap, or the column drops when they land', () => {
  const { container } = render(<MainPageProfileRecent title="T" loading />)
  expect(container.querySelector('[aria-busy="true"]')).not.toHaveClass('gap-1')
})

test('loading: shapes; none: a quiet empty state', () => {
  const { container, rerender } = render(<MainPageProfileRecent title="T" loading />)
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
  rerender(<MainPageProfileRecent title="T">{[]}</MainPageProfileRecent>)
  expect(screen.getByText(en.cards.noEarned)).toBeInTheDocument()
})

test('an error says so, with a retry', () => {
  const retry = jest.fn()
  render(<MainPageProfileRecent title="T" error="Could not load" onRetry={retry} retryLabel="Retry" />)
  expect(screen.getByRole('alert')).toHaveTextContent('Could not load')
  fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(retry).toHaveBeenCalled()
})

test('a row without a badge or a figure', () => {
  render(<ol><MainPageProfileRecentRow href="/g" badge={null} title="X" sub="Y" /></ol>)
  expect(screen.getByRole('link').querySelector('img')).toBeNull()
})
