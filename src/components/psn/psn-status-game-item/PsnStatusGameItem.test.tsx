jest.mock('@/components/psn/psn-library-detail/PsnLibraryDetail', () => ({
  __esModule: true,
  default: ({ game, category }: { game: { titleId: string }; category?: string }) => (
    <div data-testid="trophies">{game.titleId}:{category}</div>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import PsnStatusGameItem from './PsnStatusGameItem'
import { en } from '@/translations/en'
import type { PsnGameProgress } from '@/types/psn'
import { psnGameFixture } from '@/test-utils/psnFixtures'

const GAME: PsnGameProgress = psnGameFixture({
  id: 100,
  titleId: 'NPWR00001_00',
  title: 'Astro Bot',
  consoleName: 'PS5',
  maxPossible: 45,
  numAwarded: 20,
  pctWon: 44,
  earned: { bronze: 10, silver: 6, gold: 4, platinum: 0 },
  defined: { bronze: 30, silver: 10, gold: 4, platinum: 1 },
})

test('the console is the chip, the trophies are counted by grade', () => {
  render(<PsnStatusGameItem game={GAME} />)
  expect(screen.getByText('PS5')).toBeInTheDocument()
  expect(screen.getByText('20 / 45 trophies')).toBeInTheDocument()
})

test('the platinum chip comes with the platinum, even before the whole set is done', () => {
  const { container, unmount } = render(<PsnStatusGameItem game={{ ...GAME, earned: { ...GAME.earned, platinum: 1 } }} />)
  expect(container.textContent).toContain(`★ ${en.psn.platinum}`)
  unmount()
  const { container: without } = render(<PsnStatusGameItem game={GAME} />)
  expect(without.textContent).not.toContain('★')
})

test('opens its trophies for the list it is in', () => {
  render(<PsnStatusGameItem game={GAME} category="completed" />)
  fireEvent.click(screen.getByRole('button', { name: `${en.psn.showTrophies}: Astro Bot` }))
  expect(screen.getByTestId('trophies')).toHaveTextContent('NPWR00001_00:completed')
})
