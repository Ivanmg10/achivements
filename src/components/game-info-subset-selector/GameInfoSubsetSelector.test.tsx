jest.mock('@/components/ui/FadeImage', () => ({
  FadeImage: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { render, screen } from '@testing-library/react'
import GameInfoSubsetSelector from './GameInfoSubsetSelector'
import type { SubsetGame } from '@/types/types'
import { en } from '@/translations/en'

const SUBSETS = [
  { ID: 20, Title: 'Sonic [Subset - Bonus]', ImageIcon: '/Images/20.png' },
  { ID: 21, Title: 'Sonic [Subset - Multi]', ImageIcon: '' },
] as SubsetGame[]

const links = () => screen.getAllByRole('link')

test('holds the places while the subsets are being looked up, hidden from assistive tech', () => {
  const { container } = render(
    <GameInfoSubsetSelector currentId={7} parentId={null} parentIcon="" subsets={[]} isLoading />,
  )
  expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})

test('a game with no subsets and no parent shows nothing', () => {
  const { container } = render(<GameInfoSubsetSelector currentId={7} parentId={null} parentIcon="" subsets={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('a main game lists itself first, then each subset, named by the label in its title', () => {
  render(<GameInfoSubsetSelector currentId={7} parentId={7} parentIcon="/Images/7.png" subsets={SUBSETS} />)
  expect(links().map((l) => l.textContent)).toEqual(['Main game', 'Bonus', 'Multi'])
  expect(links().map((l) => l.getAttribute('href'))).toEqual(['/gameInfo/7', '/gameInfo/20', '/gameInfo/21'])
})

test('on a subset, the first tab leads back to the main game', () => {
  render(<GameInfoSubsetSelector currentId={20} parentId={7} parentIcon="/Images/7.png" subsets={SUBSETS} />)
  expect(links()[0]).toHaveAttribute('href', '/gameInfo/7')
})

test('icons come from RetroAchievements; a tab with none still gets a placeholder', () => {
  const { container } = render(<GameInfoSubsetSelector currentId={7} parentId={7} parentIcon="/Images/7.png" subsets={SUBSETS} />)
  // The name is written beside it, so the picture says nothing more to a screen reader.
  expect(container.querySelector('img[src="https://retroachievements.org/Images/7.png"]')).toHaveAttribute('alt', '')
  expect(container.querySelectorAll('img')).toHaveLength(2)
  expect(container.querySelectorAll('span.w-9[aria-hidden="true"]')).toHaveLength(1)
})

test('a title without the subset marker is used whole', () => {
  render(
    <GameInfoSubsetSelector
      currentId={7}
      parentId={7}
      parentIcon=""
      subsets={[{ ID: 30, Title: 'Plain title', ImageIcon: '' }] as SubsetGame[]}
    />,
  )
  expect(links()[1]).toHaveTextContent('Plain title')
})

test('a parent with no subsets still shows the main game tab', () => {
  render(<GameInfoSubsetSelector currentId={20} parentId={7} parentIcon="" subsets={[]} />)
  expect(links()).toHaveLength(1)
})

test('the sets are a labelled navigation, and the open one is the current page, marked', () => {
  render(<GameInfoSubsetSelector currentId={20} parentId={7} parentIcon="" subsets={SUBSETS} />)
  expect(screen.getByRole('navigation', { name: en.gameInfoPage.achievementSets })).toBeInTheDocument()
  expect(links()[1]).toHaveAttribute('aria-current', 'page')
  expect(links()[1].querySelector('[aria-hidden="true"].text-accent')).not.toBeNull()
  expect(links()[0]).not.toHaveAttribute('aria-current')
})
