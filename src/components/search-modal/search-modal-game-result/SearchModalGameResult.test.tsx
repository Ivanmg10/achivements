import { render, screen, fireEvent } from '@testing-library/react'
import SearchModalGameResult from './SearchModalGameResult'
import { en } from '@/translations/en'
import type { GameCandidate } from '@/utils/gameCandidates'

jest.mock('next/image', () => ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />)

const BASE: GameCandidate = {
  key: 'ra:1', source: 'ra', id: 1, title: 'Zelda', subtitle: 'SNES', imageRef: '/Images/1.png',
  pctWon: 1, numAwarded: 10, maxPossible: 10, status: 'completed-hc',
}

test('shows an RA game with its console, icon and status in words', () => {
  const { container } = render(<SearchModalGameResult game={BASE} onSelect={jest.fn()} />)
  expect(screen.getByText('Zelda')).toBeInTheDocument()
  expect(screen.getByText('SNES')).toBeInTheDocument()
  expect(screen.getByText(en.search.completedHC)).toBeInTheDocument()
  expect(container.querySelector('img')?.getAttribute('src')).toBe('https://retroachievements.org/Images/1.png')
})

test('a perfect Steam game reads Steam and Perfect', () => {
  render(
    <SearchModalGameResult
      game={{ ...BASE, key: 'steam:620', source: 'steam', id: 620, title: 'Portal 2', subtitle: 'Steam', imageRef: 'https://cdn/i.jpg', status: 'perfect' }}
      onSelect={jest.fn()}
    />,
  )
  expect(screen.getByText('Steam')).toBeInTheDocument()
  expect(screen.getByText(en.steam.perfect)).toBeInTheDocument()
})

test('no pill for a game without a status, and a placeholder without an icon', () => {
  const { container } = render(
    <SearchModalGameResult game={{ ...BASE, status: null, imageRef: '' }} onSelect={jest.fn()} />,
  )
  expect(screen.queryByText(en.search.completedHC)).not.toBeInTheDocument()
  // Scoped to the icon slot: a direct child of the button. The platform logo
  // next to the subtitle is nested deeper and always renders.
  expect(container.querySelector('button > img')).toBeNull()
})

test('marks an RA game with the RA logo, a Steam one with the Steam logo', () => {
  const { container, rerender } = render(<SearchModalGameResult game={BASE} onSelect={jest.fn()} />)
  const logoSrcs = Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
  expect(logoSrcs).toContain('/media/ra-logo.webp')
  expect(screen.queryByTestId('steam-logo')).not.toBeInTheDocument()

  rerender(
    <SearchModalGameResult
      game={{ ...BASE, source: 'steam', subtitle: 'Steam' }}
      onSelect={jest.fn()}
    />,
  )
  expect(screen.getByTestId('steam-logo')).toBeInTheDocument()
})

test('selects on click', () => {
  const onSelect = jest.fn()
  render(<SearchModalGameResult game={BASE} onSelect={onSelect} />)
  fireEvent.click(screen.getByRole('button', { name: /Zelda/ }))
  expect(onSelect).toHaveBeenCalled()
})
