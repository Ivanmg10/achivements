jest.mock('@/components/xbox/xbox-library-detail/XboxLibraryDetail', () => ({
  __esModule: true,
  default: ({ game, category }: { game: { titleId: string }; category?: string }) => (
    <div data-testid="detail">{game.titleId}:{category}</div>
  ),
}))

import { render, screen, fireEvent } from '@testing-library/react'
import XboxStatusGameItem from './XboxStatusGameItem'
import { en } from '@/translations/en'
import { xboxGameFixture } from '@/test-utils/xboxFixtures'

const GAME = xboxGameFixture({
  id: 1738914043, titleId: '1738914043', title: 'Halo', consoleName: 'Xbox Series · PC', maxPossible: 45, numAwarded: 20, totalKnown: true,
  pctWon: 44, earnedGamerscore: 300, totalGamerscore: 1000,
})

test('the console is the chip and the gamerscore sits under the bar', () => {
  render(<XboxStatusGameItem game={GAME} />)
  expect(screen.getByText('Xbox Series · PC')).toBeInTheDocument()
  expect(screen.getByText('20 / 45 achievements')).toBeInTheDocument()
  expect(screen.getByText('300')).toBeInTheDocument()
})

test('a game whose total Xbox does not say is written with what is earned', () => {
  render(<XboxStatusGameItem game={{ ...GAME, totalKnown: false, maxPossible: 0, pctWon: 14 }} />)
  expect(screen.getByText('20 achievements')).toBeInTheDocument()
})

test('opens its detail for the list it is in', () => {
  render(<XboxStatusGameItem game={GAME} category="completed" />)
  fireEvent.click(screen.getByRole('button', { name: `${en.xbox.showAchievements}: Halo` }))
  expect(screen.getByTestId('detail')).toHaveTextContent('1738914043:completed')
})
