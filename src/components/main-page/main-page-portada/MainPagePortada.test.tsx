import { render, screen } from '@testing-library/react'
import MainPagePortada from './MainPagePortada'
import { useRecentFeed } from '@/hooks/useRecentFeed'
import { en } from '@/translations/en'

jest.mock('@/hooks/useRecentFeed', () => ({ useRecentFeed: jest.fn() }))

const steamItem = {
  source: 'steam', key: 's', lastPlayed: null,
  game: { _source: 'steam', id: 620, title: 'Portal 2', consoleName: 'PC', imageIcon: '', maxPossible: 51, numAwarded: 40, pctWon: 78, lastPlayed: null },
}

test('shows the game played last, with its progress and a way in', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: false })
  render(<MainPagePortada />)
  expect(screen.getByRole('heading', { name: 'Portal 2' })).toBeInTheDocument()
  expect(screen.getByText('40 / 51')).toBeInTheDocument()
  expect(screen.getByText(en.homeLayout.continueKicker)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: new RegExp(en.homeLayout.openGame) })).toHaveAttribute('href', '/steamGame/620')
})

test('draws nothing while loading or without a game', () => {
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [steamItem], loading: true })
  const { container, rerender } = render(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
  ;(useRecentFeed as jest.Mock).mockReturnValue({ feed: [], loading: false })
  rerender(<MainPagePortada />)
  expect(container).toBeEmptyDOMElement()
})
