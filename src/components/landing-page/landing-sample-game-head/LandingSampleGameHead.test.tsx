import { render, screen } from '@testing-library/react'
import LandingSampleGameHead from './LandingSampleGameHead'
import { SAMPLE_GAME_PAGE } from '@/components/landing-page/landingSamples'

test('the game, its platform and how far along it is', () => {
  render(<LandingSampleGameHead />)
  expect(screen.getByText(SAMPLE_GAME_PAGE.title)).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: SAMPLE_GAME_PAGE.title })).toBeInTheDocument()
  expect(document.body).toHaveTextContent(`${SAMPLE_GAME_PAGE.earned} of ${SAMPLE_GAME_PAGE.total} achievements`)
  expect(document.body).toHaveTextContent('46%')
})
