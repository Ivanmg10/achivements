import { render, screen } from '@testing-library/react'
import PerfectPodium from './PerfectPodium'
import { en } from '@/translations/en'
import type { LatestPerfect } from '@/utils/perfectGames'

jest.mock('@/hooks/useRaBoxArt', () => ({ useRaBoxArt: () => ({ 1: 'https://retroachievements.org/Images/box1.png' }) }))

const game = (id: number, source: 'ra' | 'steam', title: string): LatestPerfect => ({
  key: `${source}:${id}`, source, id, title, subtitle: 'SNES', date: '2024-05-01T00:00:00Z', hardcore: true,
  iconUrl: source === 'ra' ? `https://retroachievements.org/Images/icon${id}.png` : undefined,
})

test('nothing to stand on the podium, no podium', () => {
  const { container } = render(<PerfectPodium games={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('lists them newest first, each with its place and a link to its page', () => {
  render(<PerfectPodium games={[game(1, 'ra', 'Zelda'), game(620, 'steam', 'Portal 2'), game(2, 'ra', 'Metroid')]} />)
  expect(screen.getByText(en.cards.latestPerfects)).toBeInTheDocument()
  const items = screen.getAllByRole('listitem')
  expect(items.map((li) => li.textContent?.slice(-1))).toEqual(['1', '2', '3'])
  expect(screen.getByRole('link', { name: /Zelda/ })).toHaveAttribute('href', '/gameInfo/1')
  expect(screen.getByRole('link', { name: /Portal 2/ })).toHaveAttribute('href', '/steamGame/620')
})

test('uses the box art when it has it, the icon otherwise', () => {
  const { container } = render(<PerfectPodium games={[game(1, 'ra', 'Zelda'), game(2, 'ra', 'Metroid')]} />)
  const srcs = [...container.querySelectorAll('img')].map((i) => i.getAttribute('src'))
  expect(srcs).toContain('https://retroachievements.org/Images/box1.png')
  expect(srcs).toContain('https://retroachievements.org/Images/icon2.png')
})
