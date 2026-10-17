jest.mock('./main-page-pinned-section-achievements/MainPagePinnedSectionAchievements', () => ({ __esModule: true, default: () => <div data-testid="achievements" /> }))
jest.mock('./main-page-pinned-section-games/MainPagePinnedSectionGames', () => ({ __esModule: true, default: () => <div data-testid="games" /> }))

import { render, screen } from '@testing-library/react'
import MainPagePinnedSection from './MainPagePinnedSection'

test('the pinned achievements first, the pinned games under them', () => {
  render(<MainPagePinnedSection />)
  const [achievements, games] = [screen.getByTestId('achievements'), screen.getByTestId('games')]
  expect(achievements.compareDocumentPosition(games) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
